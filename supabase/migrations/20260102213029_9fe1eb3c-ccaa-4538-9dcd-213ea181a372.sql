-- Add logo_url column to agencies table
ALTER TABLE public.agencies ADD COLUMN logo_url text;

-- Create agency-logos storage bucket (public for display)
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-logos', 'agency-logos', true);

-- RLS Policies for agency-logos bucket

-- Agency users can upload to their own folder
CREATE POLICY "Agency can upload own logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agency-logos' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = get_user_agency_id()::text
);

-- Anyone can view logos (public display)
CREATE POLICY "Public can view agency logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'agency-logos');

-- Agency can update own logo
CREATE POLICY "Agency can update own logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'agency-logos' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = get_user_agency_id()::text
);

-- Agency can delete own logo
CREATE POLICY "Agency can delete own logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'agency-logos' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = get_user_agency_id()::text
);