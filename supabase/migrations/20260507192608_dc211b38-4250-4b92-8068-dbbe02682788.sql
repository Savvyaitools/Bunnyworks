DROP POLICY IF EXISTS "Creators can upload to content vault" ON storage.objects;
DROP POLICY IF EXISTS "Creators can read their content vault" ON storage.objects;
DROP POLICY IF EXISTS "Creators can delete their content vault" ON storage.objects;
DROP POLICY IF EXISTS "Creators can view their content references" ON storage.objects;

CREATE POLICY "Creators can upload to content vault"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'content-vault'
  AND EXISTS (
    SELECT 1
    FROM public.creators c
    WHERE c.auth_user_id = auth.uid()
      AND (storage.foldername(storage.objects.name))[1] = c.agency_id::text
      AND (storage.foldername(storage.objects.name))[2] = c.id::text
  )
);

CREATE POLICY "Creators can read their content vault"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'content-vault'
  AND EXISTS (
    SELECT 1
    FROM public.creators c
    WHERE c.auth_user_id = auth.uid()
      AND (storage.foldername(storage.objects.name))[1] = c.agency_id::text
      AND (storage.foldername(storage.objects.name))[2] = c.id::text
  )
);

CREATE POLICY "Creators can delete their content vault"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'content-vault'
  AND EXISTS (
    SELECT 1
    FROM public.creators c
    WHERE c.auth_user_id = auth.uid()
      AND (storage.foldername(storage.objects.name))[1] = c.agency_id::text
      AND (storage.foldername(storage.objects.name))[2] = c.id::text
  )
);

CREATE POLICY "Creators can view their content references"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'content-references'
  AND EXISTS (
    SELECT 1
    FROM public.creators c
    WHERE c.auth_user_id = auth.uid()
      AND (storage.foldername(storage.objects.name))[1] = c.agency_id::text
      AND (storage.foldername(storage.objects.name))[2] = c.id::text
  )
);