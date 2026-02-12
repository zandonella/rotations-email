import { config } from 'dotenv';
import { SESClient } from '@aws-sdk/client-ses';
config();

const REGION = process.env.AWS_REGION;
const ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const SECRET_KEY = process.env.AWS_SECRET_KEY;
export const FROM_EMAIL = process.env.FROM_EMAIL;

if (!REGION || !ACCESS_KEY || !SECRET_KEY || !FROM_EMAIL) {
    throw new Error('AWS configuration is missing in environment variables');
}

const sesClient = new SESClient({
    region: REGION,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    },
});

export default sesClient;
