
CREATE TABLE public.expenditures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'one-time',
  date TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenditures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agency expenditures"
  ON public.expenditures FOR SELECT
  TO authenticated
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can insert own agency expenditures"
  ON public.expenditures FOR INSERT
  TO authenticated
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can update own agency expenditures"
  ON public.expenditures FOR UPDATE
  TO authenticated
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can delete own agency expenditures"
  ON public.expenditures FOR DELETE
  TO authenticated
  USING (agency_id = public.get_user_agency_id());

CREATE TRIGGER update_expenditures_updated_at
  BEFORE UPDATE ON public.expenditures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
