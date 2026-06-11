require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const email = 'thegreat@admin.sir';
    const password = '20Lucifer50';

    console.log(`Creating admin account for ${email}...`);
    
    // Create the user in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError) {
        if (authError.message.includes('already exists')) {
            console.log('User already exists in Auth. Ensuring password is correct...');
            const { data: users } = await supabase.auth.admin.listUsers();
            const user = users.users.find(u => u.email === email);
            if (user) {
                await supabase.auth.admin.updateUserById(user.id, { password });
                console.log('Password updated.');
            }
        } else {
            console.error('Auth error:', authError);
            return;
        }
    } else {
        console.log('User created in Auth.');
    }

    // Now update or create the profile
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);

    if (user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: email,
                role: 'trader',
                full_name: 'Master Admin',
                updated_at: new Date().toISOString()
            });
            
        if (profileError) {
            console.error('Profile error:', profileError);
        } else {
            console.log('Profile created/updated.');
        }
    }

    console.log('Done!');
}

main();
