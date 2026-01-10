-- Phase 1: Database Migrations

-- 1. Add persona and branding fields to creators table
ALTER TABLE public.creators
ADD COLUMN IF NOT EXISTS persona TEXT,
ADD COLUMN IF NOT EXISTS branding JSONB;

-- 2. Add submission tracking columns to content_plans table
ALTER TABLE public.content_plans
ADD COLUMN IF NOT EXISTS submission_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS submitted_media JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS content_category TEXT DEFAULT 'platform';

-- Add check constraint for submission_status
ALTER TABLE public.content_plans
ADD CONSTRAINT content_plans_submission_status_check 
CHECK (submission_status IN ('pending', 'submitted', 'approved', 'revision_needed'));

-- Add check constraint for content_category
ALTER TABLE public.content_plans
ADD CONSTRAINT content_plans_content_category_check 
CHECK (content_category IN ('platform', 'social'));

-- 3. Create custom_requests table
CREATE TABLE IF NOT EXISTS public.custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  price NUMERIC,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT custom_requests_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

-- Enable RLS on custom_requests
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;

-- RLS policy for custom_requests
CREATE POLICY "Agency can manage own custom requests"
ON public.custom_requests
FOR ALL
USING (agency_id = get_user_agency_id())
WITH CHECK (agency_id = get_user_agency_id());

-- Creators can view their own custom requests
CREATE POLICY "Creators can view their own custom requests"
ON public.custom_requests
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM creators c
  JOIN profiles p ON lower(p.email) = lower(c.email)
  WHERE p.id = auth.uid() AND c.id = custom_requests.creator_id
));

-- 4. Create employee_bonus_structures table
CREATE TABLE IF NOT EXISTS public.employee_bonus_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  department TEXT NOT NULL,
  grade_a_bonus NUMERIC NOT NULL DEFAULT 0,
  grade_b_bonus NUMERIC NOT NULL DEFAULT 0,
  grade_c_bonus NUMERIC NOT NULL DEFAULT 0,
  grade_a_threshold NUMERIC NOT NULL DEFAULT 90,
  grade_b_threshold NUMERIC NOT NULL DEFAULT 75,
  grade_c_threshold NUMERIC NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employee_bonus_structures_month_check CHECK (period_month >= 1 AND period_month <= 12),
  CONSTRAINT employee_bonus_structures_department_check CHECK (department IN ('chatting', 'marketing'))
);

-- Enable RLS on employee_bonus_structures
ALTER TABLE public.employee_bonus_structures ENABLE ROW LEVEL SECURITY;

-- RLS policy for employee_bonus_structures
CREATE POLICY "Agency can manage own bonus structures"
ON public.employee_bonus_structures
FOR ALL
USING (agency_id = get_user_agency_id())
WITH CHECK (agency_id = get_user_agency_id());

-- 5. Create employee_bonus_awards table
CREATE TABLE IF NOT EXISTS public.employee_bonus_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bonus_structure_id UUID NOT NULL REFERENCES public.employee_bonus_structures(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  grade_earned TEXT NOT NULL,
  performance_score NUMERIC NOT NULL,
  bonus_amount NUMERIC NOT NULL,
  metrics_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employee_bonus_awards_grade_check CHECK (grade_earned IN ('A', 'B', 'C'))
);

-- Enable RLS on employee_bonus_awards
ALTER TABLE public.employee_bonus_awards ENABLE ROW LEVEL SECURITY;

-- RLS policy for employee_bonus_awards
CREATE POLICY "Agency can manage own bonus awards"
ON public.employee_bonus_awards
FOR ALL
USING (EXISTS (
  SELECT 1 FROM employee_bonus_structures ebs
  WHERE ebs.id = employee_bonus_awards.bonus_structure_id
  AND ebs.agency_id = get_user_agency_id()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM employee_bonus_structures ebs
  WHERE ebs.id = employee_bonus_awards.bonus_structure_id
  AND ebs.agency_id = get_user_agency_id()
));

-- Employees can view their own bonus awards
CREATE POLICY "Employees can view own bonus awards"
ON public.employee_bonus_awards
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM employees e
  WHERE e.id = employee_bonus_awards.employee_id
  AND e.auth_user_id = auth.uid()
));

-- Create trigger for updated_at on custom_requests
CREATE TRIGGER update_custom_requests_updated_at
BEFORE UPDATE ON public.custom_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on employee_bonus_structures
CREATE TRIGGER update_employee_bonus_structures_updated_at
BEFORE UPDATE ON public.employee_bonus_structures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();