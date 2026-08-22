import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_MAP_CENTER } from '@/lib/constants';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const {
            content = '',
            imageUrl = null,
            uploadedUrls = [],
            postType = 'standard',
            durationHours = 24,
            counterValue = null,
            counterLabel = null,
            pollOptions = []
        } = body;

        let admin;
        try {
            admin = getSupabaseAdminClient();
        } catch {
            admin = supabase;
        }

        // 1. Get or create business details
        let { data: business } = await admin
            .from('business_details')
            .select('id, latitude, longitude')
            .eq('profile_id', user.id)
            .maybeSingle();

        if (!business) {
            const { data: profile } = await admin
                .from('profiles')
                .select('full_name, username')
                .eq('id', user.id)
                .maybeSingle();

            const autoName = profile?.full_name || profile?.username || user.user_metadata?.full_name || 'My Shop';

            const { data: newBiz, error: createBizErr } = await admin
                .from('business_details')
                .upsert({
                    profile_id: user.id,
                    business_name: autoName,
                    category: 'Retail',
                    latitude: DEFAULT_MAP_CENTER.lat,
                    longitude: DEFAULT_MAP_CENTER.lng,
                    address: `${DEFAULT_MAP_CENTER.lat}, ${DEFAULT_MAP_CENTER.lng}`,
                }, { onConflict: 'profile_id' })
                .select('id, latitude, longitude')
                .single();

            if (createBizErr || !newBiz) {
                return NextResponse.json({ error: 'Could not initialize your business profile.' }, { status: 500 });
            }
            business = newBiz;
        }

        // 2. Calculate expiration
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (Number(durationHours) || 24));

        // 3. Generate slug & effective content
        let effectiveContent = content?.trim() || '';
        if (!effectiveContent) {
            if (postType === 'counter') {
                effectiveContent = counterLabel?.trim() || 'Live Counter';
            } else if (postType === 'poll') {
                effectiveContent = 'Community Poll';
            } else if (uploadedUrls.length > 0 || imageUrl) {
                effectiveContent = 'Photo update';
            } else {
                effectiveContent = 'Update';
            }
        }

        const baseSlug = effectiveContent
            ? effectiveContent.substring(0, 30).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-')
            : 'post';
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const slug = `${baseSlug || 'post'}-${randomSuffix}`;

        // 4. Create post
        const { data: newPost, error: postError } = await admin
            .from('posts')
            .insert({
                business_id: business.id,
                content: effectiveContent,
                slug: slug,
                image_url: imageUrl || (uploadedUrls.length > 0 ? uploadedUrls[0] : null),
                latitude: business.latitude ?? DEFAULT_MAP_CENTER.lat,
                longitude: business.longitude ?? DEFAULT_MAP_CENTER.lng,
                post_type: postType,
                is_pinned: false,
                counter_value: postType === 'counter' ? (typeof counterValue === 'number' ? counterValue : 0) : null,
                counter_label: postType === 'counter' ? counterLabel?.trim() : null,
                expires_at: expiresAt.toISOString(),
            })
            .select('id, slug')
            .single();

        if (postError || !newPost) {
            console.error('Create post error:', postError);
            return NextResponse.json({ error: 'Failed to create post: ' + (postError?.message || 'Unknown error') }, { status: 500 });
        }

        // 5. Insert poll options if poll type
        if (postType === 'poll' && Array.isArray(pollOptions) && pollOptions.length > 0) {
            const filteredOptions = pollOptions
                .filter((o: any) => typeof o === 'string' && o.trim())
                .map((label: string) => ({ post_id: newPost.id, label: label.trim() }));

            if (filteredOptions.length > 0) {
                const { error: pollError } = await admin
                    .from('poll_options')
                    .insert(filteredOptions);
                if (pollError) {
                    console.error('Create poll options error:', pollError);
                }
            }
        }

        // 6. Insert post media for multi-photo
        if (Array.isArray(uploadedUrls) && uploadedUrls.length > 0) {
            const mediaRows = uploadedUrls.map((url: string, i: number) => ({
                post_id: newPost.id,
                type: 'image',
                url: url,
                order: i
            }));

            const { error: mediaError } = await admin
                .from('post_media')
                .insert(mediaRows);

            if (mediaError) {
                console.error('Create post media error:', mediaError);
            }
        }

        return NextResponse.json({ success: true, post: newPost });
    } catch (err: any) {
        console.error('Create post server error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
