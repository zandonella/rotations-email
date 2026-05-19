import {
    Html,
    Head,
    Body,
    Preview,
    Container,
    Section,
    Heading,
    Text,
    Button,
    Hr,
    Tailwind,
    pixelBasedPreset,
    Img,
    Row,
    Column,
    Link,
} from '@react-email/components';

import type { EmailLogRecord } from '../lib/types';

interface WishlistNotificationEmailProps {
    items: EmailLogRecord[];
}

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
                '//wsrv.nl/?url=https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/teemo/skins/skin54/images/teemo_splash_tile_54.jpg',
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
            SalePrice: 1350,
            PercentOff: 0,
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
            Currency: 'IP',
            IsActive: false,
            ItemType: 1,
            SaleEndAt: '2026-02-10T00:00:00+00:00',
            SalePrice: 150000,
            PercentOff: 0,
            RiotItemID: 875010,
            NormalPrice: 150000,
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

function ItemCard({ item }: { item: EmailLogRecord }) {
    const saleType = item.SaleType;
    const { salePrice, normalPrice, currency, saleEndAt, percentOff } =
        getSaleInfo(item);
    const IconImageLink = getCurrencyIcon(currency);

    function getCurrencyIcon(currency: string) {
        switch (currency) {
            case 'RP':
                return 'https://wsrv.nl/?url=https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/currencies/images/riot-points-icon.svg';
            case 'ME':
                return 'https://wsrv.nl/?url=https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/currencies/images/mythic-essence-icon.svg';
            case 'IP':
                return 'https://wsrv.nl/?url=https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/currencies/images/blue-essence-icon.svg';
            default:
                return 'https://wsrv.nl/?url=https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/currencies/images/riot-points-icon.svg';
        }
    }

    function getTextColor(currency: string) {
        switch (currency) {
            case 'RP':
                return 'text-primary';
            case 'ME':
                return 'text-mythic';
            case 'IP':
                return 'text-blue';
            default:
                return 'text-primary';
        }
    }

    function normalizePhotoURL(url: string): string {
        if (url.startsWith('//')) {
            return 'https:' + url;
        }
        return url;
    }

    function getSaleInfo(item: EmailLogRecord): {
        salePrice: number;
        normalPrice?: number;
        currency: string;
        saleEndAt: string;
        percentOff?: number;
    } {
        if (item.SaleType === 'Mythic' && item.MythicSale) {
            return {
                salePrice: item.MythicSale.Price,
                currency: item.MythicSale.Currency,
                saleEndAt: item.MythicSale.SaleEndAt,
            };
        } else if (item.SaleType === 'Catalog' && item.CatalogSale) {
            let percentOff = item.CatalogSale.PercentOff;
            let normalPrice = item.CatalogSale.NormalPrice;
            let salePrice = item.CatalogSale.SalePrice;

            if (normalPrice === salePrice) {
                return {
                    salePrice,
                    normalPrice: undefined,
                    currency: item.CatalogSale.Currency,
                    saleEndAt: item.CatalogSale.SaleEndAt,
                    percentOff: undefined,
                };
            }

            return {
                salePrice: item.CatalogSale.SalePrice,
                normalPrice: item.CatalogSale.NormalPrice,
                currency: item.CatalogSale.Currency,
                saleEndAt: item.CatalogSale.SaleEndAt,
                percentOff: item.CatalogSale.PercentOff,
            };
        }
        return { salePrice: 0, currency: '', saleEndAt: '' };
    }

    return (
        <Section
            key={item.SaleID}
            className="bg-card border-secondary max-w-3xs rounded-lg border-2 p-4 my-4"
        >
            <Img
                alt={item.CatalogItem.Name}
                className="rounded-xl my-0 mx-auto"
                width={250}
                height={250}
                src={normalizePhotoURL(item.CatalogItem?.ImageURL)}
            />
            <p className="text-white text-[18px] leading-5 m-0 mt-3">
                {item.CatalogItem.Name}
            </p>
            <Row className="mt-1">
                <Column>
                    <Img
                        alt={currency}
                        className="inline-block align-middle pb-0.5"
                        width={16}
                        height={16}
                        src={normalizePhotoURL(IconImageLink)}
                    />
                    <span
                        className={
                            getTextColor(currency) +
                            ' inline-block align-middle text-[16px] leading-5 ml-1 font-bold'
                        }
                    >
                        {salePrice}
                    </span>
                    {normalPrice && (
                        <span className="inline-block align-middle text-muted text-[14px] leading-5 ml-2 line-through">
                            {normalPrice}
                        </span>
                    )}
                    {percentOff && (
                        <span className="inline-block align-middle text-primary text-[16px] font-bold leading-4.5 ml-2">
                            {percentOff}% off
                        </span>
                    )}
                </Column>
            </Row>
            <div className="text-muted text-[12px] leading-4 mt-1">
                Sale ends on {CalculateEndDateAndTime(saleEndAt)}
            </div>
        </Section>
    );
}

