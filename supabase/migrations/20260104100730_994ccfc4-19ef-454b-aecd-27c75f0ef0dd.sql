-- Add UPDATE policy for internal_messages to allow marking as read
CREATE POLICY "Users can update their own internal messages read status"
ON public.internal_messages
FOR UPDATE
USING (
  -- Employees can update messages they received
  ((recipient_type = 'employee') AND (EXISTS (
    SELECT 1 FROM employees WHERE employees.id = internal_messages.recipient_id AND employees.auth_user_id = auth.uid()
  )))
  OR
  -- Chatters can update messages they received  
  ((recipient_type = 'chatter') AND (EXISTS (
    SELECT 1 FROM chatters WHERE chatters.id = internal_messages.recipient_id AND chatters.auth_user_id = auth.uid()
  )))
  OR
  -- Agency can update messages to their employees/chatters
  (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
  ) AND (
    ((recipient_type = 'employee') AND (EXISTS (
      SELECT 1 FROM employees WHERE employees.id = internal_messages.recipient_id AND employees.agency_id = get_user_agency_id()
    )))
    OR
    ((recipient_type = 'chatter') AND (EXISTS (
      SELECT 1 FROM chatters WHERE chatters.id = internal_messages.recipient_id AND chatters.agency_id = get_user_agency_id()
    )))
  ))
)
WITH CHECK (
  -- Only allow updating the 'read' column (enforced by application logic)
  true
);