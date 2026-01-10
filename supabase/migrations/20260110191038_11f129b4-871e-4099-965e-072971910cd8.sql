-- Fix content-references bucket security
-- Make the bucket private instead of public

UPDATE storage.buckets 
SET public = false 
WHERE id = 'content-references';

-- Drop the overly permissive public access policy
DROP POLICY IF EXISTS "Anyone can view content references" ON storage.objects;

-- Create agency-scoped read policy for authenticated users
CREATE POLICY "Agency users can view content references"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'content-references' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND agency_id IS NOT NULL
  )
);

-- Create agency-scoped upload policy
CREATE POLICY "Agency users can upload content references"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-references'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND agency_id IS NOT NULL
  )
);

-- Create agency-scoped delete policy
CREATE POLICY "Agency users can delete content references"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-references'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND agency_id IS NOT NULL
  )
);