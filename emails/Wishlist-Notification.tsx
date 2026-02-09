import {
    Body,
    Button,
    Column,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Tailwind,
    Text,
} from '@react-email/components';

type wishlistItem = {
    itemName: string;
    itemImageURL: string;
    itemPrice: string;
    salePrice: string;
    currency: string;
    percentOff: number;
    saleEndDate: string;
};

interface WishlistNotificationEmailProps {
    items: wishlistItem[];
}

export const WishlistNotificationEmail = ({
    items,
}: WishlistNotificationEmailProps) => {
    const previewText = `An item on your wishlist is on sale!`;

    return (
        <Html>
            <Head />
            <Tailwind>
                <Body className="mx-auto my-auto bg-white px-2 font-sans">
                    <Preview>{previewText}</Preview>
                    <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
                        <Section className="mt-[32px]">
                            {items.map((item, index) => (
                                <Row key={index} className="mb-4">
                                    <Column>
                                        <Img
                                            src={item.itemImageURL}
                                            width="100%"
                                            height="auto"
                                            alt={item.itemName}
                                        />
                                        <Heading className="text-lg font-bold mt-2">
                                            {item.itemName}
                                        </Heading>
                                        <Text className="text-sm text-gray-600">
                                            Original Price: {item.currency}{' '}
                                            {item.itemPrice}
                                        </Text>
                                        <Text className="text-sm text-green-600">
                                            Sale Price: {item.currency}{' '}
                                            {item.salePrice} ({item.percentOff}%
                                            off)
                                        </Text>
                                        <Text className="text-sm text-gray-600">
                                            Sale ends on: {item.saleEndDate}
                                        </Text>
                                    </Column>
                                </Row>
                            ))}
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

WishlistNotificationEmail.PreviewProps = {
    items: [],
} as WishlistNotificationEmailProps;

export default WishlistNotificationEmail;
