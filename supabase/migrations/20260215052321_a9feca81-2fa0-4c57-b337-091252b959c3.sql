
-- Fix overly permissive RLS policies

-- 1. ai_fan_context: Replace open policies with agency-scoped
DROP POLICY IF EXISTS "Users can view fan context" ON public.ai_fan_context;
DROP POLICY IF EXISTS "Users can manage fan context" ON public.ai_fan_context;

CREATE POLICY "Agency can view own fan context"
ON public.ai_fan_context FOR SELECT
USING (of_account_id IN (
  SELECT csa.of_account_id FROM creator_social_accounts csa
  JOIN creators c ON c.id = csa.creator_id
  WHERE c.agency_id = get_user_agency_id()
));

CREATE POLICY "Agency can manage own fan context"
ON public.ai_fan_context FOR ALL
USING (of_account_id IN (
  SELECT csa.of_account_id FROM creator_social_accounts csa
  JOIN creators c ON c.id = csa.creator_id
  WHERE c.agency_id = get_user_agency_id()
))
WITH CHECK (of_account_id IN (
  SELECT csa.of_account_id FROM creator_social_accounts csa
  JOIN creators c ON c.id = csa.creator_id
  WHERE c.agency_id = get_user_agency_id()
));

-- 2. ai_suggestions_log: Fix open INSERT
DROP POLICY IF EXISTS "Anyone can insert suggestions log" ON public.ai_suggestions_log;
DROP POLICY IF EXISTS "Users can insert suggestions" ON public.ai_suggestions_log;

CREATE POLICY "Agency can insert own suggestions log"
ON public.ai_suggestions_log FOR INSERT
WITH CHECK (
  agency_id = get_user_agency_id()
  OR (creator_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM creators c WHERE c.id = ai_suggestions_log.creator_id AND c.agency_id = get_user_agency_id()
  ))
);

-- 3. of_cache: Scope via of_account_id -> creator_social_accounts -> creators -> agency
DROP POLICY IF EXISTS "Authenticated users can manage of_cache" ON public.of_cache;
DROP POLICY IF EXISTS "Authenticated users can read of_cache" ON public.of_cache;

CREATE POLICY "Agency can manage own OF cache"
ON public.of_cache FOR ALL
USING (of_account_id IN (
  SELECT csa.of_account_id FROM creator_social_accounts csa
  JOIN creators c ON c.id = csa.creator_id
  WHERE c.agency_id = get_user_agency_id()
))
WITH CHECK (of_account_id IN (
  SELECT csa.of_account_id FROM creator_social_accounts csa
  JOIN creators c ON c.id = csa.creator_id
  WHERE c.agency_id = get_user_agency_id()
));

-- 4. browser_session_events: Fix open INSERT
DROP POLICY IF EXISTS "System can insert browser session events" ON public.browser_session_events;

CREATE POLICY "Agency can insert browser session events"
ON public.browser_session_events FOR INSERT
WITH CHECK (agency_id = get_user_agency_id());

-- 5. of_sync_logs: Fix open INSERT
DROP POLICY IF EXISTS "System can insert sync logs" ON public.of_sync_logs;

CREATE POLICY "Agency can insert sync logs"
ON public.of_sync_logs FOR INSERT
WITH CHECK (agency_id = get_user_agency_id());

-- 6. felix_queries: Fix open INSERT  
DROP POLICY IF EXISTS "Users can insert queries" ON public.felix_queries;

CREATE POLICY "Agency can insert own queries"
ON public.felix_queries FOR INSERT
WITH CHECK (agency_id = get_user_agency_id());
