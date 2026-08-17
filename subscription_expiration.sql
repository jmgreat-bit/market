-- =================================================================================
-- Implement Trader Subscription Expiration & Notifications
-- =================================================================================

-- 1. Add expiration column to profiles (if it doesn't exist)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tier_expires_at TIMESTAMPTZ NULL;

-- 2. Create function to downgrade expired subscriptions and send alerts
CREATE OR REPLACE FUNCTION public.process_subscription_expirations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _downgraded_count INT;
  _alerted_count INT;
BEGIN
  -- A. Send 3-day warning alerts
  -- Find profiles expiring in exactly 3 days (between 72 and 96 hours from now)
  -- that haven't already received an alert for this expiration.
  WITH to_alert AS (
    SELECT id
    FROM public.profiles
    WHERE role = 'trader'
      AND trader_tier IN ('pro', 'national')
      AND tier_expires_at IS NOT NULL
      AND tier_expires_at > NOW() + INTERVAL '2 days'
      AND tier_expires_at <= NOW() + INTERVAL '3 days'
      -- Ensure we don't spam them by checking if an alert was sent recently
      AND NOT EXISTS (
        SELECT 1 FROM public.alerts 
        WHERE user_id = profiles.id 
          AND type = 'system' 
          AND title = 'Subscription Expiring Soon'
          AND created_at > NOW() - INTERVAL '4 days'
      )
  )
  INSERT INTO public.alerts (user_id, type, title, body, is_read, created_at)
  SELECT 
    id, 
    'system', 
    'Subscription Expiring Soon', 
    'Your premium trader subscription will expire in 3 days. Renew now to keep your benefits!', 
    FALSE, 
    NOW()
  FROM to_alert;

  GET DIAGNOSTICS _alerted_count = ROW_COUNT;
  RAISE NOTICE 'Sent % expiration alerts', _alerted_count;

  -- B. Downgrade expired subscriptions
  UPDATE public.profiles
  SET 
    trader_tier = 'free',
    is_premium = FALSE
  WHERE 
    role = 'trader'
    AND trader_tier IN ('pro', 'national')
    AND tier_expires_at IS NOT NULL
    AND tier_expires_at <= NOW();

  GET DIAGNOSTICS _downgraded_count = ROW_COUNT;
  RAISE NOTICE 'Downgraded % expired subscriptions', _downgraded_count;

  -- You could also insert a 'downgraded' alert here if desired
END;
$$;

-- 3. Schedule the function to run daily at midnight UTC
-- Note: Requires pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if any to avoid duplicates
SELECT cron.unschedule('daily_subscription_expiration_check');

-- Schedule the job
SELECT cron.schedule(
  'daily_subscription_expiration_check',
  '0 0 * * *', -- Run at 00:00 every day
  'SELECT public.process_subscription_expirations();'
);
