-- Create storage bucket for content vault files
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-vault', 'content-vault', true);

-- Create a table to track content files metadata
CREATE TABLE public.content_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Review',
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_files ENABLE ROW LEVEL SECURITY;

-- Allow public read/insert for now (will be updated when auth is added)
CREATE POLICY "Anyone can view content files"
  ON public.content_files
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can upload content files"
  ON public.content_files
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete content files"
  ON public.content_files
  FOR DELETE
  USING (true);

-- Storage policies for the bucket
CREATE POLICY "Anyone can view content vault files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'content-vault');

CREATE POLICY "Anyone can upload content vault files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'content-vault');

CREATE POLICY "Anyone can delete content vault files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'content-vault');