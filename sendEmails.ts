import { supabase } from './lib/supabase.ts';
import type { EmailLogRecord } from './lib/types.ts';

async function getPendingEmailLogs(): Promise<EmailLogRecord[]> {
    const { data, error } = await supabase
        .from('WishlistEmailLog')
        .select('*, CatalogItem(*), Profile(*)')
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

function sendEmail(items: EmailLogRecord[]) {
    console.log(items);
}

async function main() {
    const pendingEmailLogs = await getPendingEmailLogs();
    console.log('Pending Email Logs:', pendingEmailLogs);

    const emailLogsByUser = groupEmailLogsByUser(pendingEmailLogs);
    console.log('Email Logs Grouped by User:', emailLogsByUser);

    // Iterate through each user and send emails
    for (const userId in emailLogsByUser) {
        const logs = emailLogsByUser[userId];
        console.log(
            `Sending email to UserID: ${userId} with ${logs.length} logs`,
        );
        sendEmail(logs);
    }
}

main();
