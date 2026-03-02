
-- PHASE 1: Performance Indexes
CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator_period 
  ON public.creator_earnings(creator_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_agency_status 
  ON public.tasks(agency_id, status);

CREATE INDEX IF NOT EXISTS idx_chatter_shifts_creator_date 
  ON public.chatter_shifts(creator_id, shift_start);

CREATE INDEX IF NOT EXISTS idx_content_plans_creator_status 
  ON public.content_plans(creator_id, status);

CREATE INDEX IF NOT EXISTS idx_active_browser_sessions_bbsid_active 
  ON public.active_browser_sessions(browserbase_session_id, is_active);

CREATE INDEX IF NOT EXISTS idx_creator_session_links_creator_platform 
  ON public.creator_session_links(creator_id, platform);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON public.notifications(user_id, read);

CREATE INDEX IF NOT EXISTS idx_internal_messages_sender 
  ON public.internal_messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_employee_kpis_employee_period 
  ON public.employee_kpis(employee_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_content_files_agency_creator 
  ON public.content_files(agency_id, creator_id);

-- PHASE 1: Scope ai_knowledge_base
ALTER TABLE public.ai_knowledge_base 
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_agency 
  ON public.ai_knowledge_base(agency_id);

DROP POLICY IF EXISTS "Authenticated users can read knowledge base" ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "Agency scoped knowledge base read" ON public.ai_knowledge_base;

CREATE POLICY "Agency scoped knowledge base read" 
  ON public.ai_knowledge_base 
  FOR SELECT 
  TO authenticated
  USING (
    agency_id IS NULL
    OR agency_id = public.get_user_agency_id()
  );

-- PHASE 4: Enable Realtime (only tables not already in publication)
ALTER PUBLICATION supabase_realtime ADD TABLE public.browser_session_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatter_shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_browser_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
