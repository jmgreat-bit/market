-- ================================================
-- MarketPLC / GeoPulse — Final Schema Migration
-- Run this ONCE in Supabase SQL Editor
-- ================================================

-- ================================================
-- 1. BOOKMARKS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON public.bookmarks(post_id);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own bookmarks
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own bookmarks
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 2. POST VIEWS TABLE (if not already created)
-- ================================================
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_created_at ON public.post_views(created_at);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert views
DROP POLICY IF EXISTS "Authenticated users can insert views" ON public.post_views;
CREATE POLICY "Authenticated users can insert views" ON public.post_views
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Traders can view analytics for their own posts
DROP POLICY IF EXISTS "Traders can view analytics for their posts" ON public.post_views;
CREATE POLICY "Traders can view analytics for their posts" ON public.post_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.business_details b ON p.business_id = b.id
      WHERE p.id = post_views.post_id AND b.profile_id = auth.uid()
    )
  );

-- ================================================
-- 3. STORE NAVIGATIONS TABLE (if not already created)
-- ================================================
CREATE TABLE IF NOT EXISTS public.store_navigations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.business_details(id) ON DELETE CASCADE,
  navigator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_navs_business_id ON public.store_navigations(business_id);
CREATE INDEX IF NOT EXISTS idx_store_navs_created_at ON public.store_navigations(created_at);

ALTER TABLE public.store_navigations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert navigations" ON public.store_navigations;
CREATE POLICY "Anyone can insert navigations" ON public.store_navigations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Traders can view navigations for their business" ON public.store_navigations;
CREATE POLICY "Traders can view navigations for their business" ON public.store_navigations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_details b
      WHERE b.id = store_navigations.business_id AND b.profile_id = auth.uid()
    )
  );

-- ================================================
-- 4. COMMENTS TABLE — add image_url column
-- ================================================
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ================================================
-- 5. STORAGE BUCKET POLICIES
-- Run these only if you've created the buckets
-- 'post-media' and 'avatars' in Supabase Dashboard
-- ================================================

-- Post Media bucket: authenticated users can upload
-- (Create bucket 'post-media' as Public via Dashboard first)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated uploads to post-media
DROP POLICY IF EXISTS "Authenticated users can upload post media" ON storage.objects;
CREATE POLICY "Authenticated users can upload post media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-media' AND auth.uid() IS NOT NULL
);

-- Allow public reads on post-media
DROP POLICY IF EXISTS "Public can read post media" ON storage.objects;
CREATE POLICY "Public can read post media"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

-- Allow authenticated uploads to avatars
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND auth.uid() IS NOT NULL
);

-- Allow public reads on avatars
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND auth.uid() IS NOT NULL
);

-- ================================================
-- 6. TRADER METRICS RPC (supports time_filter param)
-- ================================================
DROP FUNCTION IF EXISTS public.get_trader_metrics(UUID);
DROP FUNCTION IF EXISTS public.get_trader_metrics(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.get_trader_metrics(
  trader_user_id UUID,
  time_filter TEXT DEFAULT 'all'  -- 'today' | 'week' | 'month' | 'all'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bus_id UUID;
  v_since TIMESTAMPTZ;
  v_total_views INT;
  v_total_engagements INT;
  v_likes INT;
  v_comms INT;
  v_total_navigations INT;
  v_engagement_rate FLOAT;
BEGIN
  SELECT id INTO v_bus_id FROM public.business_details WHERE profile_id = trader_user_id LIMIT 1;

  IF v_bus_id IS NULL THEN
    RETURN json_build_object('error', 'No business found');
  END IF;

  -- Determine the start date based on time_filter
  v_since := CASE time_filter
    WHEN 'today' THEN DATE_TRUNC('day', NOW())
    WHEN 'week'  THEN NOW() - INTERVAL '7 days'
    WHEN 'month' THEN NOW() - INTERVAL '30 days'
    ELSE          '1970-01-01'::TIMESTAMPTZ
  END;

  SELECT COUNT(*) INTO v_total_views
  FROM public.post_views pv
  JOIN public.posts p ON pv.post_id = p.id
  WHERE p.business_id = v_bus_id
    AND pv.created_at >= v_since;

  SELECT COUNT(*) INTO v_likes
  FROM public.likes l
  JOIN public.posts p ON l.post_id = p.id
  WHERE p.business_id = v_bus_id
    AND l.created_at >= v_since;

  SELECT COUNT(*) INTO v_comms
  FROM public.comments c
  JOIN public.posts p ON c.post_id = p.id
  WHERE p.business_id = v_bus_id
    AND c.created_at >= v_since;

  v_total_engagements := v_likes + v_comms;

  IF v_total_views > 0 THEN
    v_engagement_rate := (v_total_engagements::FLOAT / v_total_views::FLOAT) * 100;
  ELSE
    v_engagement_rate := 0;
  END IF;

  SELECT COUNT(*) INTO v_total_navigations
  FROM public.store_navigations
  WHERE business_id = v_bus_id
    AND created_at >= v_since;

  RETURN json_build_object(
    'total_views',        v_total_views,
    'total_engagements',  v_total_engagements,
    'total_likes',        v_likes,
    'total_comments',     v_comms,
    'engagement_rate',    ROUND(v_engagement_rate::numeric, 1),
    'total_navigations',  v_total_navigations,
    'time_filter',        time_filter
  );
END;
$$;

-- ================================================
-- 7. PROFILES TABLE — Add username and uniqueness
-- ================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- ================================================
-- 7b. BUSINESS DETAILS TABLE — Add social links
-- ================================================
ALTER TABLE public.business_details
  ADD COLUMN IF NOT EXISTS website_url TEXT;

ALTER TABLE public.business_details
  ADD COLUMN IF NOT EXISTS twitter_url TEXT;

ALTER TABLE public.business_details
  ADD COLUMN IF NOT EXISTS instagram_url TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
    END IF;
END $$;

-- ================================================
-- 8. UPDATE AUTO-CREATE PROFILE TRIGGER
-- Make sure the username is inserted during signup
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
