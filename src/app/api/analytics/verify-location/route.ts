import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

export async function POST(req: NextRequest) {
    try {
        const { latitude, longitude } = await req.json();

        if (latitude === undefined || longitude === undefined) {
            return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get trader's business details
        const { data: business, error: bizError } = await supabase
            .from('business_details')
            .select('id, latitude, longitude')
            .eq('profile_id', user.id)
            .single();

        if (bizError || !business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        // Calculate distance
        const distanceMeters = getDistanceMeters(
            latitude, 
            longitude, 
            business.latitude, 
            business.longitude
        );

        const isVerified = distanceMeters <= 200.0;

        // Log the verification
        const { error: logError } = await supabase
            .from('location_verifications')
            .insert({
                business_id: business.id,
                latitude,
                longitude,
                distance_meters: distanceMeters,
                is_verified: isVerified
            });

        if (logError) {
            console.error('Failed to log location verification:', logError);
            // Non-fatal, we continue
        }

        // Update last_verified_at if successful
        if (isVerified) {
            await supabase
                .from('business_details')
                .update({ last_verified_at: new Date().toISOString() })
                .eq('id', business.id);
        }

        return NextResponse.json({
            success: true,
            isVerified,
            distanceMeters: Math.round(distanceMeters)
        });

    } catch (err) {
        console.error('Location verify error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
