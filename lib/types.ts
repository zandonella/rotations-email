export type CatalogItemRecord = {
    ItemID: string;
    ItemType: number;
    RiotItemID: number;
    ChampionID: number | null;
    Name: string;
    SkinlineID: number | null;
    ImageURL: string;
};

export type CatalogSaleRecord = {
    RiotItemID: number;
    SaleStartAt: string;
    SaleEndAt: string;
    ItemType: number;
    NormalPrice: number;
    SalePrice: number;
    PercentOff: number;
    Currency: string;
    IsActive: boolean;
    SaleID: string;
};

export type sectionType = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'FEATURED';

export type MythicSaleRecord = {
    OfferID: string;
    SaleStartAt: string;

    PrimaryItemID: string;
    SaleEndAt: string;
    Price: number;
    Currency: string;
    IsActive: boolean;
    Section: sectionType;

    IsBundle: boolean;
    IncludedItems: string[];
    BundleType: string | null;
    SaleID: string;
};

export type SanctumSaleRecord = {
    RiotItemID: number;
    ItemType: number;
    SaleID: string;
    SaleStartAt: string;
    SaleEndAt: string;
    Rarity: 'EXALTED' | 'MYTHIC_VARIANT';
    ChasePityThreshold: number;
    BannerImageURL: string | null;
    IsActive: boolean;
};

export type CatalogSaleWithItemRecord = CatalogSaleRecord & {
    CatalogItem: CatalogItemRecord;
};

export type MythicSaleWithItemRecord = MythicSaleRecord & {
    CatalogItem: CatalogItemRecord;
};

export type WishlistRecord = {
    UserID: string;
    ItemID: string;
};

export type ShopType = 'Catalog' | 'Mythic' | 'Sanctum';
export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED';

export type ProfileRecord = {
    id: string;
    email: string;
};

export type EmailLogRecord = {
    UserID: string;
    ItemID: string;
    SaleID: string;
    SaleType: ShopType;
    Status: EmailStatus;
    SentAt: Date | null;
    MythicSaleID?: string | null;
    CatalogSaleID?: string | null;
    SanctumSaleID?: string | null;
    CatalogItem: CatalogItemRecord;
    Profile: ProfileRecord;
    MythicSale?: MythicSaleRecord | null;
    CatalogSale?: CatalogSaleRecord | null;
    SanctumSale?: SanctumSaleRecord | null;
};

export type WishlistSaleMatchRecord = {
    UserID: string;
    ItemID: string;
    SaleID: string;
    SaleType: ShopType;
    MythicSaleID: string | null;
    CatalogSaleID: string | null;
    SanctumSaleID: string | null;
};
