import { supabase } from './lib/supabase.ts';
import { DiscordLogger } from './lib/discordLogger.ts';
import type { EmailLogRecord, EmailStatus } from './lib/types.ts';
import { sendWishlistEmail } from './sendRenderedEmail.tsx';
import Bottleneck from 'bottleneck';

const logger = new DiscordLogger('sendEmails');

async function getPendingEmailLogs(): Promise<EmailLogRecord[]> {
    const { data, error } = await supabase
        .from('WishlistEmailLog')
        .select(
            '*, CatalogItem(*), Profile!inner(*), MythicSale(*), CatalogSale(*)',
        )
        .eq('Status', 'PENDING')
        .eq('Profile.EmailStatus', 'active');

    if (error) {
        console.error('Error fetching pending email logs:', error);
        await logger.error('Error fetching pending wishlist email logs.');
        return [];
    }

    return data;
}

function groupEmailLogsByUser(
    emailLogs: EmailLogRecord[],
): Record<string, EmailLogRecord[]> {
    const emailLogsByUser: Record<string, EmailLogRecord[]> = {};

    emailLogs.forEach((log) => {
        if (!emailLogsByUser[log.UserID]) {
            emailLogsByUser[log.UserID] = [];
        }
        emailLogsByUser[log.UserID].push(log);
    });

    return emailLogsByUser;
}

async function sendEmail(items: EmailLogRecord[]) {
    const senderEmail = items[0].Profile.email;

    const result = await sendWishlistEmail(senderEmail, items);

    if (!result.success) {
        console.error(result.errorMessage);
    }

    return result.success;
}

async function updateEmailLogStatuses(
    logs: EmailLogRecord[],
    status: EmailStatus,
) {
    const { error } = await supabase
        .from('WishlistEmailLog')
        .update({ Status: status, SentAt: new Date().toISOString() })
        .eq('UserID', logs[0].UserID)
        .eq('Status', 'PENDING');

    if (error) {
        console.error('Error updating email log statuses:', error);
        await logger.error(
            `Error updating email log statuses for user ${logs[0].UserID}.`,
        );
    }
}

async function processEmailLogs(logs: EmailLogRecord[]) {
    const succeeded = await sendEmail(logs);
    if (!succeeded) {
        await logger.error(
            `Error sending wishlist email batch for user ${logs[0].UserID} (${logs.length} items).`,
        );
    }

    const newStatus: EmailStatus = succeeded ? 'SENT' : 'FAILED';
    await updateEmailLogStatuses(logs, newStatus);
    console.log(
        `Processed email for user ${logs[0].UserID}: ${newStatus} (${logs.length} items)`,
    );
}

const limiter = new Bottleneck({
    minTime: 100,
    maxConcurrent: 1,
});

async function main() {
    const pendingEmailLogs = await getPendingEmailLogs();
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
    return summary;
}

main()
    .then(async (summary) => {
        await logger.finish(summary);
    })
    .catch(async (error: unknown) => {
        console.error('Unexpected error in sendEmails:', error);
        await logger.error('Unexpected error while sending wishlist emails.');
        await logger.finish();
        process.exitCode = 1;
    });
