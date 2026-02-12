import {
    SendEmailCommand,
    type SendEmailCommandInput,
} from '@aws-sdk/client-ses';
import { render } from '@react-email/components';
import WishlistNotificationEmailTemplate from './emails/Wishlist-Notification.tsx';
import { EmailLogRecord } from './lib/types.ts';
import sesClient, { FROM_EMAIL } from './lib/sesClient.ts';

const sampleItems: EmailLogRecord[] = [
    {
        UserID: '1e603970-7b78-447b-a443-48f5cc2c5102',
        ItemID: 'be602a76-67f4-4fca-a8ae-40254aa6e8a0',
        Status: 'PENDING',
        SentAt: null,
        SaleID: 'd6cea14b-1224-4029-a3bd-e6b836edc256',
        SaleType: 'Catalog',
        MythicSaleID: null,
        CatalogSaleID: 'd6cea14b-1224-4029-a3bd-e6b836edc256',
        CatalogItem: {
            Name: 'Spirit Blossom Springs Teemo',
            ItemID: 'be602a76-67f4-4fca-a8ae-40254aa6e8a0',
            ImageURL:
                '//wsrv.nl/?url=https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/teemo/skins/skin54/images/teemo_splash_tile_54.skins_teemo_skin54.jpg',
            ItemType: 1,
            ChampionID: 17,
            RiotItemID: 17054,
            SkinlineID: 218,
        },
        Profile: {
            id: '1e603970-7b78-447b-a443-48f5cc2c5102',
            email: 'rhi@zando.dev',
        },
        MythicSale: null,
        CatalogSale: {
            SaleID: 'd6cea14b-1224-4029-a3bd-e6b836edc256',
            Currency: 'RP',
            IsActive: false,
            ItemType: 1,
            SaleEndAt: '2026-02-10T00:00:00+00:00',
            SalePrice: 975,
            PercentOff: 27,
            RiotItemID: 17054,
            NormalPrice: 1350,
            SaleStartAt: '2026-02-03T00:00:00+00:00',
        },
    },
    {
        UserID: '1e603970-7b78-447b-a443-48f5cc2c5102',
        ItemID: 'c6484256-4726-4d5c-a111-7acd2ef09ce5',
        Status: 'PENDING',
        SentAt: null,
        SaleID: '24270463-7299-4a9d-b405-a0969ff16630',
        SaleType: 'Catalog',
        MythicSaleID: null,
        CatalogSaleID: '24270463-7299-4a9d-b405-a0969ff16630',
        CatalogItem: {
            Name: 'Pool Party Sett',
            ItemID: 'c6484256-4726-4d5c-a111-7acd2ef09ce5',
            ImageURL:
                '//wsrv.nl/?url=https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/sett/skins/skin10/images/sett_splash_tile_10.jpg',
            ItemType: 1,
            ChampionID: 875,
            RiotItemID: 875010,
            SkinlineID: 15,
        },
        Profile: {
            id: '1e603970-7b78-447b-a443-48f5cc2c5102',
            email: 'rhi@zando.dev',
        },
        MythicSale: null,
        CatalogSale: {
            SaleID: '24270463-7299-4a9d-b405-a0969ff16630',
            Currency: 'RP',
            IsActive: false,
            ItemType: 1,
            SaleEndAt: '2026-02-10T00:00:00+00:00',
            SalePrice: 1012,
            PercentOff: 25,
            RiotItemID: 875010,
            NormalPrice: 1350,
            SaleStartAt: '2026-02-03T00:00:00+00:00',
        },
    },
    {
        UserID: '1e603970-7b78-447b-a443-48f5cc2c5102',
        ItemID: '0c347368-b9fd-4334-98af-dccbb1d01439',
        Status: 'PENDING',
        SentAt: null,
        SaleID: '8050a10a-b95e-4369-b94a-d8a96907f5d7',
        SaleType: 'Mythic',
        MythicSaleID: '8050a10a-b95e-4369-b94a-d8a96907f5d7',
        CatalogSaleID: null,
        CatalogItem: {
            Name: 'Soul Fighter Viego (Limitless)',
            ItemID: '0c347368-b9fd-4334-98af-dccbb1d01439',
            ImageURL:
                '//wsrv.nl/?url=https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-chroma-images/234/234036.png',
            ItemType: 2,
            ChampionID: 234,
            RiotItemID: 234036,
            SkinlineID: 196,
        },
        Profile: {
            id: '1e603970-7b78-447b-a443-48f5cc2c5102',
            email: 'rhi@zando.dev',
        },
        MythicSale: {
            Price: 35,
            SaleID: '8050a10a-b95e-4369-b94a-d8a96907f5d7',
            OfferID: '448a7acf-b6e3-4e22-b308-2163c638409c',
            Section: 'WEEKLY',
            Currency: 'ME',
            IsActive: true,
            IsBundle: false,
            SaleEndAt: '2026-02-12T00:00:00+00:00',
            BundleType: null,
            SaleStartAt: '2026-02-05T00:00:00+00:00',
            IncludedItems: ['3c58d4b1-7827-41f7-957c-aaa0b6138e60'],
            PrimaryItemID: '0c347368-b9fd-4334-98af-dccbb1d01439',
        },
        CatalogSale: null,
    },
    {
        UserID: '1e603970-7b78-447b-a443-48f5cc2c5102',
        ItemID: 'a40de5b9-aef1-4cfd-bc47-95bddf1ba1fb',
        Status: 'PENDING',
        SentAt: null,
        SaleID: '3c58d4b1-7827-41f7-957c-aaa0b6138e60',
        SaleType: 'Mythic',
        MythicSaleID: '3c58d4b1-7827-41f7-957c-aaa0b6138e60',
        CatalogSaleID: null,
        CatalogItem: {
            Name: 'Prestige Lunar Beast Fiora',
            ItemID: 'a40de5b9-aef1-4cfd-bc47-95bddf1ba1fb',
            ImageURL:
                '//wsrv.nl/?url=https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/fiora/skins/skin51/images/fiora_splash_tile_51.jpg',
            ItemType: 1,
            ChampionID: 114,
            RiotItemID: 114051,
            SkinlineID: 142,
        },
        Profile: {
            id: '1e603970-7b78-447b-a443-48f5cc2c5102',
            email: 'rhi@zando.dev',
        },
        MythicSale: {
            Price: 150,
            SaleID: '3c58d4b1-7827-41f7-957c-aaa0b6138e60',
            OfferID: 'caf4a50d-e9a6-41b4-ab7b-e502aec28310',
            Section: 'FEATURED',
            Currency: 'ME',
            IsActive: true,
            IsBundle: false,
            SaleEndAt: '2026-02-19T19:00:00+00:00',
            BundleType: null,
            SaleStartAt: '2026-02-04T19:00:00+00:00',
            IncludedItems: ['a40de5b9-aef1-4cfd-bc47-95bddf1ba1fb'],
            PrimaryItemID: 'a40de5b9-aef1-4cfd-bc47-95bddf1ba1fb',
        },
        CatalogSale: null,
    },
];

export async function sendWishlistEmail() {
    const emailHtml = await render(
        <WishlistNotificationEmailTemplate items={sampleItems} />,
    );

    const params: SendEmailCommandInput = {
        Source: FROM_EMAIL,
        Destination: {
            ToAddresses: ['contact@rotations.lol'],
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: emailHtml,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: 'hello world',
            },
        },
    };

    await sesClient.send(new SendEmailCommand(params));
}

sendWishlistEmail();
