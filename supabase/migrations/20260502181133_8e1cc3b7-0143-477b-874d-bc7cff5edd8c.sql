-- Clean up duplicate / conflicting policies on the content-references storage bucket
-- and enforce a single agency-scoped folder policy set.

DROP POLICY IF EXISTS "Agency can upload content references" ON storage.objects;
DROP POLICY IF EXISTS "Agency can delete content references" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view content references" ON storage.objects;
DROP POLICY IF EXISTS "Agency users can view content references" ON storage.objects;
DROP POLICY IF EXISTS "Agency users can upload content references" ON storage.objects;
DROP POLICY IF EXISTS "Agency users can delete content references" ON storage.objects;
DROP POLICY IF EXISTS "Agency members can view content references" ON storage.objects;
DROP POLICY IF EXISTS "Agency members can upload content references" ON storage.objects;
DROP POLICY IF EXISTS "Agency members can delete content references" ON storage.objects;

-- Strict agency-folder-scoped policies
CREATE POLICY "Agency members can view content references"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'content-references'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

CREATE POLICY "Agency members can upload content references"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-references'
  AND public.get_user_agency_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

CREATE POLICY "Agency members can update content references"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'content-references'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
)
WITH CHECK (
  bucket_id = 'content-references'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

CREATE POLICY "Agency members can delete content references"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-references'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

-- Allow creators (portal users) to view reference media for their own plans
CREATE POLICY "Creators can view their content references"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'content-references'
  AND EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.auth_user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.agency_id::text
  )
);
