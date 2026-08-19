import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    let next = searchParams.get('next') ?? '/map';

    // Validate the 'next' parameter to prevent open redirect vulnerabilities
    if (!next.startsWith('/') || next.startsWith('//')) {
        next = '/map';
    }

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (!error && data.session) {
            // Check if the user selected a role before signing in with Google
            const cookieStore = await cookies();
            const intendedRole = cookieStore.get('intended_role')?.value;
            
            if (intendedRole === 'trader' || intendedRole === 'client') {
                // Update their profile to the selected role
                await supabase.from('profiles').update({ role: intendedRole }).eq('id', data.session.user.id);
                // Clear the cookie
                cookieStore.delete('intended_role');
                
                // If they signed up as a trader, create business details from metadata
                if (intendedRole === 'trader') {
                    const meta = data.session.user.user_metadata;
                    await supabase.from('business_details').upsert({
                        profile_id: data.session.user.id,
                        business_name: meta?.business_name || `${meta?.full_name || 'My'}'s Business`,
                        category: meta?.business_category || 'Retail',
                        phone: meta?.business_phone || null,
                        latitude: meta?.location_lat || null,
                        longitude: meta?.location_lng || null,
                        address: meta?.location_lat ? `${meta.location_lat.toFixed(6)}, ${meta.location_lng.toFixed(6)}` : null,
                    }, { onConflict: 'profile_id' });
                    next = '/feed';
                }
            } else {
                // No cookie — this is likely an email verification callback.
                // Check the user's profile role in the database to route them correctly.
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.session.user.id)
                    .single();

                if (profile?.role === 'trader') {
                    // Check if they've already completed business setup
                    const { data: biz } = await supabase
                        .from('business_details')
                        .select('business_name')
                        .eq('profile_id', data.session.user.id)
                        .single();

                    if (!biz) {
                        // No row — create one from user metadata
                        const meta = data.session.user.user_metadata;
                        if (meta?.business_name && !meta.business_name.endsWith("'s Business")) {
                            await supabase.from('business_details').upsert({
                                profile_id: data.session.user.id,
                                business_name: meta.business_name,
                                category: meta.business_category || 'Retail',
                                phone: meta.business_phone || null,
                                latitude: meta.location_lat || null,
                                longitude: meta.location_lng || null,
                                address: meta.location_lat ? `${meta.location_lat.toFixed(6)}, ${meta.location_lng.toFixed(6)}` : null,
                            }, { onConflict: 'profile_id' });
                            // Business details created from metadata — go to feed
                            next = '/feed';
                        } else {
                            next = '/setup-business';
                        }
                    } else if (!biz.business_name || biz.business_name.endsWith("'s Business")) {
                        // Row exists but still has placeholder name
                        next = '/setup-business';
                    }
                    // else: business_name is set and not a placeholder — keep default next (/map or /feed)
                }
            }
            
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return the user to an error page or login with error indication
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}

