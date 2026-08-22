import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        // Verify the user is authenticated
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const { 
            business_name, 
            category, 
            bio, 
            phone, 
            website_url, 
            is_reviews_enabled, 
            latitude = -1.9441, 
            longitude = 30.0619 
        } = body;

        const effectiveName = business_name?.trim() || user.user_metadata?.full_name || user.user_metadata?.username || 'My Business';
        const effectiveLat = typeof latitude === 'number' ? latitude : -1.9441;
        const effectiveLng = typeof longitude === 'number' ? longitude : 30.0619;

        // Use admin client to bypass RLS
        let admin;
        try {
            admin = getSupabaseAdminClient();
        } catch {
            // Fallback to regular client
            admin = supabase;
        }

        // Upsert business details
        const { data: newBiz, error: upsertError } = await admin.from('business_details').upsert({
            profile_id: user.id,
            business_name: effectiveName,
            category: category || 'Retail',
            bio: bio?.trim() || null,
            phone: phone?.trim() || null,
            website_url: website_url?.trim() || null,
            latitude: effectiveLat,
            longitude: effectiveLng,
            address: `${Number(effectiveLat).toFixed(6)}, ${Number(effectiveLng).toFixed(6)}`,
            ...(is_reviews_enabled !== undefined ? { is_reviews_enabled } : {}),
        }, { onConflict: 'profile_id' }).select().single();

        if (upsertError) {
            console.error('Setup business upsert error:', upsertError);
            return NextResponse.json({ error: 'Failed to save business details: ' + upsertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, business: newBiz });
    } catch (err) {
        console.error('Setup business API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
