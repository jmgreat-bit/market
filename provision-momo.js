const crypto = require('crypto');

const SUBSCRIPTION_KEY = 'a0feacc938194284a1bc13fb08c4a19b';
const UUID = crypto.randomUUID();
const BASE_URL = 'https://sandbox.momodeveloper.mtn.com/v1_0';

async function provision() {
    console.log(`Creating API User with UUID: ${UUID}`);
    const createRes = await fetch(`${BASE_URL}/apiuser`, {
        method: 'POST',
        headers: {
            'X-Reference-Id': UUID,
            'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ providerCallbackHost: 'marketplc.vercel.app' })
    });
    
    if (!createRes.ok) {
        console.error('Failed to create user:', await createRes.text());
        return;
    }
    console.log('API User created successfully (201 Created).');

    console.log('Generating API Key...');
    const keyRes = await fetch(`${BASE_URL}/apiuser/${UUID}/apikey`, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        }
    });

    if (!keyRes.ok) {
        console.error('Failed to generate key:', await keyRes.text());
        return;
    }

    const data = await keyRes.json();
    console.log('--- SUCCESS ---');
    console.log(`MOMO_CONSUMER_KEY=${UUID}`);
    console.log(`MOMO_CONSUMER_SECRET=${data.apiKey}`);
    console.log(`MOMO_SUBSCRIPTION_KEY=${SUBSCRIPTION_KEY}`);
}

provision();
