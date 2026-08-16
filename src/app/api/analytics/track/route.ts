import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, type } = body as {
      businessId?: string;
      type?: 'view' | 'whatsapp' | 'website' | 'phone';
    };

    if (!businessId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: businessId and type are required.' },
        { status: 400 },
      );
    }

    const validTypes = ['view', 'whatsapp', 'website', 'phone'] as const;
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const viewerId = user?.id || null;

    if (type === 'view') {
      const { error } = await supabase.from('profile_views').insert({
        business_id: businessId,
        viewer_id: viewerId,
      });

      if (error) {
        console.error('[analytics/track] profile_views insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // type is 'whatsapp', 'website', or 'phone'
      const { error } = await supabase.from('contact_clicks').insert({
        business_id: businessId,
        click_type: type,
        viewer_id: viewerId,
      });

      if (error) {
        console.error('[analytics/track] contact_clicks insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[analytics/track] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
