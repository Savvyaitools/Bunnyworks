-- ============================================
-- FIX: Add agency_id filtering to all RLS policies
-- This ensures proper multi-tenant data isolation
-- ============================================

-- 1. CREATORS TABLE - Add agency_id filtering
DROP POLICY IF EXISTS "Agency can manage creators" ON public.creators;
DROP POLICY IF EXISTS "Agency can view all creators" ON public.creators;

CREATE POLICY "Agency can manage own creators" 
ON public.creators 
FOR ALL 
TO authenticated
USING (
  agency_id = get_user_agency_id()
)
WITH CHECK (
  agency_id = get_user_agency_id()
);

-- 2. EMPLOYEES TABLE - Add agency_id filtering
DROP POLICY IF EXISTS "Agency can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Agency can view employees" ON public.employees;

CREATE POLICY "Agency can manage own employees" 
ON public.employees 
FOR ALL 
TO authenticated
USING (
  agency_id = get_user_agency_id()
)
WITH CHECK (
  agency_id = get_user_agency_id()
);

-- 3. CHATTERS TABLE - Add agency_id filtering  
DROP POLICY IF EXISTS "Agency can manage chatters" ON public.chatters;
DROP POLICY IF EXISTS "Agency can view all chatters" ON public.chatters;

CREATE POLICY "Agency can manage own chatters" 
ON public.chatters 
FOR ALL 
TO authenticated
USING (
  agency_id = get_user_agency_id()
)
WITH CHECK (
  agency_id = get_user_agency_id()
);

-- 4. TASKS TABLE - Add agency_id filtering
DROP POLICY IF EXISTS "Agency can manage tasks" ON public.tasks;
DROP POLICY IF EXISTS "Agency can view all tasks" ON public.tasks;

CREATE POLICY "Agency can manage own tasks" 
ON public.tasks 
FOR ALL 
TO authenticated
USING (
  agency_id = get_user_agency_id()
)
WITH CHECK (
  agency_id = get_user_agency_id()
);

-- 5. INVOICES TABLE - Add agency_id filtering
DROP POLICY IF EXISTS "Agency can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Agency can view invoices" ON public.invoices;

CREATE POLICY "Agency can manage own invoices" 
ON public.invoices 
FOR ALL 
TO authenticated
USING (
  agency_id = get_user_agency_id()
)
WITH CHECK (
  agency_id = get_user_agency_id()
);

-- 6. CONTENT_FILES TABLE - Add agency_id filtering
DROP POLICY IF EXISTS "Authenticated can view content files" ON public.content_files;
DROP POLICY IF EXISTS "Authenticated can upload content files" ON public.content_files;
DROP POLICY IF EXISTS "Authenticated can delete content files" ON public.content_files;

CREATE POLICY "Agency can manage own content files" 
ON public.content_files 
FOR ALL 
TO authenticated
USING (
  agency_id = get_user_agency_id()
)
WITH CHECK (
  agency_id = get_user_agency_id()
);

-- 7. CONTENT_FOLDERS TABLE - Add agency_id filtering
DROP POLICY IF EXISTS "Agency can manage content folders" ON public.content_folders;
DROP POLICY IF EXISTS "Agency can view content folders" ON public.content_folders;

CREATE POLICY "Agency can manage own content folders" 
ON public.content_folders 
FOR ALL 
TO authenticated
USING (
  agency_id = get_user_agency_id()
)
WITH CHECK (
  agency_id = get_user_agency_id()
);

-- 8. CONTENT_PLANS TABLE - Add agency_id filtering
DROP POLICY IF EXISTS "Agency can manage content plans" ON public.content_plans;
DROP POLICY IF EXISTS "Agency can view content plans" ON public.content_plans;

CREATE POLICY "Agency can manage own content plans" 
ON public.content_plans 
FOR ALL 
TO authenticated
USING (
  agency_id = get_user_agency_id()
)
WITH CHECK (
  agency_id = get_user_agency_id()
);

-- 9. CALENDAR_EVENTS TABLE - Add agency_id filtering
DROP POLICY IF EXISTS "Agency users can manage calendar events" ON public.calendar_events;

CREATE POLICY "Agency can manage own calendar events" 
ON public.calendar_events 
FOR ALL 
TO authenticated
USING (
  agency_id = get_user_agency_id()
)
WITH CHECK (
  agency_id = get_user_agency_id()
);

-- 10. RECRUITING_CREATORS TABLE - Add agency_id filtering
DROP POLICY IF EXISTS "Agency can manage recruiting creators" ON public.recruiting_creators;
DROP POLICY IF EXISTS "Agency can view recruiting creators" ON public.recruiting_creators;