function CalculateEndDateAndTime(saleEndAt: string): string {
    const endDate = new Date(saleEndAt);
    const options: Intl.DateTimeFormatOptions = {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short',
    };
    return endDate.toLocaleString('en-US', options);
}

export const WishlistNotificationEmailTemplate = ({
    items,
}: WishlistNotificationEmailProps) => {
    const previewText = `An item on your wishlist is on sale!`;
    let headerText = 'An item in your wishlist is on sale!';
    let descriptionText = `Make sure to grab it before the sale ends!`;

    if (items.length > 1) {
        headerText = `${items.length} items in your wishlist are on sale!`;
        descriptionText = `Make sure to grab them before the sale ends.`;
    }

    return (
        <Tailwind
            config={{
                presets: [pixelBasedPreset],
                theme: {
                    extend: {
                        colors: {
                            background: '#f4f4f5', // was: #09090b
                            sidebar: '#e4e4e7', // was: #0f0f10
                            card: '#ffffff', // was: #18181b
                            primary: '#facc15', // was: #facc15 (darkened for contrast on light bg)
                            secondary: '#d4d4d8', // was: #27272a
                            mythic: '#a855f7', // was: #a855f7 (darkened for contrast on light bg)
                            white: '#18181b', // was: (text-white #fafafa)
                            muted: '#71717a', // was: #a1a1aa
                            blue: '#0acbe6',
                        },
                        fontFamily: {
                            sans: ['Arial', 'sans-serif'],
                        },
                    },
                },
            }}
        >
            <Html>
                <Head />
                <Body>
                    <Preview>{previewText}</Preview>
                    <Container className=" text-white rounded-lg mx-auto max-w-150 p-6 font-sans">
                        <Section className="mb-2">
                            <Heading className="text-[24px] leading-8 mb-3 text-center">
                                <Text className="text-white py-1 pr-2 text-3xl font-bold">
                                    <a
                                        href="https://rotations.lol"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            color: 'inherit',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        Rotations
                                        <span className="text-primary">
                                            .lol
                                        </span>
                                    </a>
                                </Text>
                            </Heading>

                            <Text className="text-white text-[20px] leading-8 font-semibold mx-auto max-w-125 text-center my-0">
                                {headerText}
                            </Text>
                            <Text className="text-muted text-[14px] leading-5 mx-auto my-0 max-w-125 text-center">
                                {descriptionText}
                            </Text>
                        </Section>
                        <Section>
                            {items.map((item) => (
                                <ItemCard key={item.SaleID} item={item} />
                            ))}
                        </Section>
                        <Hr className="mt-0 border-muted" />

                        <Text className="text-white py-1 pr-2 text-2xl font-bold text-center mb-0">
                            <a
                                href="https://rotations.lol"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                }}
                            >
                                Rotations
                                <span className="text-primary">.lol</span>
                            </a>
                        </Text>
                        <Text className="text-muted text-sm leading-[16px] my-0 font-medium text-center">
                            <a
                                href="mailto:contact@rotations.lol"
                                className="text-muted"
                                style={{ color: 'inherit' }}
                            >
                                contact@rotations.lol
                            </a>
                        </Text>
                    </Container>
                </Body>
            </Html>
        </Tailwind>
    );
};

WishlistNotificationEmailTemplate.PreviewProps = {
    items: sampleItems,
} as WishlistNotificationEmailProps;

export default WishlistNotificationEmailTemplate;
