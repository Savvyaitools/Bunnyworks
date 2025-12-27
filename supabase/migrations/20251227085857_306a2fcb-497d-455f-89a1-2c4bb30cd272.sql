-- Create invoices table
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text NOT NULL,
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Draft',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create SOP documents table
CREATE TABLE public.sop_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  content text,
  file_path text,
  file_type text,
  roles text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create calendar events table
CREATE TABLE public.calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'task',
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  all_day boolean DEFAULT false,
  creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Agency can manage invoices" ON public.invoices FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'));

CREATE POLICY "Agency can view invoices" ON public.invoices FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'));

-- Create RLS policies for SOP documents
CREATE POLICY "Agency can manage SOPs" ON public.sop_documents FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'));

CREATE POLICY "Agency can view SOPs" ON public.sop_documents FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'));

-- Create RLS policies for calendar events
CREATE POLICY "Agency can manage events" ON public.calendar_events FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'));

CREATE POLICY "Agency can view events" ON public.calendar_events FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'));

-- Create triggers for updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sop_documents_updated_at
BEFORE UPDATE ON public.sop_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for SOP files
INSERT INTO storage.buckets (id, name, public) VALUES ('sop-documents', 'sop-documents', false);

-- Create storage policies for SOP documents
CREATE POLICY "Agency can upload SOPs" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sop-documents' AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Agency can view SOPs" ON storage.objects FOR SELECT
USING (bucket_id = 'sop-documents' AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Agency can delete SOPs" ON storage.objects FOR DELETE
USING (bucket_id = 'sop-documents' AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));