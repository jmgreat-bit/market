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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: userId' },
        { status: 400 },
      );
    }

    const { data, error } = await getSupabase().rpc('get_demand_summary', {
      trader_user_id: userId,
    });

    if (error) {
      console.error('[analytics/demand-summary] RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('[analytics/demand-summary] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
