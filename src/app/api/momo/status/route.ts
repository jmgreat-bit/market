import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const referenceId = searchParams.get('id');

        if (!referenceId) {
            return NextResponse.json({ error: 'Missing reference ID' }, { status: 400 });
        }

        if (referenceId.startsWith('ai-sandbox-')) {
            // For AI sandbox, we already granted the credits in the pay route.
            // Just simulate a successful status poll.
            return NextResponse.json({ status: 'completed' });
        }

        const serviceClient = getSupabaseAdminClient();
        
        // Fetch current status from DB
        const { data: sub, error } = await serviceClient
            .from('trader_subscriptions')
            .select('payment_status, tier, profile_id')
            .eq('id', referenceId)
            .single();

        if (error || !sub) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // We just return whatever status is in the DB.
        // The asynchronous webhook (callback/route.ts) will be called by MTN 
        // to update the DB to 'completed' or 'failed'.
        return NextResponse.json({ status: sub.payment_status });

    } catch (error: any) {
        console.error('MoMo Status Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
