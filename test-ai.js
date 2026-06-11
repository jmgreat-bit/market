require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Testing AI query...');
    
    // Test the exact query that is failing in the API
    let query = supabase
            .from('posts')
            .select(`
                id, content, image_url, latitude, longitude, created_at,
                business:business_details(id, business_name, category, bio, address, phone, latitude, longitude)
            `)
            .limit(1);

    const { data, error } = await query;
    if (error) {
        console.error('Supabase Query Error:', error);
    } else {
        console.log('Query OK:', data);
    }

    // Also test ai_conversations table
    const { error: convError } = await supabase.from('ai_conversations').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        role: 'user',
        content: 'test'
    });
    
    if (convError) {
         console.error('AI Conversations Insert Error:', convError);
    } else {
         console.log('Insert OK');
    }

    // Also check ai_credits
    const { data: credits, error: creditError } = await supabase.from('ai_credits').select('*').limit(1);
    if (creditError) {
         console.error('Credits Error:', creditError);
    } else {
         console.log('Credits OK:', credits);
    }
}

main();
