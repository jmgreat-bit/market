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

        // Check if Test Mode is enabled
        const isTestMode = process.env.MOMO_TEST_MODE === 'true';

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
                payment_status: isTestMode ? 'completed' : 'pending',
                starts_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });

        if (dbError) throw dbError;

        if (isTestMode) {
            // Bypass MTN entirely and grant credits/tiers instantly
            if (tier.startsWith('ai_')) {
                const pkgName = tier.replace('ai_', '');
                let prompts = 0;
                if (pkgName === 'starter') prompts = 7;
                if (pkgName === 'standard') prompts = 20;
                if (pkgName === 'power') prompts = 100;

                await adminClient.from('ai_credits').insert({
                    user_id: user.id,
                    total_credits: prompts,
                    used_credits: 0,
                    package: pkgName
                });
            } else {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                await adminClient.from('profiles').update({ 
                    trader_tier: tier,
                    is_premium: true,
                    tier_expires_at: expiryDate.toISOString()
                }).eq('id', user.id);
            }
            console.log(`[MOMO PAY] Test mode bypassed payment for ${user.id} - tier: ${tier}`);
            return NextResponse.json({ success: true, referenceId });
        }

        // Initiate payment with MTN
        await momoClient.requestToPay(amount, phone, referenceId);

        return NextResponse.json({ success: true, referenceId });

    } catch (error: any) {
        console.error('MoMo Pay Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
