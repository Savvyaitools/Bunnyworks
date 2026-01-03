-- Create table for QC assignments to shift blocks
CREATE TABLE public.qc_shift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  shift_block text NOT NULL CHECK (shift_block IN ('night', 'day', 'evening')),
  qc_employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (agency_id, shift_block, effective_date)
);

-- Enable RLS
ALTER TABLE public.qc_shift_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Agency can view QC assignments"
ON public.qc_shift_assignments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Agency can manage QC assignments"
ON public.qc_shift_assignments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

-- Trigger for updated_at
CREATE TRIGGER update_qc_shift_assignments_updated_at
BEFORE UPDATE ON public.qc_shift_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();