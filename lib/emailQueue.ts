import type { EmailLogRecord, EmailStatus } from './types.ts';
import { hydrateEmailLogs } from './emailPublicData.ts';

export async function getPendingEmailLogs(db: any): Promise<EmailLogRecord[]> {
    const logs: EmailLogRecord[] = [];
    for (let offset = 0; ; offset += 500) {
        const { data, error } = await db.from('WishlistEmailLog')
            .select('UserID,ItemID,SaleID,SaleType,MythicSaleID,CatalogSaleID,SanctumSaleID,Profile!inner(email),MythicSale(OfferID)')
            .eq('Status', 'PENDING').eq('Profile.EmailStatus', 'active')
            .order('UserID').order('ItemID').order('SaleID').range(offset, offset + 499);
        if (error) throw new Error(`Error fetching pending wishlist email logs: ${error.message}`);
        logs.push(...data);
        if (data.length < 500) return hydrateEmailLogs(db, logs);
    }
}

export function groupEmailLogsByUser(emailLogs: EmailLogRecord[]): Record<string, EmailLogRecord[]> {
    const groups: Record<string, EmailLogRecord[]> = {};
    for (const log of emailLogs) (groups[log.UserID] ??= []).push(log);
    return groups;
}

export async function updateEmailLogStatuses(db: any, logs: EmailLogRecord[], status: EmailStatus) {
    for (let offset = 0; offset < logs.length; offset += 500) {
        const records = logs.slice(offset, offset + 500).map(({ UserID, ItemID, SaleID }) => ({ UserID, ItemID, SaleID }));
        const { data, error } = await db.rpc('record_wishlist_email_delivery', { records, delivery_status: status });
        if (error || !Number.isSafeInteger(data) || data !== records.length) {
            throw new Error('Error recording email delivery status; inspect delivery logs before retrying.');
        }
    }
}

export async function queueWishlistSaleEmails(db: any): Promise<number> {
    const { data, error } = await db.rpc('queue_wishlist_sale_emails');
    if (error) throw new Error(`Cannot queue wishlist sale emails: ${error.message}`);
    if (!Number.isSafeInteger(data) || data < 0) throw new Error('Invalid inserted row count.');
    return data;
}