CREATE POLICY "Agency can manage own recruiting creators" 
ON public.recruiting_creators 
FOR ALL 
TO authenticated
USING (
  agency_id = get_user_agency_id()
)
WITH CHECK (
  agency_id = get_user_agency_id()
);

-- 11. SOP_DOCUMENTS TABLE - Add agency_id filtering
DROP POLICY IF EXISTS "Agency can manage SOPs" ON public.sop_documents;
DROP POLICY IF EXISTS "Agency can view SOPs" ON public.sop_documents;

CREATE POLICY "Agency can manage own SOPs" 
ON public.sop_documents 
FOR ALL 
TO authenticated
USING (
  agency_id = get_user_agency_id()
)
WITH CHECK (
  agency_id = get_user_agency_id()
);

-- 12. GOALS TABLE - Add agency_id filtering
DROP POLICY IF EXISTS "Agency can manage goals" ON public.goals;
DROP POLICY IF EXISTS "Agency can view goals" ON public.goals;

CREATE POLICY "Agency can manage own goals" 
ON public.goals 
FOR ALL 
TO authenticated
USING (
  agency_id = get_user_agency_id()
)
WITH CHECK (
  agency_id = get_user_agency_id()
);

-- 13. NOTIFICATIONS TABLE - Add agency_id awareness (user_id based is OK)
-- Notifications are already user_id scoped, which is correct

-- 14. CHATTER_SHIFTS TABLE - Add agency filtering via creator
DROP POLICY IF EXISTS "Agency can manage shifts" ON public.chatter_shifts;
DROP POLICY IF EXISTS "Agency can view all shifts" ON public.chatter_shifts;

CREATE POLICY "Agency can manage shifts for own creators" 
ON public.chatter_shifts 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM creators 
    WHERE creators.id = chatter_shifts.creator_id 
    AND creators.agency_id = get_user_agency_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM creators 
    WHERE creators.id = chatter_shifts.creator_id 
    AND creators.agency_id = get_user_agency_id()
  )
);

-- 15. CHATTER_TIME_LOGS TABLE - Add agency filtering via chatter
DROP POLICY IF EXISTS "Agency can manage time logs" ON public.chatter_time_logs;
DROP POLICY IF EXISTS "Agency can view all time logs" ON public.chatter_time_logs;

CREATE POLICY "Agency can manage time logs for own chatters" 
ON public.chatter_time_logs 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chatters 
    WHERE chatters.id = chatter_time_logs.chatter_id 
    AND chatters.agency_id = get_user_agency_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chatters 
    WHERE chatters.id = chatter_time_logs.chatter_id 
    AND chatters.agency_id = get_user_agency_id()
  )
);

-- 16. EMPLOYEE_PAYROLL TABLE - Add agency filtering via employee
DROP POLICY IF EXISTS "Agency can manage payroll" ON public.employee_payroll;
DROP POLICY IF EXISTS "Agency can view payroll" ON public.employee_payroll;

CREATE POLICY "Agency can manage own employee payroll" 
ON public.employee_payroll 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = employee_payroll.employee_id 
    AND employees.agency_id = get_user_agency_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = employee_payroll.employee_id 
    AND employees.agency_id = get_user_agency_id()
  )
);

-- 17. EMPLOYEE_KPIS TABLE - Add agency filtering via employee
DROP POLICY IF EXISTS "Agency can manage KPIs" ON public.employee_kpis;
DROP POLICY IF EXISTS "Agency can view KPIs" ON public.employee_kpis;

CREATE POLICY "Agency can manage own employee KPIs" 
ON public.employee_kpis 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = employee_kpis.employee_id 
    AND employees.agency_id = get_user_agency_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = employee_kpis.employee_id 
    AND employees.agency_id = get_user_agency_id()
  )
);

-- 18. CREATOR_EARNINGS TABLE - Add agency filtering via creator
DROP POLICY IF EXISTS "Agency can manage creator earnings" ON public.creator_earnings;
DROP POLICY IF EXISTS "Agency can view creator earnings" ON public.creator_earnings;

CREATE POLICY "Agency can manage own creator earnings" 
ON public.creator_earnings 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM creators 
    WHERE creators.id = creator_earnings.creator_id 
    AND creators.agency_id = get_user_agency_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM creators 
    WHERE creators.id = creator_earnings.creator_id 
    AND creators.agency_id = get_user_agency_id()
  )
);

