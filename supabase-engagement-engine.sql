-- ================================================================
-- MarketPLC — Engagement Engine
-- "Make Silence Expensive, Make Activity Rewarding"
-- Run this in Supabase SQL Editor
-- ================================================================

-- ================================================================
-- 0. PREREQUISITES — Extend contact_clicks to support 'phone' type
-- ================================================================
ALTER TABLE public.contact_clicks 
  DROP CONSTRAINT IF EXISTS contact_clicks_click_type_check;
ALTER TABLE public.contact_clicks 
  ADD CONSTRAINT contact_clicks_click_type_check 
  CHECK (click_type IN ('whatsapp', 'website', 'phone'));

-- ================================================================
-- 1. REAL-TIME TRIGGERS — Instant notifications on user actions
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1a. CONTACT CLICK NOTIFICATION (Replace existing basic one)
--     "A customer just tapped your WhatsApp / called your number!"
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_contact_click()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _owner_id UUID;
  _biz_name TEXT;
  _clicker_name TEXT;
  _title TEXT;
  _body TEXT;
BEGIN
  -- Look up the business owner and business name
  SELECT bd.profile_id, bd.business_name 
  INTO _owner_id, _biz_name
  FROM public.business_details bd
  WHERE bd.id = NEW.business_id;

  IF _owner_id IS NULL THEN RETURN NEW; END IF;

  -- Don't notify if the trader clicked their own contact info
  IF NEW.viewer_id IS NOT NULL AND NEW.viewer_id = _owner_id THEN RETURN NEW; END IF;

  -- Get the clicker's name if available
  IF NEW.viewer_id IS NOT NULL THEN
    SELECT COALESCE(full_name, username, 'Someone') INTO _clicker_name
    FROM public.profiles WHERE id = NEW.viewer_id LIMIT 1;
  ELSE
    _clicker_name := 'A potential customer';
  END IF;

  -- Build message based on click type
  _title := CASE NEW.click_type
    WHEN 'whatsapp' THEN _clicker_name || ' tapped your WhatsApp 📱'
    WHEN 'phone'    THEN _clicker_name || ' called your number 📞'
    WHEN 'website'  THEN _clicker_name || ' visited your website 🌐'
    ELSE _clicker_name || ' interacted with your contact info'
  END;

  _body := 'High-intent lead! They took action to reach you directly.';

  INSERT INTO public.alerts (user_id, type, title, body, from_user_id)
  VALUES (_owner_id, 'contact_click', _title, _body, NEW.viewer_id);

  RETURN NEW;
END;
$$;

-- Recreate trigger (safe to re-run)
DROP TRIGGER IF EXISTS trg_notify_on_contact_click ON public.contact_clicks;
CREATE TRIGGER trg_notify_on_contact_click
  AFTER INSERT ON public.contact_clicks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_contact_click();

-- ────────────────────────────────────────────────────────────────
-- 1b. PROFILE VIEW NOTIFICATION
--     "Someone viewed your shop page"
--     (Batched: only fires once per viewer per 24h to avoid spam)
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_profile_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _owner_id UUID;
  _viewer_name TEXT;
  _recent_alert_exists BOOLEAN;
