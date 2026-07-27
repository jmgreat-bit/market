import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


let _supabaseClient: any = null;
const getSupabase = () => {
  if (_supabaseClient) return _supabaseClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  }
  _supabaseClient = createClient(supabaseUrl, supabaseKey);
  return _supabaseClient;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, type, viewerId } = body as {
      businessId?: string;
      type?: 'view' | 'whatsapp' | 'website' | 'phone';
      viewerId?: string;
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

    if (type === 'view') {
      const { error } = await getSupabase().from('profile_views').insert({
        business_id: businessId,
        viewer_id: viewerId || null,
      });

      if (error) {
        console.error('[analytics/track] profile_views insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // type is 'whatsapp', 'website', or 'phone'
      const { error } = await getSupabase().from('contact_clicks').insert({
        business_id: businessId,
        click_type: type,
        viewer_id: viewerId || null,
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
