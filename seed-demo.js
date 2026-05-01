
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUSINESSES = [
    {
        name: 'The Roasted Bean',
        category: 'Food',
        email: 'coffee@example.com',
        lat: -1.9441, lng: 30.0619,
        posts: [
            { content: 'Morning special! Buy one latte, get a croissant 50% off until 10 AM. #coffee #morning', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800' },
            { content: 'New Ethiopian beans just arrived. Come try a pour-over! #specialtycoffee', img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800' },
            { content: 'Work from here today! High-speed fiber and plenty of outlets available. #coworking', img: 'https://images.unsplash.com/photo-1521017432531-fbd92d744264?w=800' },
            { content: 'Closing early for a private cupping event. See you tomorrow at 7 AM!', img: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800' }
        ]
    },
    {
        name: 'Urban Threads',
        category: 'Retail',
        email: 'fashion@example.com',
        lat: -1.9450, lng: 30.0630,
        posts: [
            { content: 'The Summer Collection is here! Sustainable linen pieces for the heat. #fashion #sustainable', img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800' },
            { content: 'Flash Sale! 20% off all accessories today only. #sale', img: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=800' },
            { content: 'Meet the designers! Join us this Friday for a talk on eco-fabrics. #events', img: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800' },
            { content: 'New arrivals in denim. Perfect fit, guaranteed. #denim', img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800' }
        ]
    },
    {
        name: 'Neon Nights',
        category: 'Other',
        email: 'drinks@example.com',
        lat: -1.9430, lng: 30.0600,
        posts: [
            { content: 'Happy Hour starts now! Try our signature "Electric Yuzu" martini. #cocktails #nightlife', img: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=800' },
            { content: 'DJ K-VIBE on the decks tonight from 9 PM. No cover! #techno #kigali', img: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=800' },
            { content: 'New lounge seating open on the roof terrace. Best view in town. #view', img: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5db?w=800' },
            { content: 'Mixology class this Sunday. Limited spots available! #workshop', img: 'https://images.unsplash.com/photo-1516997121675-4c2d04f0cb1f?w=800' }
        ]
    },
    {
        name: 'Golden Crust',
        category: 'Food',
        email: 'bakery@example.com',
        lat: -1.9460, lng: 30.0650,
        posts: [
            { content: 'Fresh baguettes out of the oven! Crunchy on the outside, soft on the inside. #bakery', img: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800' },
            { content: 'Our seasonal fruit tarts are back for the weekend. #dessert', img: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800' },
            { content: 'Support local! All our flour is sourced from regional farmers. #local', img: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800' },
            { content: 'Order your custom birthday cakes 48 hours in advance. #cake', img: 'https://images.unsplash.com/photo-1535254973040-607b474cb8c2?w=800' }
        ]
    },
    {
        name: 'Digital Nomad Hub',
        category: 'Other',
        email: 'tech@example.com',
        lat: -1.9420, lng: 30.0620,
        posts: [
            { content: 'New standing desks arrived in the quiet zone! #tech #coworking', img: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800' },
            { content: 'Startup pitch night next Tuesday. Come meet local investors. #startup', img: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800' },
            { content: 'Free trial day for anyone working in AI this week. #AI #kigali', img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800' },
            { content: 'Need a meeting room? Book via our app for a 10% discount. #workspace', img: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800' }
        ]
    }
];

async function seed() {
    console.log('--- Starting Seed Simulation ---');

    for (const biz of BUSINESSES) {
        console.log(`Processing business: ${biz.name}...`);
        
        const { data: profile } = await supabase.from('profiles').select('id').eq('email', biz.email).single();
        if (!profile) {
            console.error(`Profile not found for ${biz.email}`);
            continue;
        }

        const { data: bizDetails } = await supabase.from('business_details').select('id').eq('profile_id', profile.id).single();
        if (!bizDetails) {
            console.error(`Business details not found for ${biz.name}`);
            continue;
        }

        console.log(`Creating ${biz.posts.length} posts for ${biz.name}...`);
        for (const post of biz.posts) {
            const { error: postErr } = await supabase.from('posts').insert({
                business_id: bizDetails.id,
                content: post.content,
                image_url: post.img,
                latitude: biz.lat,
                longitude: biz.lng,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });

            if (postErr) {
                console.error(`Post Error for ${biz.name}:`, postErr.message);
            }
        }
    }

    console.log('--- Seed Simulation Complete! ---');
}

seed();
