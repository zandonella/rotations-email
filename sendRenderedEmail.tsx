import {
    SendEmailCommand,
    type SendEmailCommandInput,
} from '@aws-sdk/client-ses';
import { render } from '@react-email/components';
import WishlistNotificationEmailTemplate from './emails/Wishlist-Notification.tsx';
import { EmailLogRecord } from './lib/types.ts';
import sesClient, { FROM_EMAIL } from './lib/sesClient.ts';

function errorToString(err: unknown) {
    if (err instanceof Error) return err.message;
    try {
        return JSON.stringify(err);
    } catch {
        return String(err);
    }
}

export async function sendWishlistEmail(
    email: string,
    items: EmailLogRecord[],
): Promise<{
    success: boolean;
    response?: any;
    error?: any;
    errorMessage?: string;
}> {
    const emailHtml = await render(
        <WishlistNotificationEmailTemplate items={items} />,
    );

    const params: SendEmailCommandInput = {
        Source: FROM_EMAIL,
        Destination: {
            ToAddresses: [email],
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
                Data: 'Items in your wishlist are on sale!',
            },
        },
    };

    try {
        const resp = await sesClient.send(new SendEmailCommand(params));
        return { success: true, response: resp };
    } catch (error) {
        return {
            success: false,
            error,
            errorMessage: `Failed to send email to ${email}: ${errorToString(error)}`,
        };
    }
}
