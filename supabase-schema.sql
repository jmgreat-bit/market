-- ================================================
-- GeoPulse Complete Database Schema
-- Run this in Supabase SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. PROFILES TABLE (extends auth.users)
-- ================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('client', 'trader')) DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 2. BUSINESS_DETAILS TABLE (for traders only)
-- ================================================
CREATE TABLE IF NOT EXISTS public.business_details (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT NOT NULL,
  bio TEXT,
  category TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  phone TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 3. POSTS TABLE (Shouts from traders)
-- ================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES public.business_details(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT, -- Legacy support for single image
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 4. POST_MEDIA TABLE (Multiple images/videos)
-- ================================================
CREATE TABLE IF NOT EXISTS public.post_media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  autoplay BOOLEAN DEFAULT FALSE,
  alt_text TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 5. POST_LINKS TABLE (Rich link previews)
-- ================================================
CREATE TABLE IF NOT EXISTS public.post_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE UNIQUE,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 6. LIKES TABLE (Engagement)
-- ================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ================================================
-- 7. COMMENTS TABLE (Engagement)
-- ================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies: Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies: Business Details
DROP POLICY IF EXISTS "Business details are viewable by everyone" ON public.business_details;
CREATE POLICY "Business details are viewable by everyone" ON public.business_details FOR SELECT USING (true);
DROP POLICY IF EXISTS "Traders can insert own business" ON public.business_details;
CREATE POLICY "Traders can insert own business" ON public.business_details FOR INSERT WITH CHECK (
  auth.uid() = profile_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'trader')
);
DROP POLICY IF EXISTS "Traders can update own business" ON public.business_details;
CREATE POLICY "Traders can update own business" ON public.business_details FOR UPDATE USING (
  auth.uid() = profile_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'trader')
);

-- Policies: Posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Traders can insert own posts" ON public.posts;
CREATE POLICY "Traders can insert own posts" ON public.posts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.business_details WHERE id = business_id AND profile_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'trader')
);

DROP POLICY IF EXISTS "Traders can update own posts" ON public.posts;
CREATE POLICY "Traders can update own posts" ON public.posts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.business_details WHERE id = business_id AND profile_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'trader')
);

DROP POLICY IF EXISTS "Traders can delete own posts" ON public.posts;
CREATE POLICY "Traders can delete own posts" ON public.posts FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.business_details WHERE id = business_id AND profile_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'trader')
);

-- Policies: Media/Links (Viewable by everyone)
DROP POLICY IF EXISTS "Media viewable by everyone" ON public.post_media;
CREATE POLICY "Media viewable by everyone" ON public.post_media FOR SELECT USING (true);
DROP POLICY IF EXISTS "Links viewable by everyone" ON public.post_links;
CREATE POLICY "Links viewable by everyone" ON public.post_links FOR SELECT USING (true);

-- Policies: Likes
DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.likes;
CREATE POLICY "Likes viewable by everyone" ON public.likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own likes" ON public.likes;
CREATE POLICY "Users can manage own likes" ON public.likes FOR ALL USING (auth.uid() = user_id);

-- Policies: Comments
DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.comments;
CREATE POLICY "Comments viewable by everyone" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own comments" ON public.comments;
CREATE POLICY "Users can manage own comments" ON public.comments FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_business_details_location ON public.business_details(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_posts_business_id ON public.posts(business_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON public.post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
