
-- ============================================
-- 1. Fix content-vault storage policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read content vault" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete content vault" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to content vault" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update content vault" ON storage.objects;

-- Agency-scoped read
CREATE POLICY "Agency members can read content vault"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'content-vault'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

-- Agency-scoped insert
CREATE POLICY "Agency members can upload to content vault"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-vault'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

-- Agency-scoped delete
CREATE POLICY "Agency members can delete content vault"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-vault'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

-- ============================================
-- 2. Fix data-imports storage policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read data imports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload data imports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete data imports" ON storage.objects;

CREATE POLICY "Agency members can read data imports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'data-imports'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

CREATE POLICY "Agency members can upload data imports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'data-imports'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

CREATE POLICY "Agency members can delete data imports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'data-imports'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

-- ============================================
-- 3. Fix employee-documents storage policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view employee documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload employee documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete employee documents" ON storage.objects;

CREATE POLICY "Agency members can view employee documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

CREATE POLICY "Agency members can upload employee documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

CREATE POLICY "Agency members can delete employee documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
);

-- ============================================
-- 4. Add RLS policies to chatter_message_log
-- ============================================
CREATE POLICY "Agency members can view chatter message logs"
ON public.chatter_message_log FOR SELECT
TO authenticated
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Agency members can insert chatter message logs"
ON public.chatter_message_log FOR INSERT
TO authenticated
WITH CHECK (agency_id = public.get_user_agency_id());
