-- Add RLS policies for employees (managers) to access messages of creators they manage
-- Managers can view messages for creators they are assigned to (via manager_id)

CREATE POLICY "Managers can view assigned creator messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type = 'employee'
  )
  AND EXISTS (
    SELECT 1 FROM employees e
    JOIN creators c ON c.manager_id = e.id
    WHERE e.auth_user_id = auth.uid()
    AND conversation_id = concat('creator-', c.id)
    AND e.role != 'Chatter' -- Chatters cannot access creator messages
  )
);

-- Managers can send messages to creators they are assigned to
CREATE POLICY "Managers can send messages to assigned creators"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type = 'employee'
  )
  AND sender_type = 'agency' -- Managers send as "agency" type
  AND EXISTS (
    SELECT 1 FROM employees e
    JOIN creators c ON c.manager_id = e.id
    WHERE e.auth_user_id = auth.uid()
    AND conversation_id = concat('creator-', c.id)
    AND e.role != 'Chatter'
  )
);

-- Managers can update (mark as read) messages for their assigned creators
CREATE POLICY "Managers can update assigned creator messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type = 'employee'
  )
  AND EXISTS (
    SELECT 1 FROM employees e
    JOIN creators c ON c.manager_id = e.id
    WHERE e.auth_user_id = auth.uid()
    AND conversation_id = concat('creator-', c.id)
    AND e.role != 'Chatter'
  )
);