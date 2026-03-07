-- Fix 1: Prevent user_type escalation via profile UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND agency_id = (SELECT p.agency_id FROM public.profiles p WHERE p.id = auth.uid())
  AND user_type = (SELECT p.user_type FROM public.profiles p WHERE p.id = auth.uid())
);

-- Fix 2: Restrict credential submissions to agency owners only
DROP POLICY IF EXISTS "Agency owners can view credential submissions" ON public.creator_credential_submissions;

CREATE POLICY "Agency owners can view credential submissions"
ON public.creator_credential_submissions
FOR SELECT
TO authenticated
USING (
  agency_id = public.get_user_agency_id()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'agency')
);

DROP POLICY IF EXISTS "Agency owners can update credential submissions" ON public.creator_credential_submissions;

CREATE POLICY "Agency owners can update credential submissions"
ON public.creator_credential_submissions
FOR UPDATE
TO authenticated
USING (
  agency_id = public.get_user_agency_id()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'agency')
);