require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error('Error fetching users:', error);
        return;
    }
    const admin = data.users.find(u => u.email === 'thegreat@admin.sir');
    console.log('Admin user exists:', !!admin);
    if (admin) {
        console.log('Admin ID:', admin.id);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', admin.id).single();
        console.log('Admin Profile:', profile ? 'Exists' : 'Missing');
    }
}
check();
