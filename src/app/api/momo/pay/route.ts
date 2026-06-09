import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { momoClient } from '@/lib/momo';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { phone, amount, tier } = await req.json();

        if (!phone || !amount || !tier) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get the current user via server-side Supabase client
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const referenceId = crypto.randomUUID();

        // Save pending transaction to DB using admin client (bypasses RLS)
        const adminClient = getSupabaseAdminClient();
        const { error: dbError } = await adminClient
            .from('trader_subscriptions')
            .insert({
                id: referenceId,
                profile_id: user.id,
                tier: tier,
                amount_rwf: amount,
                payment_method: 'momo',
                payment_status: 'pending',
                starts_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });

        if (dbError) throw dbError;

        // Initiate payment with MTN
        await momoClient.requestToPay(amount, phone, referenceId);

        return NextResponse.json({ success: true, referenceId });

    } catch (error: any) {
        console.error('MoMo Pay Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
