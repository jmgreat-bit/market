import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // Verify the user is authenticated
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { business_name, category, bio, phone, website_url, is_reviews_enabled, latitude, longitude } = body;

        if (!business_name?.trim()) {
            return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
        }

        if (latitude === undefined || longitude === undefined) {
            return NextResponse.json({ error: 'Location coordinates are required' }, { status: 400 });
        }

        // Upsert business details
        const { error: upsertError } = await supabase.from('business_details').upsert({
            profile_id: user.id,
            business_name: business_name.trim(),
            category: category || 'Retail',
            bio: bio?.trim() || null,
            phone: phone?.trim() || null,
            website_url: website_url?.trim() || null,
            latitude: latitude,
            longitude: longitude,
            address: `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`,
            ...(is_reviews_enabled !== undefined ? { is_reviews_enabled } : {}),
        }, { onConflict: 'profile_id' });

        if (upsertError) {
            console.error('Setup business upsert error:', upsertError);
            return NextResponse.json({ error: 'Failed to save business details' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Setup business API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
