import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { momoClient } from '@/lib/momo';

export async function POST(req: Request) {
    try {
        // MTN will send a JSON payload with the transaction status
        // In reality, this requires checking the signature, but for sandbox we just read the body
        const payload = await req.json();
        const referenceId = payload.externalId || req.url.split('/').pop(); // Sometimes passed as externalId or in URL

        console.log(`[MOMO WEBHOOK] Received payload:`, payload);

        // Verify transaction status securely with MoMo API
        let actualStatus = 'FAILED';
        if (referenceId) {
            try {
                actualStatus = await momoClient.getTransactionStatus(referenceId);
                console.log(`[MOMO WEBHOOK] Verified status for ${referenceId}:`, actualStatus);
            } catch (err) {
                console.error(`[MOMO WEBHOOK] Failed to verify status for ${referenceId}`, err);
            }
        }

        if (actualStatus === 'SUCCESSFUL') {
            const serviceClient = getSupabaseAdminClient();
            
            // Get the subscription record
            const { data: sub } = await serviceClient
                .from('trader_subscriptions')
                .select('*')
                .eq('id', referenceId)
                .single();

            if (sub && sub.payment_status === 'pending') {
                // Mark as completed
                await serviceClient
                    .from('trader_subscriptions')
                    .update({ payment_status: 'completed' })
                    .eq('id', referenceId);

                if (sub.tier.startsWith('ai_')) {
                    const pkgName = sub.tier.replace('ai_', '');
                    let prompts = 0;
                    if (pkgName === 'starter') prompts = 7;
                    if (pkgName === 'standard') prompts = 20;
                    if (pkgName === 'power') prompts = 100;

                    await serviceClient.from('ai_credits').insert({
                        user_id: sub.profile_id,
                        total_credits: prompts,
                        used_credits: 0,
                        package: pkgName
                    });
                    console.log(`[MOMO WEBHOOK] Successfully granted ${prompts} AI credits to user ${sub.profile_id}`);
                } else {
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + 30);
                    
                    const { error: profileUpdateError } = await serviceClient
                        .from('profiles')
                        .update({ 
                            trader_tier: sub.tier,
                            is_premium: true,
                            tier_expires_at: expiryDate.toISOString()
                        })
                        .eq('id', sub.profile_id);
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('MoMo Callback Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
