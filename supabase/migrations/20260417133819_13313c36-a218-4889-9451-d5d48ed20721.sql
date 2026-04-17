
-- Add attachment fields to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_size bigint;

-- Allow content (text) to be empty when an attachment is present
ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;

-- Create storage bucket for chat attachments (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: any authenticated user can upload to their own agency folder
-- Path convention: {agency_id}/{conversation_id}/{filename}
CREATE POLICY "Authenticated users can upload message attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (
    -- Agency users uploading to their agency folder
    (storage.foldername(name))[1] = public.get_user_agency_id()::text
    OR
    -- Creators uploading to their agency folder
    EXISTS (
      SELECT 1 FROM public.creators c
      WHERE c.auth_user_id = auth.uid()
        AND c.agency_id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Users can view message attachments in their agency"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (
    (storage.foldername(name))[1] = public.get_user_agency_id()::text
    OR EXISTS (
      SELECT 1 FROM public.creators c
      WHERE c.auth_user_id = auth.uid()
        AND c.agency_id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Users can delete their own message attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND owner = auth.uid()
);
