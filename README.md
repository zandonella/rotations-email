# Rotations.lol wishlist emails

Sends email notifications when League of Legends cosmetics on a [Rotations.lol](https://rotations.lol) wishlist become available. Templates use React Email, Supabase manages the queue, and Amazon SES delivers messages.

## How it works

1. A successful ingestion run triggers the managed email worker.
2. The worker queues eligible wishlist matches and groups pending items by recipient.
3. Each recipient receives one email containing their pending matches across shop types.
4. The worker records delivery results for those queue entries.

A unique user, item, and sale key prevents duplicate notifications for the same sale. An item returning in a new sale can trigger another notification.

## Preview templates

```sh
npm install
npm run dev
```

The notification template is in `emails/Wishlist-Notification.tsx`. You can preview it without sending email.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Preview templates locally. |
| `npm run export` | Export rendered email templates. |
| `npm run pull-sales` | Queue eligible wishlist matches. |
| `npm run send-emails` | Send pending notifications through SES. |
| `npm run emails:run-now` | Run a managed catch-up batch. |
| `npm test` | Run unit tests. |
| `npm run test:local-db` | Check queueing and rendering against local Supabase without sending email. |

## Configuration and deployment

Queue processing requires a Supabase service role key. Delivery also requires SES credentials and a verified sender. Keep credentials in private environment files.

The [setup and operations guide](docs/operations.md) lists environment variables, sample email commands, delivery behavior, and Linux service configuration. The [ingestion repository](https://github.com/zandonella/rotations-ingestion) provides database migrations and managed service templates. The [API service](https://github.com/zandonella/rotations-api) supplies cached rendering data.

Delivery commands send real email. Failed deliveries are not retried automatically. If SES accepts a message but saving its status fails, inspect the logs before retrying to avoid duplicate delivery.
