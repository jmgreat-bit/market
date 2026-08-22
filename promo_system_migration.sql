-- 1. Create promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    tier TEXT NOT NULL DEFAULT 'pro',
    duration_days INT NOT NULL DEFAULT 30,
    max_uses INT NOT NULL DEFAULT 100,
    current_uses INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create promo_redemptions table
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier_granted TEXT NOT NULL,
    duration_days INT NOT NULL,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    UNIQUE(promo_id, user_id)
);

-- 3. Insert Starter Launch Promo Codes
INSERT INTO public.promo_codes (code, description, tier, duration_days, max_uses, is_active)
VALUES 
    ('LAUNCH2026', 'Early Bird Launch Promo - 30 Days Pro', 'pro', 30, 200, true),
    ('VIPTRADER', 'VIP Trader Access - 60 Days Pro', 'pro', 60, 50, true),
    ('SYNCHROPRO', 'Special Partner Promo - 30 Days Pro', 'pro', 30, 100, true)
ON CONFLICT (code) DO NOTHING;

-- 4. Enable Row Level Security
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Allow authenticated read of active promo codes" ON public.promo_codes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own redemptions" ON public.promo_redemptions
    FOR SELECT USING (auth.uid() = user_id);
