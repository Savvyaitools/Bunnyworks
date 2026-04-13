
-- sop-documents
DROP POLICY IF EXISTS "Agency users can upload SOPs" ON storage.objects;
DROP POLICY IF EXISTS "Agency users can view SOPs" ON storage.objects;
DROP POLICY IF EXISTS "Agency users can delete SOPs" ON storage.objects;

CREATE POLICY "Agency members can view sop documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'sop-documents'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

CREATE POLICY "Agency members can upload sop documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sop-documents'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

CREATE POLICY "Agency members can delete sop documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sop-documents'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

-- content-references
DROP POLICY IF EXISTS "Agency users can view content references" ON storage.objects;
DROP POLICY IF EXISTS "Agency users can upload content references" ON storage.objects;
DROP POLICY IF EXISTS "Agency users can delete content references" ON storage.objects;

CREATE POLICY "Agency members can view content references"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'content-references'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

CREATE POLICY "Agency members can upload content references"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-references'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

CREATE POLICY "Agency members can delete content references"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-references'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);
