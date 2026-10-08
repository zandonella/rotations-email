Hourly production batches run after completed ingestion at `:01 UTC`. Each
successful pull publishes a fresh UUID completion marker; the ingestion service's
`ExecStartPost` starts `rotations-production-email.service`. The worker rejects
stale/incomplete markers and consumes each successful run once. It has no
minute-of-hour gate, so delayed successful ingestion still triggers its emails.

Configure `production/email.env` with `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_REGION`, and `FROM_EMAIL`. Supabase and Discord configuration is already copied from ingestion. Keep this private file outside the repository.

Each batch queues all active wishlist sale matches, preserving the unique `(UserID, ItemID, SaleID)` key and `ignoreDuplicates: true`. Previously sent matches remain sent. Each recipient receives one email containing all pending matches, including matches across shop types. A new sale ID can generate a new notification for a previously notified item. A later wishlist addition can generate a later email for that sale, as in the original system.

An exclusive lock prevents overlapping managed batches. Successfully completed pull slots are recorded in `data/last-hourly-batch.json`. Failures stop dependent steps and cause a failed email service; ingestion status remains separate. Delivery status updates affect only rows included in the batch. The existing FAILED status policy is preserved: FAILED rows are not automatically retried. If SES accepts an email but database status recording fails, its pending records may be retried by a future batch; investigate the logs before retrying uncertain deliveries.

Local logs are kept in `data/logs` and uploaded to Supabase's `logs` bucket after each attempted batch. Missing SES configuration prevents any queue mutation or delivery, but its error log is still uploaded using Supabase credentials. Sales ingestion also captures and uploads each run to the same bucket under sales_*.log, retaining local files under production/rotations-ingestion/data/logs. Unit templates are under `../rotations-ingestion/deploy/linux-production/`.

Validation: `npm test`. Inspect operations with `systemctl --user status rotations-production-email.service` and `journalctl --user -u rotations-production-email.service`.

Send one test email through the existing SES sender and template with five sample wishlist items:

```bash
npm run test-email -- --to test@zando.dev
```

The test uses `production/email.env`, uploads its test log, and never reads or updates the customer queue. It reports SES acceptance; confirm inbox delivery and formatting separately.

Run one customer catch-up batch immediately:

```bash
npm run emails:run-now
```

This acquires the hourly batch lock and runs `pullSales.ts`, `sendEmails.ts`, then log upload. It bypasses the hourly scheduling check without consuming the next scheduled batch. Existing sent rows remain sent, so only pending matches are emailed.

Webhook notifications are sent only for newly queued wishlist email items, processed email batches, or warnings and errors. Empty runs and duplicate-only queue operations are quiet. Every warning and error mentions `DISCORD_MENTION_ROLE_ID`; success notifications do not mention the role.


Email eligibility and insertion run inside the service-role-only
`queue_wishlist_sale_emails()` RPC. Its sole response is the inserted count;
already-notified matches are not downloaded. Current sale windows and active
recipient status are checked in Postgres, and the original unique
`(UserID,ItemID,SaleID)` key preserves returning-sale behavior.

Pending reads project queue identities, recipient email, and Mythic `OfferID`.
The worker resolves public rendering fields from the private API cache using
`EMAIL_PUBLIC_API_URL` and `EMAIL_PUBLIC_API_SECRET`, defaulted from ingestion's
refresh destination/secret. `EMAIL_INGESTION_STARTED_AT` proves the cache has
confirmed this cycle. Unavailable/stale caches and missing offers use narrow
queries for the exact pending records. Rendering data must be complete before
any delivery starts. Delivery updates use `record_wishlist_email_delivery()` in
batches of at most 500 exact identities. Existing FAILED and uncertain-delivery
policies remain unchanged. Private `linux_email_status` enables independent
email monitoring. Apply the ingestion repository's backend email migration first.

`npm run test:local-db` uses isolated Supabase at `127.0.0.1:55421`, builds a real
API cache, queues synthetic wishlist matches, renders the real template, validates
batched status recording, and cleans its fixture rows. It never loads AWS
credentials or sends email. A standalone `npm run test-email -- --to ...` uses
the existing SES sample-email path and leaves the customer queue untouched.
