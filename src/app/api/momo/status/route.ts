import { NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/service';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const referenceId = searchParams.get('id');

        if (!referenceId) {
            return NextResponse.json({ error: 'Missing reference ID' }, { status: 400 });
        }

        const serviceClient = getSupabaseServiceRoleClient();
        
        // Fetch current status from DB
        const { data: sub, error } = await serviceClient
            .from('trader_subscriptions')
            .select('payment_status, tier, profile_id')
            .eq('id', referenceId)
            .single();

        if (error || !sub) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // In a real integration, we would poll the MTN API here:
        // const status = await momoClient.getStatus(referenceId);
        // For development sandbox, we will automatically set it to 'completed' after a few seconds of polling
        
        if (sub.payment_status === 'pending') {
            // Mock sandbox completion: upgrade the user directly for testing
            const { error: updateSubError } = await serviceClient
                .from('trader_subscriptions')
                .update({ payment_status: 'completed' })
                .eq('id', referenceId);

            if (!updateSubError) {
                // Update user profile
                await serviceClient
                    .from('profiles')
                    .update({ 
                        trader_tier: sub.tier,
                        is_premium: true
                    })
                    .eq('id', sub.profile_id);
            }
            
            return NextResponse.json({ status: 'completed' });
        }

        return NextResponse.json({ status: sub.payment_status });

    } catch (error: any) {
        console.error('MoMo Status Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
