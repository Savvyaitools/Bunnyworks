-- Create data_imports table for storing uploaded screenshots
CREATE TABLE public.data_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.creators(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  rejection_reason TEXT,
  confidence_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create extracted_data table for storing AI-extracted metrics
CREATE TABLE public.extracted_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID REFERENCES public.data_imports(id) ON DELETE CASCADE NOT NULL,
  data_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  period_start DATE,
  period_end DATE,
  platform TEXT,
  raw_text TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for data_imports
CREATE POLICY "Agency can manage own data imports"
ON public.data_imports
FOR ALL
USING (agency_id = get_user_agency_id())
WITH CHECK (agency_id = get_user_agency_id());

-- RLS policies for extracted_data (through import relationship)
CREATE POLICY "Agency can view own extracted data"
ON public.extracted_data
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.data_imports
  WHERE data_imports.id = extracted_data.import_id
  AND data_imports.agency_id = get_user_agency_id()
));

CREATE POLICY "Agency can manage own extracted data"
ON public.extracted_data
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.data_imports
  WHERE data_imports.id = extracted_data.import_id
  AND data_imports.agency_id = get_user_agency_id()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.data_imports
  WHERE data_imports.id = extracted_data.import_id
  AND data_imports.agency_id = get_user_agency_id()
));

-- Create updated_at trigger for data_imports
CREATE TRIGGER update_data_imports_updated_at
BEFORE UPDATE ON public.data_imports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for data imports (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('data-imports', 'data-imports', false);

-- Storage policies for data-imports bucket
CREATE POLICY "Agency users can upload to data-imports"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'data-imports' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Agency users can view own data-imports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'data-imports'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Agency users can delete own data-imports"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'data-imports'
  AND auth.uid() IS NOT NULL
);