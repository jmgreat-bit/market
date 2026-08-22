import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Please log in to redeem a promo code.' }, { status: 401 });
        }

        const body = await req.json();
        const rawCode = body?.code;

        if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
            return NextResponse.json({ error: 'Please enter a valid promo code.' }, { status: 400 });
        }

        const code = rawCode.trim().toUpperCase();
        const admin = getSupabaseAdminClient();

        // 1. Check if promo_codes table exists & fetch code
        let promo: any = null;
        const { data: promoData, error: promoError } = await admin
            .from('promo_codes')
            .select('*')
            .ilike('code', code)
            .maybeSingle();

        if (promoData) {
            promo = promoData;
        } else {
            // Built-in fallback codes in case migration is still pending
            const BUILTIN_CODES: Record<string, { tier: string; duration_days: number; description: string }> = {
                'LAUNCH2026': { tier: 'pro', duration_days: 30, description: 'Early Bird Launch Promo - 30 Days Pro' },
                'VIPTRADER': { tier: 'pro', duration_days: 60, description: 'VIP Trader Access - 60 Days Pro' },
                'SYNCHROPRO': { tier: 'pro', duration_days: 30, description: 'Partner Promo - 30 Days Pro' },
                'NATIONALFREE': { tier: 'national', duration_days: 14, description: 'National Tier Trial - 14 Days' },
            };

            if (BUILTIN_CODES[code]) {
                const b = BUILTIN_CODES[code];
                promo = {
                    id: null,
                    code,
                    tier: b.tier,
                    duration_days: b.duration_days,
                    max_uses: 500,
                    current_uses: 0,
                    is_active: true,
                };
            }
        }

        if (!promo) {
            return NextResponse.json({ error: 'Invalid or expired promo code.' }, { status: 404 });
        }

        if (!promo.is_active) {
            return NextResponse.json({ error: 'This promo code is no longer active.' }, { status: 400 });
        }

        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
            return NextResponse.json({ error: 'This promo code has expired.' }, { status: 400 });
        }

        if (promo.max_uses && promo.current_uses >= promo.max_uses) {
            return NextResponse.json({ error: 'This promo code has reached its maximum redemptions limit.' }, { status: 400 });
        }

        // 2. Check if this user already redeemed this promo
        if (promo.id) {
            const { data: existingRedemption } = await admin
                .from('promo_redemptions')
                .select('id')
                .eq('promo_id', promo.id)
                .eq('user_id', user.id)
                .maybeSingle();

            if (existingRedemption) {
                return NextResponse.json({ error: 'You have already redeemed this promo code.' }, { status: 400 });
            }
        }

        // 3. Calculate strict expiration date
        const durationDays = promo.duration_days || 30;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);
        const expiresAtIso = expiresAt.toISOString();

        // 4. Update user profile
        const { error: updateError } = await admin
            .from('profiles')
            .update({
                trader_tier: promo.tier,
                is_premium: true,
                tier_expires_at: expiresAtIso,
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Failed to update user profile tier:', updateError);
            return NextResponse.json({ error: 'Failed to apply promo to profile.' }, { status: 500 });
        }

        // 5. Record redemption & increment usage (if promo has a DB record)
        if (promo.id) {
            await admin.from('promo_redemptions').insert({
                promo_id: promo.id,
                user_id: user.id,
                tier_granted: promo.tier,
                duration_days: durationDays,
                expires_at: expiresAtIso,
                status: 'active',
            });

            await admin.from('promo_codes').update({
                current_uses: (promo.current_uses || 0) + 1,
            }).eq('id', promo.id);
        }

        return NextResponse.json({
            success: true,
            tier: promo.tier,
            duration_days: durationDays,
            expires_at: expiresAtIso,
            message: `🎉 Success! You've been upgraded to ${promo.tier.toUpperCase()} Tier for ${durationDays} days (until ${expiresAt.toLocaleDateString()}).`,
        });

    } catch (err: any) {
        console.error('Error redeeming promo code:', err);
        return NextResponse.json({ error: err.message || 'Server error redeeming promo code.' }, { status: 500 });
    }
}
