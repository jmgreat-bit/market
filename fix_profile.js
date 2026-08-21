require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fix() {
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: '49536151-fecf-4165-a02d-a8f2253bd496',
        email: 'thegreat@admin.sir',
        full_name: 'Master Admin',
        role: 'client',
        username: 'masteradmin'
    });
    console.log('Profile fix error:', profileError);
}
fix();
