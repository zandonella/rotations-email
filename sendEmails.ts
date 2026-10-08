import { supabase } from './lib/supabase.ts';
import { DiscordLogger } from './lib/discordLogger.ts';
import { getPendingEmailLogs, groupEmailLogsByUser, updateEmailLogStatuses } from './lib/emailQueue.ts';
import type { EmailLogRecord, EmailStatus } from './lib/types.ts';
import { sendWishlistEmail } from './sendRenderedEmail.tsx';
import Bottleneck from 'bottleneck';

const logger = new DiscordLogger('sendEmails');

async function sendEmail(items: EmailLogRecord[]) {
    const senderEmail = items[0].Profile.email;

    const result = await sendWishlistEmail(senderEmail, items);

    if (!result.success) {
        console.error(result.errorMessage);
    }

    return result.success;
}

async function processEmailLogs(logs: EmailLogRecord[]) {
    const succeeded = await sendEmail(logs);
    if (!succeeded) {
        await logger.error(
            `Error sending wishlist email batch for user ${logs[0].UserID} (${logs.length} items).`,
        );
    }

    if (!succeeded) process.exitCode = 1;
    const newStatus: EmailStatus = succeeded ? 'SENT' : 'FAILED';
    await updateEmailLogStatuses(supabase, logs, newStatus);
    console.log(
        `Processed email for user ${logs[0].UserID}: ${newStatus} (${logs.length} items)`,
    );
}

const limiter = new Bottleneck({
    minTime: 100,
    maxConcurrent: 1,
});

async function main() {
    const pendingEmailLogs = await getPendingEmailLogs(supabase);
    const emailLogsByUser = groupEmailLogsByUser(pendingEmailLogs);

    await Promise.all(
        Object.values(emailLogsByUser).map((logs) =>
            limiter.schedule(() => processEmailLogs(logs)),
        ),
    );

    const summary = `Processed ${
        Object.keys(emailLogsByUser).length
    } user emails containing ${pendingEmailLogs.length} items.`;
    console.log(summary);
    return { summary, processedCount: Object.keys(emailLogsByUser).length };
}

main()
    .then(async ({ summary, processedCount }) => {
        await logger.finish(summary, processedCount);
    })
    .catch(async (error: unknown) => {
        console.error('Unexpected error in sendEmails:', error);
        await logger.error('Unexpected error while sending wishlist emails.');
        await logger.finish();
        process.exitCode = 1;
    });
