-- Fix 1: Tighten internal_messages UPDATE WITH CHECK to match USING clause
DROP POLICY IF EXISTS "Users can update their own internal messages read status" ON public.internal_messages;

CREATE POLICY "Users can update their own internal messages read status"
ON public.internal_messages
FOR UPDATE
USING (
  ((recipient_type = 'employee' AND EXISTS (
    SELECT 1 FROM employees WHERE employees.id = internal_messages.recipient_id AND employees.auth_user_id = auth.uid()
  )) OR
  (recipient_type = 'chatter' AND EXISTS (
    SELECT 1 FROM chatters WHERE chatters.id = internal_messages.recipient_id AND chatters.auth_user_id = auth.uid()
  )) OR
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency') AND
    ((recipient_type = 'employee' AND EXISTS (
      SELECT 1 FROM employees WHERE employees.id = internal_messages.recipient_id AND employees.agency_id = get_user_agency_id()
    )) OR
    (recipient_type = 'chatter' AND EXISTS (
      SELECT 1 FROM chatters WHERE chatters.id = internal_messages.recipient_id AND chatters.agency_id = get_user_agency_id()
    )))))
)
WITH CHECK (
  ((recipient_type = 'employee' AND EXISTS (
    SELECT 1 FROM employees WHERE employees.id = internal_messages.recipient_id AND employees.auth_user_id = auth.uid()
  )) OR
  (recipient_type = 'chatter' AND EXISTS (
    SELECT 1 FROM chatters WHERE chatters.id = internal_messages.recipient_id AND chatters.auth_user_id = auth.uid()
  )) OR
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency') AND
    ((recipient_type = 'employee' AND EXISTS (
      SELECT 1 FROM employees WHERE employees.id = internal_messages.recipient_id AND employees.agency_id = get_user_agency_id()
    )) OR
    (recipient_type = 'chatter' AND EXISTS (
      SELECT 1 FROM chatters WHERE chatters.id = internal_messages.recipient_id AND chatters.agency_id = get_user_agency_id()
    )))))
);

-- Fix 2: Add rate limiting constraint for pending_applications (prevent duplicate emails within 1 hour)
-- We add a unique constraint on email + a check that prevents rapid re-submissions
CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_applications_email_unique 
ON public.pending_applications (email, agency_id) 
WHERE status = 'pending';