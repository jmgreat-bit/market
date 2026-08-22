-- ================================================
-- POST MEDIA & AUXILIARY TABLES RLS POLICIES FIX
-- ================================================

-- 1. POST MEDIA
ALTER TABLE IF EXISTS public.post_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Media viewable by everyone" ON public.post_media;
CREATE POLICY "Media viewable by everyone" ON public.post_media FOR SELECT USING (true);

DROP POLICY IF EXISTS "Traders can insert media for own posts" ON public.post_media;
CREATE POLICY "Traders can insert media for own posts" ON public.post_media FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts p
    JOIN public.business_details b ON b.id = p.business_id
    WHERE p.id = post_id AND b.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Traders can update media for own posts" ON public.post_media;
CREATE POLICY "Traders can update media for own posts" ON public.post_media FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    JOIN public.business_details b ON b.id = p.business_id
    WHERE p.id = post_id AND b.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Traders can delete media for own posts" ON public.post_media;
CREATE POLICY "Traders can delete media for own posts" ON public.post_media FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    JOIN public.business_details b ON b.id = p.business_id
    WHERE p.id = post_id AND b.profile_id = auth.uid()
  )
);

-- 2. POLL OPTIONS
ALTER TABLE IF EXISTS public.poll_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Poll options viewable by everyone" ON public.poll_options;
CREATE POLICY "Poll options viewable by everyone" ON public.poll_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Traders can insert poll options for own posts" ON public.poll_options;
CREATE POLICY "Traders can insert poll options for own posts" ON public.poll_options FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts p
    JOIN public.business_details b ON b.id = p.business_id
    WHERE p.id = post_id AND b.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Traders can update poll options for own posts" ON public.poll_options;
CREATE POLICY "Traders can update poll options for own posts" ON public.poll_options FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    JOIN public.business_details b ON b.id = p.business_id
    WHERE p.id = post_id AND b.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Traders can delete poll options for own posts" ON public.poll_options;
CREATE POLICY "Traders can delete poll options for own posts" ON public.poll_options FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    JOIN public.business_details b ON b.id = p.business_id
    WHERE p.id = post_id AND b.profile_id = auth.uid()
  )
);

-- 3. POST LINKS
ALTER TABLE IF EXISTS public.post_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Links viewable by everyone" ON public.post_links;
CREATE POLICY "Links viewable by everyone" ON public.post_links FOR SELECT USING (true);

DROP POLICY IF EXISTS "Traders can insert links for own posts" ON public.post_links;
CREATE POLICY "Traders can insert links for own posts" ON public.post_links FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts p
    JOIN public.business_details b ON b.id = p.business_id
    WHERE p.id = post_id AND b.profile_id = auth.uid()
  )
);
