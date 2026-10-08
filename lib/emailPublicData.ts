import type { EmailLogRecord } from './types.ts';

const key = (row: any) => `${row.SaleType}:${row.SaleID}:${row.ItemID}`;
const columns = 'UserID,ItemID,SaleID,SaleType,CatalogItem(Name,ImageURL),CatalogSale(NormalPrice,SalePrice,PercentOff,Currency,SaleEndAt),MythicSale(Price,Currency,SaleEndAt),SanctumSale(Rarity,ChasePityThreshold,SaleEndAt)';
function complete(row: any) {
    const sale = row.SaleType === 'Catalog' ? row.CatalogSale : row.SaleType === 'Mythic' ? row.MythicSale : row.SanctumSale;
    return typeof row.CatalogItem?.Name === 'string' && (typeof row.CatalogItem?.ImageURL === 'string' || row.CatalogItem?.ImageURL === null) && sale &&
        Number.isFinite(Date.parse(sale.SaleEndAt));
}

export async function hydrateEmailLogs(db: any, logs: EmailLogRecord[]): Promise<EmailLogRecord[]> {
    if (logs.length === 0) return logs;
    // Tests/pre-rendered callers may already have all rendering fields.
    const unresolved = [...new Map(logs.filter(row => !complete(row)).map(row => [key(row), row])).values()];
    const resolved = new Map<string, any>();
    const url = process.env.EMAIL_PUBLIC_API_URL;
    const secret = process.env.EMAIL_PUBLIC_API_SECRET;
    const minCheckedAt = process.env.EMAIL_INGESTION_STARTED_AT;
    if (url && secret && minCheckedAt) {
        for (let offset = 0; offset < unresolved.length; offset += 300) {
            const records = unresolved.slice(offset, offset + 300).map((row: any) => ({
                ItemID: row.ItemID, SaleID: row.SaleID, SaleType: row.SaleType, OfferID: row.MythicSale?.OfferID,
            }));
            try {
                const response = await fetch(new URL('/internal/email-data', url), {
                    method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ minCheckedAt, records }), signal: AbortSignal.timeout(5000), redirect: 'error',
                });
                if (response.ok) {
                    const body = await response.json();
                    if (!Number.isFinite(Date.parse(body.checkedAt)) || Date.parse(body.checkedAt) < Date.parse(minCheckedAt) || !Array.isArray(body.records)) throw new Error('Unconfirmed email cache.');
                    for (const row of body.records) if (complete(row)) resolved.set(key(row), row);
                } else await response.body?.cancel();
            } catch { /* A narrow database fallback preserves delivery when the cache is behind. */ }
        }
    }
    const missing = logs.filter(row => !complete(row) && !resolved.has(key(row)));
    // Fetch rendering data only for pending rows omitted by the public cache.
    for (let offset = 0; offset < missing.length; offset += 100) {
        const batch = missing.slice(offset, offset + 100);
        const filters = batch.map(row => `and(UserID.eq.${row.UserID},ItemID.eq.${row.ItemID},SaleID.eq.${row.SaleID})`).join(',');
        const { data, error } = await db.from('WishlistEmailLog').select(columns).eq('Status', 'PENDING').or(filters);
        if (error) throw new Error('Email rendering fallback failed.');
        for (const row of data ?? []) if (complete(row)) resolved.set(key(row), row);
    }
    console.log(`Email rendering: ${logs.length} pending matches; ${missing.length} database fallback rows.`);
    return logs.map(row => {
        if (complete(row)) return row;
        const publicData = resolved.get(key(row));
        if (!publicData) throw new Error('Email rendering data is incomplete; no emails sent.');
        return { ...row, ...publicData, Profile: row.Profile };
    });
}
