import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { momoClient } from '@/lib/momo';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/service';
import { cookies } from 'next/headers';
import { getSupabaseClient } from '@/lib/supabase/client';

export async function POST(req: Request) {
    try {
        const { phone, amount, tier } = await req.json();

        if (!phone || !amount || !tier) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get the current user
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const referenceId = crypto.randomUUID();

        // Save pending transaction to DB
        const serviceClient = getSupabaseServiceRoleClient();
        const { error: dbError } = await serviceClient
            .from('trader_subscriptions')
            .insert({
                id: referenceId,
                profile_id: session.user.id,
                tier: tier,
                amount_rwf: amount,
                payment_method: 'momo',
                payment_status: 'pending',
                starts_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
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
