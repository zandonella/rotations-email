import { supabase } from './lib/supabase.ts';
import type { ShopType, WishlistSaleMatchRecord } from './lib/types.ts';

async function getActiveWishlistSaleMatches(): Promise<
    WishlistSaleMatchRecord[]
> {
    const { data, error } = await supabase.rpc(
        'get_active_wishlist_sale_matches',
    );

    if (error) {
        console.error('Error fetching active wishlist sale matches:', error);
        return [];
    }

    return data ?? [];
}

async function UpsertEmailLogs(matches: WishlistSaleMatchRecord[]) {
    if (matches.length === 0) return;

    const emailLogs = matches.map((match) => ({
        UserID: match.UserID,
        ItemID: match.ItemID,
        SaleID: match.SaleID,
        SaleType: match.SaleType,
        Status: 'PENDING' as const,
        SentAt: null,
        MythicSaleID: match.MythicSaleID,
        CatalogSaleID: match.CatalogSaleID,
    }));

    const { error } = await supabase
        .from('WishlistEmailLog')
        .upsert(emailLogs, {
            onConflict: 'UserID,ItemID,SaleID',
            ignoreDuplicates: true,
        });

    if (error) {
        console.error('Error upserting email logs:', error);
    } else {
        console.log(`Email logs upserted successfully: ${emailLogs.length}`);
    }
}

async function main() {
    const matches = await getActiveWishlistSaleMatches();
    await UpsertEmailLogs(matches);
}

main();
