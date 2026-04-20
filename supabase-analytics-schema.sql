-- ================================================
-- 8. ANALYTICS: POST VIEWS
-- ================================================
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for anonymous/unauthenticated views
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 9. ANALYTICS: STORE NAVIGATIONS
-- ================================================
CREATE TABLE IF NOT EXISTS public.store_navigations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES public.business_details(id) ON DELETE CASCADE,
  navigator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_created_at ON public.post_views(created_at);
CREATE INDEX IF NOT EXISTS idx_store_navs_business_id ON public.store_navigations(business_id);
CREATE INDEX IF NOT EXISTS idx_store_navs_created_at ON public.store_navigations(created_at);

-- RLS for Analytics
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_navigations ENABLE ROW LEVEL SECURITY;

-- Anonymous users (and authenticated) can INSERT views
DROP POLICY IF EXISTS "Anyone can insert views" ON public.post_views;
CREATE POLICY "Anyone can insert views" ON public.post_views FOR INSERT WITH CHECK (true);

-- Traders can SELECT views for their own posts
DROP POLICY IF EXISTS "Traders can view analytics for their posts" ON public.post_views;
CREATE POLICY "Traders can view analytics for their posts" ON public.post_views FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.posts p 
    JOIN public.business_details b ON p.business_id = b.id 
    WHERE p.id = post_views.post_id AND b.profile_id = auth.uid()
  )
);

-- Anyone can insert store navigation event
DROP POLICY IF EXISTS "Anyone can insert navigations" ON public.store_navigations;
CREATE POLICY "Anyone can insert navigations" ON public.store_navigations FOR INSERT WITH CHECK (true);

-- Traders can SELECT navigations to their own business
DROP POLICY IF EXISTS "Traders can view navigations for their business" ON public.store_navigations;
CREATE POLICY "Traders can view navigations for their business" ON public.store_navigations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.business_details b 
    WHERE b.id = store_navigations.business_id AND b.profile_id = auth.uid()
  )
);

-- ================================================
-- RPC FUNCTION: get_trader_metrics
-- Aggregates real-time stats for the dashboard
-- ================================================
CREATE OR REPLACE FUNCTION public.get_trader_metrics(trader_user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bus_id UUID;
  v_total_views INT;
  v_total_engagements INT;
  v_likes INT;
  v_comms INT;
  v_total_navigations INT;
  v_views_last_week INT;
  v_engagement_rate FLOAT;
BEGIN
  -- 1. Get Trader's Business ID
  SELECT id INTO v_bus_id FROM public.business_details WHERE profile_id = trader_user_id LIMIT 1;
  
  IF v_bus_id IS NULL THEN
    RETURN json_build_object('error', 'No business found');
  END IF;

  -- 2. Total views across all posts
  SELECT COUNT(*) INTO v_total_views 
  FROM public.post_views pv
  JOIN public.posts p ON pv.post_id = p.id
  WHERE p.business_id = v_bus_id;

  -- 3. Views in the exact 7 days before (to calculate trend)
  SELECT COUNT(*) INTO v_views_last_week 
  FROM public.post_views pv
  JOIN public.posts p ON pv.post_id = p.id
  WHERE p.business_id = v_bus_id 
  AND pv.created_at < NOW() - INTERVAL '7 days';

  -- 4. Total Engagements (Likes + Comments)
  SELECT COUNT(*) INTO v_likes FROM public.likes l JOIN public.posts p ON l.post_id = p.id WHERE p.business_id = v_bus_id;
  SELECT COUNT(*) INTO v_comms FROM public.comments c JOIN public.posts p ON c.post_id = p.id WHERE p.business_id = v_bus_id;
  v_total_engagements := v_likes + v_comms;

  -- 5. Calculate Engagement Rate (Engagements / Views)
  IF v_total_views > 0 THEN
    v_engagement_rate := (v_total_engagements::FLOAT / v_total_views::FLOAT) * 100;
  ELSE
    v_engagement_rate := 0;
  END IF;

  -- 6. Total Navigations
  SELECT COUNT(*) INTO v_total_navigations 
  FROM public.store_navigations 
  WHERE business_id = v_bus_id;

  RETURN json_build_object(
    'total_views', v_total_views,
    'views_last_week', v_views_last_week,
    'total_engagements', v_total_engagements,
    'engagement_rate', ROUND(v_engagement_rate::numeric, 1),
    'total_navigations', v_total_navigations
  );
END;
$$;
