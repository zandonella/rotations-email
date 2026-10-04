import type { EmailLogRecord, EmailStatus } from './types.ts';

export async function getPendingEmailLogs(db: any): Promise<EmailLogRecord[]> {
    const logs: EmailLogRecord[] = [];
    for (let offset = 0; ; offset += 500) {
        const { data, error } = await db.from('WishlistEmailLog')
            .select('*, CatalogItem(*), Profile!inner(*), MythicSale(*), CatalogSale(*), SanctumSale(*)')
            .eq('Status', 'PENDING').eq('Profile.EmailStatus', 'active')
            .order('UserID').order('ItemID').order('SaleID').range(offset, offset + 499);
        if (error) throw new Error(`Error fetching pending wishlist email logs: ${error.message}`);
        logs.push(...data);
        if (data.length < 500) return logs;
    }
}

export function groupEmailLogsByUser(emailLogs: EmailLogRecord[]): Record<string, EmailLogRecord[]> {
    const groups: Record<string, EmailLogRecord[]> = {};
    for (const log of emailLogs) (groups[log.UserID] ??= []).push(log);
    return groups;
}

export async function updateEmailLogStatuses(db: any, logs: EmailLogRecord[], status: EmailStatus) {
    const sentAt = status === 'SENT' ? new Date().toISOString() : null;
    for (const log of logs) {
        const { error } = await db.from('WishlistEmailLog')
            .update({ Status: status, SentAt: sentAt })
            .eq('UserID', log.UserID).eq('ItemID', log.ItemID).eq('SaleID', log.SaleID)
            .eq('Status', 'PENDING');
        if (error) throw new Error(`Error recording email delivery status: ${error.message}`);
    }
}
