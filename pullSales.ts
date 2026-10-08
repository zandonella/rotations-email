import { supabase } from './lib/supabase.ts';
import { DiscordLogger } from './lib/discordLogger.ts';
import { queueWishlistSaleEmails } from './lib/emailQueue.ts';
const logger = new DiscordLogger('pullSales');
try {
    const count = await queueWishlistSaleEmails(supabase);
    console.log(`Queued ${count} new wishlist email items.`);
    await logger.finish(`Queued ${count} new wishlist email items.`, count);
} catch (error) {
    console.error('Wishlist email queuing failed:', error);
    logger.error('Wishlist email queuing failed.');
    await logger.finish();
    process.exitCode = 1;
}
