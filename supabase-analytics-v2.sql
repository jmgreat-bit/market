-- ============================================================
-- MarketPLC Merchant Engagement Analytics – Migration V2
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. profile_views
-- ────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.profile_views CASCADE;
DROP TABLE IF EXISTS public.contact_clicks CASCADE;
DROP TABLE IF EXISTS public.search_logs CASCADE;

CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_details(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_business_id
  ON public.profile_views (business_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created_at
  ON public.profile_views (created_at);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can insert profile views"
  ON public.profile_views;
CREATE POLICY "Anyone authenticated can insert profile views"
  ON public.profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Traders can select their own profile views"
  ON public.profile_views;
CREATE POLICY "Traders can select their own profile views"
  ON public.profile_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_details bd
      WHERE bd.id = business_id
        AND bd.profile_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- 2. contact_clicks
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_details(id) ON DELETE CASCADE,
  click_type TEXT NOT NULL CHECK (click_type IN ('whatsapp', 'website')),
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_clicks_business_id
  ON public.contact_clicks (business_id);
CREATE INDEX IF NOT EXISTS idx_contact_clicks_created_at
  ON public.contact_clicks (created_at);

ALTER TABLE public.contact_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can insert contact clicks"
  ON public.contact_clicks;
CREATE POLICY "Anyone authenticated can insert contact clicks"
  ON public.contact_clicks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Traders can select their own contact clicks"
  ON public.contact_clicks;
CREATE POLICY "Traders can select their own contact clicks"
  ON public.contact_clicks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_details bd
      WHERE bd.id = business_id
        AND bd.profile_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- 3. search_logs
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  category_match TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  searcher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_created_at
  ON public.search_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_category_match
  ON public.search_logs (category_match);

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can insert search logs"
  ON public.search_logs;
CREATE POLICY "Anyone authenticated can insert search logs"
  ON public.search_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only service_role can SELECT (no user-facing reads from client).
-- service_role bypasses RLS by default, so no explicit SELECT policy
-- is needed for regular users – they simply have no matching policy.

-- ────────────────────────────────────────────────────────────
-- 4. Trigger function: notify_on_contact_click
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_contact_click()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _owner_id UUID;
  _body TEXT;
BEGIN
  -- Look up the business owner
  SELECT bd.profile_id INTO _owner_id
  FROM public.business_details bd
  WHERE bd.id = NEW.business_id;

  IF _owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build notification body based on click type
  _body := CASE NEW.click_type
    WHEN 'whatsapp' THEN 'Someone tapped your WhatsApp link!'
    WHEN 'website'  THEN 'Someone visited your website!'
    ELSE 'You received a new contact interaction!'
  END;

  INSERT INTO public.alerts (user_id, type, title, body, is_read)
  VALUES (_owner_id, 'system', 'New Lead!', _body, false);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_contact_click
  ON public.contact_clicks;
CREATE TRIGGER trg_notify_on_contact_click
  AFTER INSERT ON public.contact_clicks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_contact_click();

-- ────────────────────────────────────────────────────────────
-- 5. RPC: get_profile_view_summary(trader_user_id UUID)
--    Returns {"today": 12, "yesterday": 8}
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_profile_view_summary(trader_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _business_id UUID;
  _today BIGINT;
  _yesterday BIGINT;
BEGIN
  -- Resolve the trader's business
  SELECT bd.id INTO _business_id
  FROM public.business_details bd
  WHERE bd.profile_id = trader_user_id
  LIMIT 1;

  IF _business_id IS NULL THEN
    RETURN json_build_object('today', 0, 'yesterday', 0);
  END IF;

  SELECT COUNT(*) INTO _today
  FROM public.profile_views pv
  WHERE pv.business_id = _business_id
    AND pv.created_at >= date_trunc('day', NOW());

  SELECT COUNT(*) INTO _yesterday
  FROM public.profile_views pv
  WHERE pv.business_id = _business_id
    AND pv.created_at >= date_trunc('day', NOW()) - INTERVAL '1 day'
    AND pv.created_at <  date_trunc('day', NOW());

  RETURN json_build_object('today', _today, 'yesterday', _yesterday);
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 6. RPC: get_demand_summary(trader_user_id UUID)
--    Returns JSON array of nearby search demand
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_demand_summary(trader_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _category TEXT;
  _lat DOUBLE PRECISION;
  _lng DOUBLE PRECISION;
  _result JSON;
BEGIN
  -- Get the trader's business category and location
  SELECT bd.category, bd.latitude, bd.longitude
  INTO _category, _lat, _lng
  FROM public.business_details bd
  WHERE bd.profile_id = trader_user_id
  LIMIT 1;

  IF _category IS NULL THEN
    RETURN '[]'::JSON;
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON)
  INTO _result
  FROM (
    SELECT
      sl.query AS keyword,
      COUNT(*)::INT AS count
    FROM public.search_logs sl
    WHERE sl.created_at >= NOW() - INTERVAL '12 hours'
      AND (
        sl.category_match = _category
        OR sl.query ILIKE '%' || _category || '%'
      )
      -- Haversine proximity filter: within 5 km
      AND (
        _lat IS NULL OR _lng IS NULL
        OR sl.latitude IS NULL OR sl.longitude IS NULL
        OR (
          6371 * acos(
            LEAST(1.0,
              cos(radians(_lat)) * cos(radians(sl.latitude))
              * cos(radians(sl.longitude) - radians(_lng))
              + sin(radians(_lat)) * sin(radians(sl.latitude))
            )
          ) <= 5
        )
      )
    GROUP BY sl.query
    HAVING COUNT(*) >= 3
    ORDER BY count DESC
  ) t;

  RETURN _result;
END;
$$;
