
const fs = require('fs');
const path = require('path');

const content = `NEXT_PUBLIC_SUPABASE_URL=https://yhpwaztlkqgylqsmrabs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_vg2WZJnegdi-Vx5rXKhFsA_hOzloXbm
`;

const filePath = path.resolve(process.cwd(), '.env.local');

fs.writeFileSync(filePath, content.trim());
console.log('Updated .env.local');
