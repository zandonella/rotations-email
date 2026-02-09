import { supabase } from './lib/supabase.ts';
import type { EmailLogRecord } from './lib/types.ts';

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

function sendEmail(items: EmailLogRecord[]) {
    const senderEmail = items[0].Profile.email;
    console.log(`Sending email to ${senderEmail} with the following items:`);
    items.forEach((item) => {
        const itemName = item.CatalogItem
            ? item.CatalogItem.Name
            : 'Unknown Item';
        const saleType = item.SaleType;
        const price =
            item.SaleType === 'Mythic'
                ? item.MythicSale?.Price
                : item.CatalogSale?.SalePrice;

        const priceDisplay =
            item.SaleType === 'Mythic'
                ? `${item.MythicSale?.Price} ${item.MythicSale?.Currency}`
                : `${item.CatalogSale?.SalePrice} ${item.CatalogSale?.Currency}`;
        console.log(`- ${itemName} (${saleType} sale) for ${priceDisplay}`);
    });
    console.log('---');
}

async function main() {
    const pendingEmailLogs = await getPendingEmailLogs();
    const emailLogsByUser = groupEmailLogsByUser(pendingEmailLogs);

    // Iterate through each user and send emails
    for (const userId in emailLogsByUser) {
        const logs = emailLogsByUser[userId];
        sendEmail(logs);
    }
}

main();
