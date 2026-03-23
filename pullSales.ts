import { supabase } from './lib/supabase.ts';
import type {
    CatalogItemRecord,
    MythicSaleRecord,
    CatalogSaleRecord,
    CatalogSaleWithItemRecord,
    MythicSaleWithItemRecord,
    ShopType,
    WishlistRecord,
    EmailLogRecord,
} from './lib/types.ts';

async function getWishlistedUsersForItems(
    itemIDs: string[],
): Promise<WishlistRecord[]> {
    if (itemIDs.length === 0) return [];

    const { data, error } = await supabase
        .from('WishlistItem')
        .select('*, Profile!inner(EmailStatus)')
        .in('ItemID', itemIDs)
        .eq('Profile.EmailStatus', 'active');

    if (error) {
        console.error('Error fetching wishlisted users:', error);
        return [];
    }

    return data;
}

async function pullMythicCurrentSales(): Promise<MythicSaleRecord[]> {
    const { data, error } = await supabase
        .from('MythicSale')
        .select('*')
        .eq('IsActive', true);

    if (error) {
        console.error('Error fetching mythic sales:', error);
        return [];
    }

    return data;
}

async function pullCatalogCurrentSales(): Promise<CatalogSaleWithItemRecord[]> {
    const { data, error } = await supabase
        .from('CatalogSale')
        .select('*, CatalogItem(*)')
        .eq('IsActive', true);

    if (error) {
        console.error('Error fetching catalog sales:', error);
        return [];
    }

    return data;
}

function isMythicSaleRecord(
    record: CatalogSaleRecord | MythicSaleRecord,
): record is MythicSaleRecord {
    return (record as MythicSaleRecord).PrimaryItemID !== undefined;
}

function getSaleItemIDs(
    sales: (CatalogSaleWithItemRecord | MythicSaleRecord)[],
): string[] {
    if (sales.length === 0) return [];
    const itemIDs: string[] = [];

    sales.forEach((sale) => {
        if (isMythicSaleRecord(sale)) {
            itemIDs.push(...sale.IncludedItems);
        } else {
            itemIDs.push(sale.CatalogItem.ItemID);
        }
    });
    return itemIDs;
}

async function getTodaySales() {
    const mythicSales: MythicSaleRecord[] = await pullMythicCurrentSales();
    const catalogSales: CatalogSaleWithItemRecord[] =
        await pullCatalogCurrentSales();
    return { mythicSales, catalogSales };
}

function buildLookup(
    sales: CatalogSaleWithItemRecord[] | MythicSaleRecord[],
): Record<string, string> {
    // map itemID to sale ID
    const lookup: Record<string, string> = {};
    sales.forEach((sale) => {
        if (isMythicSaleRecord(sale)) {
            sale.IncludedItems.forEach((itemID) => {
                lookup[itemID] = sale.SaleID;
            });
        } else {
            lookup[sale.CatalogItem.ItemID] = sale.SaleID;
        }
    });
    return lookup;
}

async function UpsertEmailLogs(
    wishlistRecord: WishlistRecord[],
    shopType: ShopType,
    saleRecord: CatalogSaleWithItemRecord[] | MythicSaleRecord[],
) {
    const lookup = buildLookup(saleRecord);

    const emailLogs: EmailLogRecord[] = wishlistRecord
        .map((record) => {
            const saleID = lookup[record.ItemID];
            if (!saleID) {
                console.warn(
                    `No active sale found for ItemID ${record.ItemID}, skipping email log creation.`,
                );
                return null;
            }

            return {
                UserID: record.UserID,
                ItemID: record.ItemID,
                SaleID: saleID,
                SaleType: shopType,
                Status: 'PENDING',
                SentAt: null,
                MythicSaleID: shopType === 'Mythic' ? saleID : null,
                CatalogSaleID: shopType === 'Catalog' ? saleID : null,
            };
        })
        .filter((log) => log !== null) as EmailLogRecord[];

    const { error } = await supabase
        .from('WishlistEmailLog')
        .upsert(emailLogs, {
            onConflict: 'UserID,ItemID,SaleID',
            ignoreDuplicates: true,
        });

    if (error) {
        console.error('Error upserting email logs:', error);
    } else {
        console.log('Email logs upserted successfully');
    }
}

async function main() {
    const sales = await getTodaySales();

    const mythicItemIDs = getSaleItemIDs(sales.mythicSales);
    const catalogItemIDs = getSaleItemIDs(sales.catalogSales);

    const allItemIDs = [...mythicItemIDs, ...catalogItemIDs];
    const wishlistedUsers = await getWishlistedUsersForItems(allItemIDs);

    const mythicWishlistRecords = wishlistedUsers.filter((record) =>
        mythicItemIDs.includes(record.ItemID),
    );
    const catalogWishlistRecords = wishlistedUsers.filter((record) =>
        catalogItemIDs.includes(record.ItemID),
    );

    await UpsertEmailLogs(mythicWishlistRecords, 'Mythic', sales.mythicSales);
    await UpsertEmailLogs(
        catalogWishlistRecords,
        'Catalog',
        sales.catalogSales,
    );
}

main();
