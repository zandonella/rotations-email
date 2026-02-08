import { supabase } from './lib/supabase.ts';
import type { EmailLogRecord } from './lib/types.ts';

async function getPendingEmailLogs(): Promise<EmailLogRecord[]> {
    const { data, error } = await supabase
        .from('WishlistEmailLog')
        .select('*')
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
    const map: Record<string, EmailLogRecord[]> = {};

    emailLogs.forEach((log) => {
        if (!map[log.UserID]) {
            map[log.UserID] = [];
        }
        map[log.UserID].push(log);
    });

    return map;
}

async function main() {
    const pendingEmailLogs = await getPendingEmailLogs();
    console.log('Pending Email Logs:', pendingEmailLogs);

    const emailLogsByUser = groupEmailLogsByUser(pendingEmailLogs);
    console.log('Email Logs Grouped by User:', emailLogsByUser);
}

main();
