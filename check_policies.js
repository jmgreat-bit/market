require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
    const { data, error } = await supabase.from('post_media').insert({
        post_id: '13d64013-8b1a-4c7a-87fb-306278f8ab6e',
        type: 'image',
        url: 'https://test.com/test.jpg',
        order: 0
    }).select();
    console.log('Insert test with service role:', { data, error });
    if (data && data[0]) {
        await supabase.from('post_media').delete().eq('id', data[0].id);
    }
}
check();
