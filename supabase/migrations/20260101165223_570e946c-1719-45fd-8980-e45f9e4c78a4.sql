-- Add avatar_url column to creators table
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create storage bucket for creator avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('creator-avatars', 'creator-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatar images
CREATE POLICY "Agency can upload creator avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'creator-avatars' AND
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

-- Allow authenticated users to update their avatars
CREATE POLICY "Agency can update creator avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'creator-avatars' AND
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

-- Allow authenticated users to delete avatars
CREATE POLICY "Agency can delete creator avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'creator-avatars' AND
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

-- Allow public read access to avatars
CREATE POLICY "Anyone can view creator avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'creator-avatars');