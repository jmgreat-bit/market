require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
    const { data, error } = await supabase.from('posts').select('images').limit(1);
    console.log('Select images result:', { data, error });
}
check();
