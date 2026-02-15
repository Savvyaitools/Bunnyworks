-- Fix the pending_applications INSERT policy to validate required fields instead of WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.pending_applications;

CREATE POLICY "Anyone can submit applications"
ON public.pending_applications
FOR INSERT
WITH CHECK (
  -- Ensure required fields are present and valid
  length(trim(name)) >= 2 AND
  length(trim(email)) >= 5 AND
  agency_id IS NOT NULL AND
  application_type IS NOT NULL
);