-- ================================================
-- MarketPLC — Alerts / Notifications System
-- Run this in Supabase SQL Editor
-- ================================================

-- ================================================
-- 1. ALERTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL DEFAULT 'system',
  -- type values: 'like' | 'comment' | 'reply' | 'follow' | 'system'
  title           TEXT        NOT NULL,
  body            TEXT,
  is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
  related_post_id UUID        REFERENCES public.posts(id) ON DELETE SET NULL,
  from_user_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id    ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read    ON public.alerts(user_id, is_read);

-- Row Level Security
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own alerts"   ON public.alerts;
CREATE POLICY "Users can view their own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own alerts" ON public.alerts;
CREATE POLICY "Users can update their own alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can insert alerts (needed for triggers & backend)
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.alerts;
CREATE POLICY "Service role can insert alerts" ON public.alerts
  FOR INSERT WITH CHECK (TRUE);

-- ================================================
-- 2. WELCOME NOTIFICATION TRIGGER
--    Fires after a new profile is created (which
--    happens right after auth.users signup).
-- ================================================
CREATE OR REPLACE FUNCTION public.send_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.alerts (user_id, type, title, body)
  VALUES (
    NEW.id,
    'system',
    '👋 Welcome to MarketPLC!',
    'Discover local businesses, follow your favourites and get notified about deals near you. Happy exploring!'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if it already exists so re-running is safe
DROP TRIGGER IF EXISTS on_profile_created_welcome ON public.profiles;

CREATE TRIGGER on_profile_created_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_notification();

-- ================================================
-- 3. LIKE NOTIFICATION TRIGGER
--    Sends an alert to the post owner when someone
--    likes their post.
-- ================================================
CREATE OR REPLACE FUNCTION public.send_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner_id   UUID;
  v_business_name   TEXT;
  v_liker_name      TEXT;
BEGIN
  -- Find who owns the post via business_details → profiles
  SELECT p.id, bd.business_name
    INTO v_post_owner_id, v_business_name
    FROM public.posts po
    JOIN public.business_details bd ON bd.id = po.business_id
    JOIN public.profiles p           ON p.id  = bd.profile_id
   WHERE po.id = NEW.post_id
   LIMIT 1;

  -- Don't notify if the liker IS the post owner
  IF v_post_owner_id IS NULL OR v_post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get the liker's display name
  SELECT COALESCE(full_name, username, 'Someone') INTO v_liker_name
    FROM public.profiles WHERE id = NEW.user_id LIMIT 1;

  INSERT INTO public.alerts (user_id, type, title, body, related_post_id, from_user_id)
  VALUES (
    v_post_owner_id,
    'like',
    v_liker_name || ' liked your post ❤️',
    NULL,
    NEW.post_id,
    NEW.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_created_notify ON public.likes;

CREATE TRIGGER on_like_created_notify
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.send_like_notification();

-- ================================================
-- 4. COMMENT NOTIFICATION TRIGGER
--    Sends an alert to the post owner when someone
--    comments on their post.
-- ================================================
CREATE OR REPLACE FUNCTION public.send_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner_id UUID;
  v_commenter_name TEXT;
BEGIN
  SELECT p.id
    INTO v_post_owner_id
    FROM public.posts po
    JOIN public.business_details bd ON bd.id = po.business_id
    JOIN public.profiles p           ON p.id  = bd.profile_id
   WHERE po.id = NEW.post_id
   LIMIT 1;

  IF v_post_owner_id IS NULL OR v_post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, username, 'Someone') INTO v_commenter_name
    FROM public.profiles WHERE id = NEW.user_id LIMIT 1;

  INSERT INTO public.alerts (user_id, type, title, body, related_post_id, from_user_id)
  VALUES (
    v_post_owner_id,
    'comment',
    v_commenter_name || ' commented on your post 💬',
    LEFT(NEW.content, 120),
    NEW.post_id,
    NEW.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created_notify ON public.comments;

CREATE TRIGGER on_comment_created_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.send_comment_notification();
