const fetch = require('node-fetch');

async function test() {
    console.log("Testing live Vercel API...");
    try {
        const res = await fetch('https://marketplc.vercel.app/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'hello there',
                userId: '492275f1-0990-441d-a926-628055783d81', // hardcoded user id from test-ai.js output
                sessionId: 'session-123'
            })
        });
        
        const text = await res.text();
        console.log("STATUS:", res.status);
        console.log("RESPONSE:", text);
    } catch(err) {
        console.error("Fetch failed", err);
    }
}
test();
