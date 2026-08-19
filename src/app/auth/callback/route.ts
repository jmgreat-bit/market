import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    let next = searchParams.get('next') ?? '/feed';

    // Validate the 'next' parameter to prevent open redirect vulnerabilities
    if (!next.startsWith('/') || next.startsWith('//')) {
        next = '/feed';
    }

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (!error && data.session) {
            const userId = data.session.user.id;
            const meta = data.session.user.user_metadata;
            
            // Use admin client to bypass RLS for business_details writes
            let admin: ReturnType<typeof getSupabaseAdminClient> | null = null;
            try {
                admin = getSupabaseAdminClient();
            } catch {
                // Service role key not configured — fall back to regular client
            }
            const dbClient = admin || supabase;

            // Check if the user selected a role before signing in with Google
            const cookieStore = await cookies();
            const intendedRole = cookieStore.get('intended_role')?.value;
            
            if (intendedRole === 'trader' || intendedRole === 'client') {
                // Update their profile to the selected role
                await dbClient.from('profiles').update({ role: intendedRole }).eq('id', userId);
                // Clear the cookie
                cookieStore.delete('intended_role');
                
                // If they signed up as a trader, create business details from metadata
                if (intendedRole === 'trader') {
                    await dbClient.from('business_details').upsert({
                        profile_id: userId,
                        business_name: meta?.business_name || `${meta?.full_name || 'My'}'s Business`,
                        category: meta?.business_category || 'Retail',
                        phone: meta?.business_phone || null,
                        latitude: meta?.location_lat || null,
                        longitude: meta?.location_lng || null,
                        address: meta?.location_lat ? `${Number(meta.location_lat).toFixed(6)}, ${Number(meta.location_lng).toFixed(6)}` : null,
                    }, { onConflict: 'profile_id' });
                    next = '/feed';
                }
            } else {
                // No cookie — this is likely an email verification callback.
                // Check the user's profile role in the database to route them correctly.
                const { data: profile } = await dbClient
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();

                if (profile?.role === 'trader') {
                    // Check if they've already completed business setup
                    const { data: biz } = await dbClient
                        .from('business_details')
                        .select('business_name')
                        .eq('profile_id', userId)
                        .single();

                    if (!biz) {
                        // No row — create one from user metadata
                        if (meta?.business_name && !meta.business_name.endsWith("'s Business")) {
                            await dbClient.from('business_details').upsert({
                                profile_id: userId,
                                business_name: meta.business_name,
                                category: meta.business_category || 'Retail',
                                phone: meta.business_phone || null,
                                latitude: meta.location_lat || null,
                                longitude: meta.location_lng || null,
                                address: meta.location_lat ? `${Number(meta.location_lat).toFixed(6)}, ${Number(meta.location_lng).toFixed(6)}` : null,
                            }, { onConflict: 'profile_id' });
                            next = '/feed';
                        } else {
                            // Create a blank row so setup-business can update it
                            await dbClient.from('business_details').upsert({
                                profile_id: userId,
                                business_name: meta?.business_name || null,
                                category: meta?.business_category || 'Retail',
                            }, { onConflict: 'profile_id' });
                            next = '/setup-business';
                        }
                    } else if (!biz.business_name || biz.business_name.endsWith("'s Business")) {
                        next = '/setup-business';
                    }
                    // else: business_name is set and not a placeholder — keep default next
                }
            }
            
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return the user to an error page or login with error indication
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
