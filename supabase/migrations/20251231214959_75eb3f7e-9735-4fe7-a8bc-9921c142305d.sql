-- Allow creators to view their own content folders
CREATE POLICY "Creators can view their own content folders"
ON public.content_folders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM creators c
    JOIN profiles p ON lower(p.email) = lower(c.email)
    WHERE p.id = auth.uid() AND c.id = content_folders.creator_id
  )
);