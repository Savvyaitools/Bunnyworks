
-- ============================================================
-- Fix 1: creator_voice_profiles - add proper agency_id check
-- ============================================================
DROP POLICY IF EXISTS "Users can manage voice profiles for their agency creators" ON public.creator_voice_profiles;
CREATE POLICY "Users can manage voice profiles for their agency creators"
  ON public.creator_voice_profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM creators c
    WHERE c.id = creator_voice_profiles.creator_id
      AND c.agency_id = get_user_agency_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM creators c
    WHERE c.id = creator_voice_profiles.creator_id
      AND c.agency_id = get_user_agency_id()
  ));

DROP POLICY IF EXISTS "Users can view voice profiles for their agency creators" ON public.creator_voice_profiles;
CREATE POLICY "Users can view voice profiles for their agency creators"
  ON public.creator_voice_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM creators c
    WHERE c.id = creator_voice_profiles.creator_id
      AND c.agency_id = get_user_agency_id()
  ));

-- ============================================================
-- Fix 2: ai_performance_alerts - replace indirect check
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their agency alerts" ON public.ai_performance_alerts;
CREATE POLICY "Users can manage their agency alerts"
  ON public.ai_performance_alerts FOR ALL
  USING (agency_id = get_user_agency_id())
  WITH CHECK (agency_id = get_user_agency_id());

DROP POLICY IF EXISTS "Users can view their agency alerts" ON public.ai_performance_alerts;
CREATE POLICY "Users can view their agency alerts"
  ON public.ai_performance_alerts FOR SELECT
  USING (agency_id = get_user_agency_id());

-- ============================================================
-- Fix 3: ai_suggestions_log - replace indirect SELECT check
-- ============================================================
DROP POLICY IF EXISTS "Users can view their agency suggestions" ON public.ai_suggestions_log;
CREATE POLICY "Users can view their agency suggestions"
  ON public.ai_suggestions_log FOR SELECT
  USING (agency_id = get_user_agency_id());

-- ============================================================
-- Fix 4: felix_briefings - replace indirect checks
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their agency briefings" ON public.felix_briefings;
CREATE POLICY "Users can manage their agency briefings"
  ON public.felix_briefings FOR ALL
  USING (agency_id = get_user_agency_id())
  WITH CHECK (agency_id = get_user_agency_id());

DROP POLICY IF EXISTS "Users can view their agency briefings" ON public.felix_briefings;
CREATE POLICY "Users can view their agency briefings"
  ON public.felix_briefings FOR SELECT
  USING (agency_id = get_user_agency_id());

-- ============================================================
-- Fix 5: felix_queries - replace indirect SELECT check
-- ============================================================
DROP POLICY IF EXISTS "Users can view their agency queries" ON public.felix_queries;
CREATE POLICY "Users can view their agency queries"
  ON public.felix_queries FOR SELECT
  USING (agency_id = get_user_agency_id());
