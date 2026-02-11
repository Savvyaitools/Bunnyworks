
-- Fix overly permissive content-vault storage policies

-- Drop dangerous policies
DROP POLICY IF EXISTS "Anyone can delete content vault files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload content vault files" ON storage.objects;

-- Create secure replacement policies
CREATE POLICY "Authenticated users can upload to content-vault"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-vault'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete own content-vault files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-vault'
  AND auth.uid() IS NOT NULL
);

-- Also add a creator-specific SELECT policy on content_files
CREATE POLICY "Creators can view their own content files"
ON public.content_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM creators c
    WHERE c.id = content_files.creator_id
    AND c.auth_user_id = auth.uid()
  )
);

-- Creator-specific INSERT policy on content_files
CREATE POLICY "Creators can upload their own content files"
ON public.content_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM creators c
    WHERE c.id = content_files.creator_id
    AND c.auth_user_id = auth.uid()
  )
);

-- Creator-specific DELETE policy on content_files
CREATE POLICY "Creators can delete their own content files"
ON public.content_files FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM creators c
    WHERE c.id = content_files.creator_id
    AND c.auth_user_id = auth.uid()
  )
);
