# Email setup and operations

The email service for [Rotations.lol](https://rotations.lol) notifies players when League of Legends cosmetics on their wishlists become available. It uses React Email templates, Supabase for queue management, and Amazon SES for delivery.

## How it works

After a successful ingestion run, the worker queues active wishlist matches and sends each recipient one email containing their pending items across shop types. The unique `(UserID, ItemID, SaleID)` key prevents duplicate notifications for the same sale. A returning item with a new sale ID can produce a new notification.

Email eligibility and insertion run through `queue_wishlist_sale_emails()`. Rendering fields come from the private API cache, with queries for individual pending records when the cache is unavailable or incomplete. Delivery starts once all required rendering data is available. `record_wishlist_email_delivery()` records results for the exact queue entries in each batch.

An exclusive lock prevents overlapping managed batches. Completion markers allow each successful ingestion run to trigger a batch once, including delayed runs. Failed deliveries are not retried automatically. If SES accepts an email but recording its status fails, inspect the logs before retrying because delivery may already have occurred.

## Local development

Install dependencies and start the template preview server.

```sh
npm install
npm run dev
```

The notification template is in `emails/Wishlist-Notification.tsx`.

For queue and delivery scripts, configure a private `.env` file with the following variables. Use a local Supabase instance for development.

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | The local Supabase API URL. |
| `SUPABASE_KEY` | The local service role key for queue operations. |
| `AWS_REGION` | The SES region. |
| `AWS_ACCESS_KEY` | The SES sender access key. |
| `AWS_SECRET_KEY` | The SES sender secret key. |
| `FROM_EMAIL` | A verified SES sender address. |
| `DISCORD_WEBHOOK_URL` | An optional webhook for processing notifications. |
| `DISCORD_MENTION_ROLE_ID` | An optional role mentioned for warnings and errors. |
| `EMAIL_PUBLIC_API_URL` | The private API cache endpoint. |
| `EMAIL_PUBLIC_API_SECRET` | The private API bearer secret. |

Apply the backend email migration from [rotations-ingestion](https://github.com/zandonella/rotations-ingestion) before using the queue scripts. The [public API service](https://github.com/zandonella/rotations-api) provides the rendering cache.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Preview email templates locally. |
| `npm run build` | Build the email preview application. |
| `npm run export` | Export rendered email templates. |
| `npm run pull-sales` | Queue current eligible wishlist matches. |
| `npm run send-emails` | Send pending notifications through SES. |
| `npm run emails:run-now` | Run a managed catch-up batch. |
| `npm test` | Run the unit tests. |
| `npm run test:local-db` | Verify queueing, rendering, and status updates against the isolated local database. |

Delivery commands send real email using the configured credentials. To send a sample notification to an address you control, configure the managed sender environment and run the following command.

```sh
npm run test-email -- --to you@example.com
```

The sample sender leaves the customer queue untouched. The local database test uses Supabase at `127.0.0.1:55421`, requires sibling ingestion and API checkouts, and renders synthetic notifications without sending email or loading AWS credentials.

## Managed deployment

The ingestion repository provides Linux service templates under `deploy/linux-production/` and a [deployment guide](https://github.com/zandonella/rotations-ingestion/blob/main/docs/linux-production.md). Configure SES settings in a private `production/email.env` outside the repository. The managed worker receives Supabase and Discord configuration from ingestion.

Batch logs are retained in `data/logs` and uploaded to the Supabase `logs` bucket. Service status and journal entries are available through systemd.

```sh
systemctl --user status rotations-production-email.service
journalctl --user -u rotations-production-email.service
```
