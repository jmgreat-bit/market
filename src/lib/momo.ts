import crypto from 'crypto';

// Standard MoMo API base URL
const API_BASE_URL = process.env.MOMO_TARGET_ENV === 'mtnrwanda' 
    ? 'https://proxy.momoapi.mtn.com' 
    : 'https://sandbox.momodeveloper.mtn.com';

export class MomoClient {
    private consumerKey: string;
    private consumerSecret: string;
    private token: string | null = null;
    private tokenExpiry: number = 0;

    constructor() {
        this.consumerKey = process.env.MOMO_CONSUMER_KEY || '';
        this.consumerSecret = process.env.MOMO_CONSUMER_SECRET || '';

        if (!this.consumerKey || !this.consumerSecret) {
            console.warn("MTN MoMo Credentials missing in environment variables!");
        }
    }

    /**
     * Gets a valid OAuth token from MTN MADAPI
     */
    public async getToken(): Promise<string> {
        if (this.token && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        // MoMo API uses Basic Auth with API_USER : API_KEY for the token endpoint
        const credentials = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

        const response = await fetch(`${API_BASE_URL}/collection/token/`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY || '',
                'Cache-Control': 'no-cache',
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get MoMo Token: ${error}`);
        }

        const data = await response.json();
        this.token = data.access_token;
        // Typically expires in 3600 seconds, setting expiry to 3500s from now to be safe
        this.tokenExpiry = Date.now() + (3500 * 1000);
        return this.token!;
    }

    /**
     * Initiates a payment prompt (USSD) on the user's phone.
     * Note: MTN MADAPI may use different endpoints than the legacy MoMo API.
     * We will use a proxy to the legacy collections requesttopay endpoint using the new tokens if needed.
     */
    public async requestToPay(amount: number, phone: string, referenceId: string): Promise<boolean> {
        const token = await this.getToken();
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/momo/callback`;

        // Format phone to start with country code (assuming Rwanda 250 for now)
        const formattedPhone = phone.startsWith('0') ? '250' + phone.substring(1) : phone;
        
        // Fallback to legacy endpoint structure via MADAPI proxy
        const targetEnv = process.env.MOMO_TARGET_ENV || 'mtnrwanda';
        const subKey = process.env.MOMO_SUBSCRIPTION_KEY || '';

        console.log(`[MOMO] Initiating real payment for ${formattedPhone} of amount ${amount}. Reference: ${referenceId}`);
        
        try {
            // Standard MoMo API collection endpoint
            const response = await fetch(`${API_BASE_URL}/collection/v1_0/requesttopay`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Reference-Id': referenceId,
                    'X-Target-Environment': targetEnv,
                    'Ocp-Apim-Subscription-Key': subKey,
                    'X-Callback-Url': callbackUrl,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount.toString(),
                    currency: "RWF",
                    externalId: referenceId,
                    payer: {
                        partyIdType: "MSISDN",
                        partyId: formattedPhone
                    },
                    payerMessage: "Payment for MarketPLC",
                    payeeNote: "MarketPLC Subscription"
                })
            });

            if (!response.ok && response.status !== 202) {
                const errorText = await response.text();
                console.error('MTN API RequestToPay Failed:', response.status, errorText);
                
                // If it fails due to exact endpoint path, it might be due to the new MADAPI v1 Payments interface,
                // but usually the proxy handles `/collection/v1_0/requesttopay`.
                throw new Error(`MTN API Error: ${response.status} - ${errorText}`);
            }
            
            return true;
        } catch (error) {
            console.error('MomoClient.requestToPay Exception:', error);
            throw error;
        }
    }
}

export const momoClient = new MomoClient();
