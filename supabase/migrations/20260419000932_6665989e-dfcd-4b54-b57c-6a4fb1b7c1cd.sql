
-- Fix content_folders RLS for creators (use auth_user_id, add full CRUD)
DROP POLICY IF EXISTS "Creators can view their own content folders" ON public.content_folders;

CREATE POLICY "Creators can view their own content folders"
  ON public.content_folders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.id = content_folders.creator_id AND c.auth_user_id = auth.uid()
  ));

CREATE POLICY "Creators can create their own content folders"
  ON public.content_folders FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.id = content_folders.creator_id AND c.auth_user_id = auth.uid()
  ));

CREATE POLICY "Creators can update their own content folders"
  ON public.content_folders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.id = content_folders.creator_id AND c.auth_user_id = auth.uid()
  ));

CREATE POLICY "Creators can delete their own content folders"
  ON public.content_folders FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.id = content_folders.creator_id AND c.auth_user_id = auth.uid()
  ));

-- Allow creators to update their own custom_requests (status changes - fulfill/reject)
CREATE POLICY "Creators can update their own custom requests"
  ON public.custom_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.id = custom_requests.creator_id AND c.auth_user_id = auth.uid()
  ));
