-- Create payroll records table
CREATE TABLE public.employee_payroll (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  base_salary numeric NOT NULL DEFAULT 0,
  commission_earned numeric NOT NULL DEFAULT 0,
  bonus numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  total_payout numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create employee KPIs/metrics table
CREATE TABLE public.employee_kpis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  tasks_completed integer NOT NULL DEFAULT 0,
  tasks_assigned integer NOT NULL DEFAULT 0,
  creators_managed integer NOT NULL DEFAULT 0,
  revenue_generated numeric NOT NULL DEFAULT 0,
  messages_sent integer NOT NULL DEFAULT 0,
  avg_response_time_minutes integer,
  rating numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_kpis ENABLE ROW LEVEL SECURITY;

-- Agency can manage payroll
CREATE POLICY "Agency can manage payroll" ON public.employee_payroll
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

CREATE POLICY "Agency can view payroll" ON public.employee_payroll
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

-- Employees can view own payroll
CREATE POLICY "Employees can view own payroll" ON public.employee_payroll
FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees WHERE employees.id = employee_payroll.employee_id AND employees.auth_user_id = auth.uid())
);

-- Agency can manage KPIs
CREATE POLICY "Agency can manage KPIs" ON public.employee_kpis
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

CREATE POLICY "Agency can view KPIs" ON public.employee_kpis
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

-- Employees can view own KPIs
CREATE POLICY "Employees can view own KPIs" ON public.employee_kpis
FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees WHERE employees.id = employee_kpis.employee_id AND employees.auth_user_id = auth.uid())
);

-- Add triggers for updated_at
CREATE TRIGGER update_employee_payroll_updated_at
  BEFORE UPDATE ON public.employee_payroll
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_kpis_updated_at
  BEFORE UPDATE ON public.employee_kpis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();