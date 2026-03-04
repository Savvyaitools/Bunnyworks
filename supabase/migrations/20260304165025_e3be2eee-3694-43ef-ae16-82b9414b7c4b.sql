
-- Add id_document_url column to employees table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS id_document_url text;

-- Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Authenticated users can upload to employee-documents bucket
CREATE POLICY "Authenticated users can upload employee docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-documents');

-- RLS: Authenticated users can view employee docs
CREATE POLICY "Authenticated users can view employee docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'employee-documents');

-- RLS: Authenticated users can delete their employee docs
CREATE POLICY "Authenticated users can delete employee docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'employee-documents');
