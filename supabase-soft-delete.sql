-- ================================================
-- SOFT DELETE & 7-DAY RECOVERY SYSTEM
-- Run this in your Supabase SQL Editor
-- ================================================

-- 1. Add the scheduled_for_deletion_at column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS scheduled_for_deletion_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create RPC function to schedule account deletion
CREATE OR REPLACE FUNCTION public.schedule_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow the authenticated user to schedule their own account
  UPDATE public.profiles
  SET scheduled_for_deletion_at = NOW()
  WHERE id = auth.uid();
END;
$$;

-- 3. Create RPC function to recover account
CREATE OR REPLACE FUNCTION public.recover_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow the authenticated user to recover their own account
  UPDATE public.profiles
  SET scheduled_for_deletion_at = NULL
  WHERE id = auth.uid();
END;
$$;

-- ================================================
-- CRON JOB FOR PERMANENT DELETION (Requires pg_cron)
-- ================================================
-- Note: Supabase supports pg_cron by default on all projects.
-- We create a background job that runs every day at midnight.
-- It checks for accounts where scheduled_for_deletion_at was exactly or more than 7 days ago,
-- and physically deletes them from the auth.users table.
-- Because of our ON DELETE CASCADE rules, all their posts, business info, etc., will be completely wiped automatically.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing cron job with the same name to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hard_delete_expired_accounts') THEN
    PERFORM cron.unschedule('hard_delete_expired_accounts');
  END IF;
END $$;

-- Schedule the job to run daily at midnight ('0 0 * * *')
SELECT cron.schedule(
  'hard_delete_expired_accounts',
  '0 0 * * *',
  $$
    DELETE FROM auth.users 
    WHERE id IN (
      SELECT id FROM public.profiles 
      WHERE scheduled_for_deletion_at IS NOT NULL 
        AND scheduled_for_deletion_at <= NOW() - INTERVAL '7 days'
    );
  $$
);
