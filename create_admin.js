require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdmin() {
    console.log('Creating admin user...');
    const { data: user, error } = await supabase.auth.admin.createUser({
        email: 'thegreat@admin.sir',
        password: 'AdminPassword123!',
        email_confirm: true
    });
    
    if (error) {
        console.error('Failed to create user:', error);
        return;
    }
    
    console.log('User created successfully:', user.user.id);
    
    console.log('Ensuring profile exists...');
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.user.id,
        email: 'thegreat@admin.sir',
        full_name: 'Master Admin',
        role: 'buyer' // Base role, admin access is controlled by the hardcoded email
    });
    
    if (profileError) {
        console.error('Failed to create profile:', profileError);
    } else {
        console.log('Profile created successfully!');
    }
}
createAdmin();
