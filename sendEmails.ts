import { supabase } from './lib/supabase.ts';
import type { EmailLogRecord, EmailStatus } from './lib/types.ts';
import { sendWishlistEmail } from './sendRenderedEmail.tsx';

async function getPendingEmailLogs(): Promise<EmailLogRecord[]> {
    const { data, error } = await supabase
        .from('WishlistEmailLog')
        .select('*, CatalogItem(*), Profile(*), MythicSale(*), CatalogSale(*)')
        .eq('Status', 'PENDING');

    if (error) {
        console.error('Error fetching pending email logs:', error);
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
    }
}

async function main() {
    const pendingEmailLogs = await getPendingEmailLogs();
    const emailLogsByUser = groupEmailLogsByUser(pendingEmailLogs);

    // Iterate through each user and send emails
    for (const userId in emailLogsByUser) {
        const logs = emailLogsByUser[userId];
        const succeeded = await sendEmail(logs);
        const newStatus: EmailStatus = succeeded ? 'SENT' : 'FAILED';
        await updateEmailLogStatuses(logs, newStatus);
    }
}

main();
