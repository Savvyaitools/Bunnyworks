
-- ============================================================
-- 1. Remove redundant SELECT policies already covered by ALL
-- ============================================================

-- ai_performance_alerts: ALL already covers SELECT with same condition
DROP POLICY IF EXISTS "Users can view their agency alerts" ON public.ai_performance_alerts;

-- ai_fan_context: ALL already covers SELECT with same condition
DROP POLICY IF EXISTS "Agency can view own fan context" ON public.ai_fan_context;

-- felix_briefings: ALL already covers SELECT with same condition
DROP POLICY IF EXISTS "Users can view their agency briefings" ON public.felix_briefings;

-- creator_voice_profiles: ALL already covers SELECT with same condition
DROP POLICY IF EXISTS "Users can view voice profiles for their agency creators" ON public.creator_voice_profiles;

-- ============================================================
-- 2. Fix of_chats: indirect agency check → direct
-- ============================================================
DROP POLICY IF EXISTS "Users can manage of_chats for their agency" ON public.of_chats;
DROP POLICY IF EXISTS "Users can view of_chats for their agency" ON public.of_chats;

CREATE POLICY "Agency can manage own of_chats"
  ON public.of_chats FOR ALL
  USING (agency_id = get_user_agency_id())
  WITH CHECK (agency_id = get_user_agency_id());

-- ============================================================
-- 3. Fix of_fans: indirect agency check → direct
-- ============================================================
DROP POLICY IF EXISTS "Users can manage of_fans for their agency" ON public.of_fans;
DROP POLICY IF EXISTS "Users can view of_fans for their agency" ON public.of_fans;

CREATE POLICY "Agency can manage own of_fans"
  ON public.of_fans FOR ALL
  USING (agency_id = get_user_agency_id())
  WITH CHECK (agency_id = get_user_agency_id());

-- ============================================================
-- 4. Remove duplicate chatter_shifts SELECT policies (identical)
-- ============================================================
DROP POLICY IF EXISTS "Employees can view own chatter shifts" ON public.chatter_shifts;
-- Keep "Chatters can view own shifts" which has the same condition

-- ============================================================
-- 5. Remove duplicate chatter_time_logs policies (identical)
-- ============================================================
DROP POLICY IF EXISTS "Employees can view own chatter time logs" ON public.chatter_time_logs;
-- Keep "Chatters can view own time logs" which has the same condition

DROP POLICY IF EXISTS "Employees can clock in/out" ON public.chatter_time_logs;
-- Keep "Chatters can clock in/out" which has the same condition

DROP POLICY IF EXISTS "Employees can update own time logs" ON public.chatter_time_logs;
-- Keep "Chatters can update own time logs" which has the same condition
