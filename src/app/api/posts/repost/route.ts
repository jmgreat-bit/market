import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body as { userId?: string };

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 },
      );
    }

    // 1. Find the user's business
    const { data: business, error: bizError } = await supabase
      .from('business_details')
      .select('id')
      .eq('profile_id', userId)
      .limit(1)
      .single();

    if (bizError || !business) {
      console.error('[posts/repost] business lookup error:', bizError);
      return NextResponse.json(
        { error: 'No business found for this user.' },
        { status: 404 },
      );
    }

    const businessId = business.id;

    // 2. Find the most-viewed post for this business
    //    Join posts with post_views, count views, pick top 1
    const { data: topPost, error: topError } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        image_url,
        business_id,
        latitude,
        longitude,
        post_type,
        post_views ( id )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (topError) {
      console.error('[posts/repost] posts query error:', topError);
      return NextResponse.json({ error: topError.message }, { status: 500 });
    }

    if (!topPost || topPost.length === 0) {
      return NextResponse.json(
        { error: 'No posts found for this business.' },
        { status: 404 },
      );
    }

    // Sort by view count descending and pick the most-viewed
    const sorted = topPost.sort((a, b) => {
      const aViews = Array.isArray(a.post_views) ? a.post_views.length : 0;
      const bViews = Array.isArray(b.post_views) ? b.post_views.length : 0;
      return bViews - aViews;
    });

    const best = sorted[0];

    // 3. Clone the post with a fresh created_at
    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert({
        content: best.content,
        image_url: best.image_url,
        business_id: best.business_id,
        latitude: best.latitude,
        longitude: best.longitude,
        post_type: best.post_type,
        // created_at defaults to NOW() via the table default
      })
      .select('id')
      .single();

    if (insertError || !newPost) {
      console.error('[posts/repost] insert error:', insertError);
      return NextResponse.json(
        { error: insertError?.message || 'Failed to create repost.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, postId: newPost.id },
      { status: 200 },
    );
  } catch (err) {
    console.error('[posts/repost] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