-- 19. CREATOR_SOCIAL_ACCOUNTS TABLE - Add agency filtering via creator
DROP POLICY IF EXISTS "Agency can manage social accounts" ON public.creator_social_accounts;
DROP POLICY IF EXISTS "Agency can view social accounts" ON public.creator_social_accounts;

CREATE POLICY "Agency can manage own creator social accounts" 
ON public.creator_social_accounts 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM creators 
    WHERE creators.id = creator_social_accounts.creator_id 
    AND creators.agency_id = get_user_agency_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM creators 
    WHERE creators.id = creator_social_accounts.creator_id 
    AND creators.agency_id = get_user_agency_id()
  )
);

-- 20. MARKETING_ACCOUNTS TABLE - Add agency filtering via creator
DROP POLICY IF EXISTS "Agency can manage marketing accounts" ON public.marketing_accounts;
DROP POLICY IF EXISTS "Agency can view marketing accounts" ON public.marketing_accounts;

CREATE POLICY "Agency can manage own marketing accounts" 
ON public.marketing_accounts 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM creators 
    WHERE creators.id = marketing_accounts.creator_id 
    AND creators.agency_id = get_user_agency_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM creators 
    WHERE creators.id = marketing_accounts.creator_id 
    AND creators.agency_id = get_user_agency_id()
  )
);

-- 21. CREATOR_ASSIGNMENTS TABLE - Add agency filtering via creator
DROP POLICY IF EXISTS "Agency can manage assignments" ON public.creator_assignments;
DROP POLICY IF EXISTS "Agency can view assignments" ON public.creator_assignments;

CREATE POLICY "Agency can manage own creator assignments" 
ON public.creator_assignments 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM creators 
    WHERE creators.id = creator_assignments.creator_id 
    AND creators.agency_id = get_user_agency_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM creators 
    WHERE creators.id = creator_assignments.creator_id 
    AND creators.agency_id = get_user_agency_id()
  )
);

-- 22. QC_SHIFT_ASSIGNMENTS TABLE - Add agency_id filtering
DROP POLICY IF EXISTS "Agency can manage QC assignments" ON public.qc_shift_assignments;
DROP POLICY IF EXISTS "Agency can view QC assignments" ON public.qc_shift_assignments;

CREATE POLICY "Agency can manage own QC assignments" 
ON public.qc_shift_assignments 
FOR ALL 
TO authenticated
USING (
  agency_id = get_user_agency_id()
)
WITH CHECK (
  agency_id = get_user_agency_id()
);

-- 23. MESSAGES TABLE - Add agency filtering via conversation_id (which includes creator_id)
DROP POLICY IF EXISTS "Agency can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Agency can send messages" ON public.messages;
DROP POLICY IF EXISTS "Agency can update messages" ON public.messages;

CREATE POLICY "Agency can manage messages for own creators" 
ON public.messages 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'agency'
  )
  AND (
    -- Extract creator_id from conversation_id pattern 'creator-{uuid}'
    conversation_id LIKE 'creator-%' 
    AND EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id::text = substring(messages.conversation_id from 9)
      AND creators.agency_id = get_user_agency_id()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'agency'
  )
);

-- 24. INTERNAL_MESSAGES TABLE - Add agency filtering
DROP POLICY IF EXISTS "Agency can view all internal messages" ON public.internal_messages;
DROP POLICY IF EXISTS "Agency can send internal messages" ON public.internal_messages;

CREATE POLICY "Agency can view own internal messages" 
ON public.internal_messages 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'agency'
    AND profiles.agency_id IS NOT NULL
  )
  AND (
    -- Messages involving agency's employees
    (sender_type = 'employee' AND EXISTS (
      SELECT 1 FROM employees WHERE employees.id = internal_messages.sender_id AND employees.agency_id = get_user_agency_id()
    ))
    OR
    (recipient_type = 'employee' AND EXISTS (
      SELECT 1 FROM employees WHERE employees.id = internal_messages.recipient_id AND employees.agency_id = get_user_agency_id()
    ))
    OR
    -- Messages involving agency's chatters
    (sender_type = 'chatter' AND EXISTS (
      SELECT 1 FROM chatters WHERE chatters.id = internal_messages.sender_id AND chatters.agency_id = get_user_agency_id()
    ))
    OR
    (recipient_type = 'chatter' AND EXISTS (
      SELECT 1 FROM chatters WHERE chatters.id = internal_messages.recipient_id AND chatters.agency_id = get_user_agency_id()
    ))
  )
);

CREATE POLICY "Agency can send internal messages" 
ON public.internal_messages 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'agency'
  )
);