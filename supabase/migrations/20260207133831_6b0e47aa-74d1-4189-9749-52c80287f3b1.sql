
-- Fix 1: Update creator isolation policies to use auth_user_id instead of email matching

-- Tasks
DROP POLICY IF EXISTS "Creators can view their own tasks" ON public.tasks;
CREATE POLICY "Creators can view their own tasks"
  ON public.tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM creators c WHERE c.id = tasks.creator_id AND c.auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Creators can update their own tasks" ON public.tasks;
CREATE POLICY "Creators can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM creators c WHERE c.id = tasks.creator_id AND c.auth_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM creators c WHERE c.id = tasks.creator_id AND c.auth_user_id = auth.uid()));

-- Invoices
DROP POLICY IF EXISTS "Creators can view their own invoices" ON public.invoices;
CREATE POLICY "Creators can view their own invoices"
  ON public.invoices FOR SELECT
  USING (EXISTS (SELECT 1 FROM creators c WHERE c.id = invoices.creator_id AND c.auth_user_id = auth.uid()));

-- Custom Requests
DROP POLICY IF EXISTS "Creators can view their own custom requests" ON public.custom_requests;
CREATE POLICY "Creators can view their own custom requests"
  ON public.custom_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM creators c WHERE c.id = custom_requests.creator_id AND c.auth_user_id = auth.uid()));

-- Content Plans
DROP POLICY IF EXISTS "Creators can view their own content plans" ON public.content_plans;
CREATE POLICY "Creators can view their own content plans"
  ON public.content_plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM creators c WHERE c.id = content_plans.creator_id AND c.auth_user_id = auth.uid()));

-- Creator Earnings - drop existing and recreate
DROP POLICY IF EXISTS "Creators can view their own earnings" ON public.creator_earnings;
CREATE POLICY "Creators can view their own earnings"
  ON public.creator_earnings FOR SELECT
  USING (EXISTS (SELECT 1 FROM creators c WHERE c.id = creator_earnings.creator_id AND c.auth_user_id = auth.uid()));

-- Messages
DROP POLICY IF EXISTS "Creators can view their messages" ON public.messages;
CREATE POLICY "Creators can view their messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM creators c WHERE c.auth_user_id = auth.uid())
    AND conversation_id = concat('creator-', (SELECT c.id FROM creators c WHERE c.auth_user_id = auth.uid() LIMIT 1))
  );

DROP POLICY IF EXISTS "Creators can send messages" ON public.messages;
CREATE POLICY "Creators can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_type = 'creator' AND EXISTS (SELECT 1 FROM creators c WHERE c.auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Creators can update their messages" ON public.messages;
CREATE POLICY "Creators can update their messages"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM creators c WHERE c.auth_user_id = auth.uid())
    AND conversation_id = concat('creator-', (SELECT c.id FROM creators c WHERE c.auth_user_id = auth.uid() LIMIT 1))
  );

-- Fix 2: Restrict recruiting_creators to agency owners and managers only
DROP POLICY IF EXISTS "Agency can manage own recruiting creators" ON public.recruiting_creators;
CREATE POLICY "Agency owners and managers can manage recruiting creators"
  ON public.recruiting_creators FOR ALL
  USING (
    agency_id = get_user_agency_id()
    AND (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.user_type = 'agency')
      OR EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.agency_id = recruiting_creators.agency_id AND e.role IN ('Manager', 'Marketing'))
    )
  )
  WITH CHECK (
    agency_id = get_user_agency_id()
    AND (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.user_type = 'agency')
      OR EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.agency_id = recruiting_creators.agency_id AND e.role IN ('Manager', 'Marketing'))
    )
  );
