import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, categoryMatch, latitude, longitude, searcherId } = body as {
      query?: string;
      categoryMatch?: string;
      latitude?: number;
      longitude?: number;
      searcherId?: string;
    };

    if (!query) {
      return NextResponse.json(
        { error: 'Missing required field: query' },
        { status: 400 },
      );
    }

    const { error } = await supabase.from('search_logs').insert({
      query,
      category_match: categoryMatch || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      searcher_id: searcherId || null,
    });

    if (error) {
      console.error('[analytics/search-log] insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[analytics/search-log] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