BEGIN
  -- Look up the business owner
  SELECT bd.profile_id INTO _owner_id
  FROM public.business_details bd
  WHERE bd.id = NEW.business_id;

  IF _owner_id IS NULL THEN RETURN NEW; END IF;

  -- Don't notify for own views
  IF NEW.viewer_id IS NOT NULL AND NEW.viewer_id = _owner_id THEN RETURN NEW; END IF;

  -- Deduplicate: don't send if same viewer triggered an alert in last 24h
  IF NEW.viewer_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.alerts
      WHERE user_id = _owner_id
        AND type = 'profile_view'
        AND from_user_id = NEW.viewer_id
        AND created_at > NOW() - INTERVAL '24 hours'
    ) INTO _recent_alert_exists;
    
    IF _recent_alert_exists THEN RETURN NEW; END IF;
  END IF;

  -- Get viewer name
  IF NEW.viewer_id IS NOT NULL THEN
    SELECT COALESCE(full_name, username, 'Someone') INTO _viewer_name
    FROM public.profiles WHERE id = NEW.viewer_id LIMIT 1;
  ELSE
    _viewer_name := 'Someone';
  END IF;

  INSERT INTO public.alerts (user_id, type, title, body, from_user_id)
  VALUES (
    _owner_id, 
    'profile_view', 
    _viewer_name || ' viewed your shop 👀',
    'Your business is getting attention. Keep posting to convert views into customers!',
    NEW.viewer_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_profile_view ON public.profile_views;
CREATE TRIGGER trg_notify_on_profile_view
  AFTER INSERT ON public.profile_views
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_profile_view();

-- ────────────────────────────────────────────────────────────────
-- 1c. BOOKMARK NOTIFICATION
--     "A customer saved your post for later"
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_bookmark()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _post_owner_id UUID;
  _bookmarker_name TEXT;
  _post_preview TEXT;
BEGIN
  -- Find who owns the post
  SELECT p.id, bd.business_name
  INTO _post_owner_id
  FROM public.posts po
  JOIN public.business_details bd ON bd.id = po.business_id
  JOIN public.profiles p ON p.id = bd.profile_id
  WHERE po.id = NEW.post_id
  LIMIT 1;

  IF _post_owner_id IS NULL OR _post_owner_id = NEW.user_id THEN 
    RETURN NEW; 
  END IF;

  -- Get bookmarker name
  SELECT COALESCE(full_name, username, 'Someone') INTO _bookmarker_name
  FROM public.profiles WHERE id = NEW.user_id LIMIT 1;

  -- Get post preview
  SELECT LEFT(content, 60) INTO _post_preview
  FROM public.posts WHERE id = NEW.post_id LIMIT 1;

  INSERT INTO public.alerts (user_id, type, title, body, related_post_id, from_user_id)
  VALUES (
    _post_owner_id,
    'bookmark',
    _bookmarker_name || ' saved your post 🔖',
    COALESCE(_post_preview || '...', 'Your post was saved for later'),
    NEW.post_id,
    NEW.user_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_bookmark ON public.bookmarks;
CREATE TRIGGER trg_notify_on_bookmark
  AFTER INSERT ON public.bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_bookmark();

-- ────────────────────────────────────────────────────────────────
-- 1d. STORE NAVIGATION NOTIFICATION
--     "A customer is heading to your location right now!"
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_store_navigation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _owner_id UUID;
  _navigator_name TEXT;
BEGIN
  -- Look up the business owner
  SELECT bd.profile_id INTO _owner_id
  FROM public.business_details bd
  WHERE bd.id = NEW.business_id;

  IF _owner_id IS NULL THEN RETURN NEW; END IF;

  -- Don't notify for own navigations
  IF NEW.user_id IS NOT NULL AND NEW.user_id = _owner_id THEN RETURN NEW; END IF;

  -- Get navigator name
  IF NEW.user_id IS NOT NULL THEN
    SELECT COALESCE(full_name, username, 'Someone') INTO _navigator_name
    FROM public.profiles WHERE id = NEW.user_id LIMIT 1;
  ELSE
    _navigator_name := 'A customer';
  END IF;

  INSERT INTO public.alerts (user_id, type, title, body, from_user_id)
  VALUES (
    _owner_id,
    'navigation',
    _navigator_name || ' is heading to your shop 🗺️',
    'Someone just clicked Navigate to find your location. They are on their way!',
    NEW.user_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_store_navigation ON public.store_navigations;
CREATE TRIGGER trg_notify_on_store_navigation
  AFTER INSERT ON public.store_navigations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_store_navigation();

-- ────────────────────────────────────────────────────────────────
-- 1e. NEW FOLLOWER NOTIFICATION
--     "You have a new follower!"
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _trader_user_id UUID;
  _follower_name TEXT;
  _follower_count INT;
BEGIN
  -- The post_subscriptions table links user_id (follower) to post_id
  -- But trader_subscriptions would link to business. Let's handle post_subscriptions.
  -- For post subscriptions, notify the post owner
  SELECT p.id INTO _trader_user_id
  FROM public.posts po
  JOIN public.business_details bd ON bd.id = po.business_id
  JOIN public.profiles p ON p.id = bd.profile_id
  WHERE po.id = NEW.post_id
  LIMIT 1;

  IF _trader_user_id IS NULL OR _trader_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, username, 'Someone') INTO _follower_name
  FROM public.profiles WHERE id = NEW.user_id LIMIT 1;

  INSERT INTO public.alerts (user_id, type, title, body, from_user_id)
  VALUES (
    _trader_user_id,
    'follow',
    _follower_name || ' subscribed to your updates 🔔',
    'You have a new subscriber! They will see your future posts.',
    NEW.user_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_new_follower ON public.post_subscriptions;
CREATE TRIGGER trg_notify_on_new_follower
  AFTER INSERT ON public.post_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_follower();

-- ────────────────────────────────────────────────────────────────
-- 1f. SEARCH MATCH NOTIFICATION
--     "Someone searched for 'Perfume' and your shop appeared"
--     Batched: max 1 alert per trader per search term per hour
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_search_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _trader RECORD;
  _already_notified BOOLEAN;
BEGIN
  -- Find all traders whose category or business name matches this search
  FOR _trader IN
    SELECT bd.profile_id, bd.business_name
    FROM public.business_details bd
    WHERE (
      NEW.query ILIKE '%' || bd.category || '%'
      OR NEW.query ILIKE '%' || bd.business_name || '%'
      OR bd.category ILIKE '%' || NEW.query || '%'
      OR bd.business_name ILIKE '%' || NEW.query || '%'
    )
    -- Don't notify the searcher if they are also a trader
    AND (NEW.searcher_id IS NULL OR bd.profile_id != NEW.searcher_id)
  LOOP
    -- Deduplicate: max 1 alert per trader per search term per hour
    SELECT EXISTS(
      SELECT 1 FROM public.alerts
      WHERE user_id = _trader.profile_id
        AND type = 'search_match'
        AND title ILIKE '%' || LEFT(NEW.query, 30) || '%'
        AND created_at > NOW() - INTERVAL '1 hour'
    ) INTO _already_notified;

    IF NOT _already_notified THEN
      INSERT INTO public.alerts (user_id, type, title, body)
      VALUES (
        _trader.profile_id,
        'search_match',
        'Someone searched for "' || LEFT(NEW.query, 40) || '" 🔍',
        'Your shop appeared in the results. Customers are actively looking for what you offer!'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_search_match ON public.search_logs;
CREATE TRIGGER trg_notify_on_search_match
  AFTER INSERT ON public.search_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_search_match();

-- ================================================================
-- 2. SCHEDULED JOBS — Daily/Weekly intelligence reports
--    Uses pg_cron (must be enabled in Supabase Extensions)
-- ================================================================

-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ────────────────────────────────────────────────────────────────
-- 2a. INACTIVITY NUDGE (Daily at 9 AM UTC)
--     "You haven't posted in 3 days. 5 shops in your category 
--      posted today. Don't let them steal your customers!"
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.engagement_inactivity_nudge()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _trader RECORD;
  _days_since_post INT;
  _competitors_posted INT;
  _last_post_id UUID;
  _body TEXT;
BEGIN
  -- Loop through all traders
  FOR _trader IN
    SELECT 
      p.id AS user_id,
      bd.id AS business_id,
      bd.business_name,
      bd.category,
      bd.latitude,
      bd.longitude
    FROM public.profiles p
    JOIN public.business_details bd ON bd.profile_id = p.id
    WHERE p.role = 'trader'
  LOOP
    -- How many days since their last post?
    SELECT EXTRACT(DAY FROM NOW() - MAX(po.created_at))::INT
    INTO _days_since_post
    FROM public.posts po
    WHERE po.business_id = _trader.business_id;

    -- If NULL (never posted), set to 999
    _days_since_post := COALESCE(_days_since_post, 999);

    -- Only nudge if inactive 3+ days
    IF _days_since_post >= 3 THEN
      -- Count competitors who posted today (same category, within 5km)
      SELECT COUNT(DISTINCT bd2.id) INTO _competitors_posted
      FROM public.posts po2
      JOIN public.business_details bd2 ON bd2.id = po2.business_id
      WHERE bd2.category = _trader.category
        AND bd2.id != _trader.business_id
        AND po2.created_at >= date_trunc('day', NOW())
        AND (
          _trader.latitude IS NULL OR _trader.longitude IS NULL
          OR bd2.latitude IS NULL OR bd2.longitude IS NULL
          OR (
            6371 * acos(
              LEAST(1.0,
                cos(radians(_trader.latitude)) * cos(radians(bd2.latitude))
                * cos(radians(bd2.longitude) - radians(_trader.longitude))
                + sin(radians(_trader.latitude)) * sin(radians(bd2.latitude))
              )
            ) <= 5
          )
        );

      -- Don't send duplicate nudges on the same day
      IF NOT EXISTS(
        SELECT 1 FROM public.alerts
        WHERE user_id = _trader.user_id
          AND type = 'inactivity'
          AND created_at >= date_trunc('day', NOW())
      ) THEN
        -- Get their most liked post for repost suggestion
        SELECT po.id INTO _last_post_id
        FROM public.posts po
        WHERE po.business_id = _trader.business_id
        ORDER BY po.likes_count DESC NULLS LAST, po.created_at DESC
        LIMIT 1;

        -- Build the message
        IF _days_since_post >= 999 THEN
          _body := 'You haven''t created your first post yet! ';
        ELSE
          _body := 'You haven''t posted in ' || _days_since_post || ' days. ';
        END IF;

        IF _competitors_posted > 0 THEN
          _body := _body || _competitors_posted || ' ' || _trader.category || ' shops near you posted today. Don''t let them steal your customers!';
        ELSE
          _body := _body || 'Post something now to stay visible to nearby customers!';
        END IF;

        -- Insert the inactivity alert
        INSERT INTO public.alerts (user_id, type, title, body, related_post_id)
        VALUES (
          _trader.user_id,
          'inactivity',
          CASE 
            WHEN _days_since_post >= 999 THEN 'Time to make your first post! 📝'
            ELSE 'Your shop has been quiet for ' || _days_since_post || ' days ⏰'
          END,
          _body,
          _last_post_id  -- Attached for repost suggestion
        );

        -- Also send a repost suggestion if they have a popular post
        IF _last_post_id IS NOT NULL AND _days_since_post >= 5 THEN
          INSERT INTO public.alerts (user_id, type, title, body, related_post_id)
          VALUES (
            _trader.user_id,
            'repost_suggestion',
            'Quick win: Repost your top post with one tap 🔄',
            'Your most popular post could bring back customers. Tap below to repost it instantly!',
            _last_post_id
          );
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- 2b. COMPETITIVE PRESSURE (Daily at 2 PM UTC)
--     "5 nearby perfume shops posted today. You haven't posted."
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.engagement_competitive_pressure()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _trader RECORD;
  _competitors_posted INT;
  _trader_posted_today BOOLEAN;
BEGIN
  FOR _trader IN
    SELECT 
      p.id AS user_id,
      bd.id AS business_id,
      bd.business_name,
      bd.category,
      bd.latitude,
      bd.longitude
    FROM public.profiles p
    JOIN public.business_details bd ON bd.profile_id = p.id
    WHERE p.role = 'trader'
  LOOP
    -- Did THIS trader post today?
    SELECT EXISTS(
      SELECT 1 FROM public.posts po
      WHERE po.business_id = _trader.business_id
        AND po.created_at >= date_trunc('day', NOW())
    ) INTO _trader_posted_today;

    -- If they already posted today, skip them
    IF _trader_posted_today THEN CONTINUE; END IF;

    -- Count competitors who posted today
    SELECT COUNT(DISTINCT bd2.id) INTO _competitors_posted
    FROM public.posts po2
    JOIN public.business_details bd2 ON bd2.id = po2.business_id
    WHERE bd2.category = _trader.category
      AND bd2.id != _trader.business_id
      AND po2.created_at >= date_trunc('day', NOW())
      AND (
        _trader.latitude IS NULL OR _trader.longitude IS NULL
        OR bd2.latitude IS NULL OR bd2.longitude IS NULL
        OR (
          6371 * acos(
            LEAST(1.0,
              cos(radians(_trader.latitude)) * cos(radians(bd2.latitude))
              * cos(radians(bd2.longitude) - radians(_trader.longitude))
              + sin(radians(_trader.latitude)) * sin(radians(bd2.latitude))
            )
          ) <= 5
        )
      );

    -- Only send if at least 2 competitors posted
    IF _competitors_posted >= 2 THEN
      -- Don't duplicate
      IF NOT EXISTS(
        SELECT 1 FROM public.alerts
        WHERE user_id = _trader.user_id
          AND type = 'competitive'
          AND created_at >= date_trunc('day', NOW())
      ) THEN
        INSERT INTO public.alerts (user_id, type, title, body)
        VALUES (
          _trader.user_id,
          'competitive',
          _competitors_posted || ' ' || _trader.category || ' shops near you posted today 🏆',
          'Your competitors are getting attention from customers right now. Post something to stay in the game!'
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- 2c. WEEKLY SEARCH DEMAND REPORT (Every Monday at 10 AM UTC)
--     "Last week, 28 people searched for products in your
--      category within 1km of your shop"
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.engagement_weekly_demand_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _trader RECORD;
  _search_count INT;
  _top_queries TEXT;
BEGIN
  FOR _trader IN
    SELECT 
      p.id AS user_id,
      bd.id AS business_id,
      bd.business_name,
      bd.category,
      bd.latitude,
      bd.longitude
    FROM public.profiles p
    JOIN public.business_details bd ON bd.profile_id = p.id
    WHERE p.role = 'trader'
  LOOP
    -- Count relevant searches this week
    SELECT COUNT(*) INTO _search_count
    FROM public.search_logs sl
    WHERE sl.created_at >= NOW() - INTERVAL '7 days'
      AND (
        sl.category_match = _trader.category
        OR sl.query ILIKE '%' || _trader.category || '%'
        OR sl.query ILIKE '%' || _trader.business_name || '%'
      )
      AND (
        _trader.latitude IS NULL OR _trader.longitude IS NULL
        OR sl.latitude IS NULL OR sl.longitude IS NULL
        OR (
          6371 * acos(
            LEAST(1.0,
              cos(radians(_trader.latitude)) * cos(radians(sl.latitude))
              * cos(radians(sl.longitude) - radians(_trader.longitude))
              + sin(radians(_trader.latitude)) * sin(radians(sl.latitude))
            )
          ) <= 5
        )
      );

    -- Only send if there was at least 1 search
    IF _search_count > 0 THEN
      -- Get top 3 search terms
      SELECT string_agg(keyword, ', ') INTO _top_queries
      FROM (
        SELECT sl.query AS keyword, COUNT(*) AS cnt
        FROM public.search_logs sl
        WHERE sl.created_at >= NOW() - INTERVAL '7 days'
          AND (
            sl.category_match = _trader.category
            OR sl.query ILIKE '%' || _trader.category || '%'
          )
        GROUP BY sl.query
        ORDER BY cnt DESC
        LIMIT 3
      ) sub;

      INSERT INTO public.alerts (user_id, type, title, body)
      VALUES (
        _trader.user_id,
        'demand_signal',
        _search_count || ' people searched for your category this week 📊',
        'People near you searched for: ' || COALESCE(_top_queries, _trader.category) || '. This is real demand — post to capture it!'
      );
    END IF;
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- 2d. CLIENT ENGAGEMENT — FOLLOWED TRADER POSTS
--     When a trader posts, notify all their subscribers
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_subscribers_on_new_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _biz_name TEXT;
  _post_preview TEXT;
  _subscriber RECORD;
BEGIN
  -- Get business name
  SELECT bd.business_name INTO _biz_name
  FROM public.business_details bd
  WHERE bd.id = NEW.business_id;

  -- Get post preview
  _post_preview := LEFT(NEW.content, 80);

  -- Find all subscribers of this trader's previous posts
  FOR _subscriber IN
    SELECT DISTINCT ps.user_id
    FROM public.post_subscriptions ps
    JOIN public.posts po ON po.id = ps.post_id
    WHERE po.business_id = NEW.business_id
      AND ps.user_id != (
        SELECT bd.profile_id FROM public.business_details bd WHERE bd.id = NEW.business_id
      )
  LOOP
    INSERT INTO public.alerts (user_id, type, title, body, related_post_id)
    VALUES (
      _subscriber.user_id,
      'followed_post',
      COALESCE(_biz_name, 'A shop you follow') || ' just posted 📢',
      COALESCE(_post_preview || '...', 'Check out their latest update!'),
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_subscribers_on_new_post ON public.posts;
CREATE TRIGGER trg_notify_subscribers_on_new_post
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_subscribers_on_new_post();

-- ================================================================
-- 3. SCHEDULE THE CRON JOBS
-- ================================================================

-- Remove existing jobs if re-running
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN (
  'engagement_inactivity_nudge',
  'engagement_competitive_pressure',
  'engagement_weekly_demand_report'
);

-- Daily at 9 AM UTC (11 AM Rwanda time): Inactivity nudge
SELECT cron.schedule(
  'engagement_inactivity_nudge',
  '0 9 * * *',
  $$SELECT public.engagement_inactivity_nudge()$$
);

-- Daily at 2 PM UTC (4 PM Rwanda time): Competitive pressure
SELECT cron.schedule(
  'engagement_competitive_pressure',
  '0 14 * * *',
  $$SELECT public.engagement_competitive_pressure()$$
);

-- Every Monday at 10 AM UTC (12 PM Rwanda time): Weekly demand report
SELECT cron.schedule(
  'engagement_weekly_demand_report',
  '0 10 * * 1',
  $$SELECT public.engagement_weekly_demand_report()$$
);

-- ================================================================
-- 4. VERIFICATION — Check everything is set up
-- ================================================================
-- Run this to verify:
-- SELECT * FROM cron.job;
-- SELECT * FROM public.alerts ORDER BY created_at DESC LIMIT 10;
