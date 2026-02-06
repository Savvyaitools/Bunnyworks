
-- Add attachments column to custom_requests
ALTER TABLE public.custom_requests ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for custom request attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('custom-request-attachments', 'custom-request-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Agency members can view attachments
CREATE POLICY "Agency members can view custom request attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'custom-request-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.agencies WHERE id = public.get_user_agency_id()
  )
);

-- RLS: Agency members can upload attachments
CREATE POLICY "Agency members can upload custom request attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'custom-request-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.agencies WHERE id = public.get_user_agency_id()
  )
);

-- RLS: Agency members can delete attachments
CREATE POLICY "Agency members can delete custom request attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'custom-request-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.agencies WHERE id = public.get_user_agency_id()
  )
);
