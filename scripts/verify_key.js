
const https = require('https');

const url = 'https://yhpwaztlkqgylqsmrabs.supabase.co/rest/v1/profiles?select=*&limit=1';
const key = 'sb_publishable_vg2WZJnegdi-Vx5rXKhFsA_hOzloXbm';

const options = {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
};

console.log('Testing key...');

https.get(url, options, (res) => {
    console.log('Status Code:', res.statusCode);

    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Response:', data);
        if (res.statusCode === 200 || res.statusCode === 404) {
            console.log('Key appears VALID (Connection accepted).');
        } else {
            console.log('Key appears INVALID.');
        }
    });

}).on('error', (e) => {
    console.error('Error:', e);
});
