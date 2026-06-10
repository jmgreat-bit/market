const { execSync } = require('child_process');

function setVercelEnv(key, value) {
    console.log(`Setting ${key}...`);
    // First remove it
    try {
        execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
    } catch(e) {}
    
    // Add it cleanly without newlines
    // Vercel CLI reads from stdin. We can pipe the exact string using Node.js
    execSync(`npx vercel env add ${key} production`, {
        input: value,
        stdio: ['pipe', 'inherit', 'inherit']
    });
}

setVercelEnv('MOMO_CONSUMER_KEY', '64f940c6-caf8-42c8-9625-f2b313e8487d');
setVercelEnv('MOMO_CONSUMER_SECRET', 'b34b3d9c9cf74135b9f7ee1845a38b0e');
setVercelEnv('MOMO_SUBSCRIPTION_KEY', 'a0feacc938194284a1bc13fb08c4a19b');
setVercelEnv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlocHdhenRsa3FneWxxc21yYWJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY1NDM0OSwiZXhwIjoyMDgyMjMwMzQ5fQ.FgpY7h0iAOguv4ykPwLndliCKdmWhNSn64yPLTn_uJM');
setVercelEnv('GEMINI_API_KEY', 'AIzaSyAa2ChOND565eR8NuRcc5hTBP5db1XROiI');

console.log('All vars set cleanly!');
