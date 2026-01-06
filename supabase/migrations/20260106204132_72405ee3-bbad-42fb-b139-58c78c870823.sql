-- Fix the overly permissive INSERT policy on session_access_logs
-- Drop the current policy and create a more restrictive one
DROP POLICY IF EXISTS "System can insert access logs" ON public.session_access_logs;

-- Only authenticated users can insert access logs
CREATE POLICY "Authenticated users can insert access logs"
ON public.session_access_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Also allow chatters to update their own assignment access timestamps
CREATE POLICY "Chatters can update own assignment access"
ON public.session_link_assignments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chatters c
    WHERE c.id = chatter_id
    AND c.auth_user_id = auth.uid()
  )
);