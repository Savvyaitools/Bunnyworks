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
      AND (storage.foldername(name))[1] = c.agency_id::text
      AND (storage.foldername(name))[2] = c.id::text
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
      AND (storage.foldername(name))[1] = c.agency_id::text
      AND (storage.foldername(name))[2] = c.id::text
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
      AND (storage.foldername(name))[1] = c.agency_id::text
      AND (storage.foldername(name))[2] = c.id::text
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
      AND (storage.foldername(name))[1] = c.agency_id::text
      AND (storage.foldername(name))[2] = c.id::text
  )
);

DROP POLICY IF EXISTS "Creators can upload their own content files" ON public.content_files;
DROP POLICY IF EXISTS "Creators can view their own content files" ON public.content_files;
DROP POLICY IF EXISTS "Creators can delete their own content files" ON public.content_files;

CREATE POLICY "Creators can upload their own content files"
ON public.content_files
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.creators c
    WHERE c.id = content_files.creator_id
      AND c.auth_user_id = auth.uid()
      AND content_files.agency_id = c.agency_id
      AND content_files.file_path LIKE c.agency_id::text || '/' || c.id::text || '/%'
  )
);

CREATE POLICY "Creators can view their own content files"
ON public.content_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.creators c
    WHERE c.id = content_files.creator_id
      AND c.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Creators can delete their own content files"
ON public.content_files
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.creators c
    WHERE c.id = content_files.creator_id
      AND c.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Creators can create their own content folders" ON public.content_folders;
DROP POLICY IF EXISTS "Creators can view their own content folders" ON public.content_folders;
DROP POLICY IF EXISTS "Creators can update their own content folders" ON public.content_folders;
DROP POLICY IF EXISTS "Creators can delete their own content folders" ON public.content_folders;

CREATE POLICY "Creators can create their own content folders"
ON public.content_folders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.creators c
    WHERE c.id = content_folders.creator_id
      AND c.auth_user_id = auth.uid()
      AND content_folders.agency_id = c.agency_id
  )
);

CREATE POLICY "Creators can view their own content folders"
ON public.content_folders
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.creators c
    WHERE c.id = content_folders.creator_id
      AND c.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Creators can update their own content folders"
ON public.content_folders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.creators c
    WHERE c.id = content_folders.creator_id
      AND c.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.creators c
    WHERE c.id = content_folders.creator_id
      AND c.auth_user_id = auth.uid()
      AND content_folders.agency_id = c.agency_id
  )
);

CREATE POLICY "Creators can delete their own content folders"
ON public.content_folders
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.creators c
    WHERE c.id = content_folders.creator_id
      AND c.auth_user_id = auth.uid()
  )
);