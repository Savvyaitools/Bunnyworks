-- Fix broken creator upload policy that referenced c.name instead of the file path
DROP POLICY IF EXISTS "Creators can upload to content vault" ON storage.objects;
DROP POLICY IF EXISTS "Creators can read their content vault" ON storage.objects;
DROP POLICY IF EXISTS "Creators can delete their content vault" ON storage.objects;

CREATE POLICY "Creators can upload to content vault"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'content-vault'
  AND EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.auth_user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.agency_id::text
  )
);

CREATE POLICY "Creators can read their content vault"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'content-vault'
  AND EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.auth_user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.agency_id::text
  )
);

CREATE POLICY "Creators can delete their content vault"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'content-vault'
  AND EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.auth_user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.agency_id::text
  )
);