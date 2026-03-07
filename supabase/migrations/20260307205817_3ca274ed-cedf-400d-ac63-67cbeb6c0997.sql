-- CRITICAL: Prevent users from changing their own agency_id (privilege escalation vector)
-- The UPDATE policy must prevent modification of agency_id
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND agency_id = (SELECT p.agency_id FROM public.profiles p WHERE p.id = auth.uid())
);

-- Fix session_access_logs: restrict INSERT to own agency sessions
DROP POLICY IF EXISTS "Users can insert session access logs" ON public.session_access_logs;

CREATE POLICY "Users can insert session access logs"
ON public.session_access_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.creator_session_links csl
    WHERE csl.id = session_link_id
    AND csl.agency_id = public.get_user_agency_id()
  )
);