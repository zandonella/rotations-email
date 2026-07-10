import { supabase } from './lib/supabase.ts';
import { DiscordLogger } from './lib/discordLogger.ts';
import type { WishlistSaleMatchRecord } from './lib/types.ts';

const logger = new DiscordLogger('pullSales');

async function getActiveWishlistSaleMatches(): Promise<
    WishlistSaleMatchRecord[]
> {
    const { data, error } = await supabase.rpc(
        'get_active_wishlist_sale_matches',
    );

    if (error) {
        console.error('Error fetching active wishlist sale matches:', error);
        await logger.error('Error fetching active wishlist sale matches.');
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
        SanctumSaleID: match.SanctumSaleID,
    }));

    const { error } = await supabase
        .from('WishlistEmailLog')
        .upsert(emailLogs, {
            onConflict: 'UserID,ItemID,SaleID',
            ignoreDuplicates: true,
        });

    if (error) {
        console.error('Error upserting email logs:', error);
        await logger.error('Error upserting wishlist email logs.');
    } else {
        console.log(`Email logs upserted successfully: ${emailLogs.length}`);
    }
}

async function main() {
    const matches = await getActiveWishlistSaleMatches();
    await UpsertEmailLogs(matches);
}

main()
    .then(async () => {
        await logger.finish();
    })
    .catch(async (error: unknown) => {
        console.error('Unexpected error in pullSales:', error);
        await logger.error(
            'Unexpected error while pulling wishlist sale email logs.',
        );
        await logger.finish();
        process.exitCode = 1;
    });
