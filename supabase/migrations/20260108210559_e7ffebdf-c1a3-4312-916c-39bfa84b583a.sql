-- Phase 2: Add chatter-specific fields to employees table

-- Add new columns for chatter functionality (including timezone)
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS skill_grade text DEFAULT 'B';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS is_chatter boolean DEFAULT false;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS daily_target_messages integer DEFAULT 100;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS daily_target_ppv integer DEFAULT 20;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS timezone text;

-- Set is_chatter = true for any employee with role "Chatter"
UPDATE public.employees 
SET is_chatter = true 
WHERE LOWER(role) = 'chatter';

-- Migrate existing data from chatters to employees (match by email and agency_id)
UPDATE public.employees e
SET 
  skill_grade = COALESCE(c.skill_grade, 'B'),
  timezone = c.timezone,
  is_chatter = true
FROM public.chatters c
WHERE e.email = c.email AND e.agency_id = c.agency_id;

-- Add employee_id column to chatter_time_logs for migration
ALTER TABLE public.chatter_time_logs ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE;

-- Update employee_id based on chatter email matching
UPDATE public.chatter_time_logs ctl
SET employee_id = e.id
FROM public.chatters c
JOIN public.employees e ON c.email = e.email AND c.agency_id = e.agency_id
WHERE ctl.chatter_id = c.id;

-- Add employee_id column to chatter_shifts for migration
ALTER TABLE public.chatter_shifts ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE;

-- Update employee_id based on chatter email matching
UPDATE public.chatter_shifts cs
SET employee_id = e.id
FROM public.chatters c
JOIN public.employees e ON c.email = e.email AND c.agency_id = e.agency_id
WHERE cs.chatter_id = c.id;

-- Add employee_id column to creator_assignments for migration
ALTER TABLE public.creator_assignments ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE;

-- Update employee_id based on chatter email matching
UPDATE public.creator_assignments ca
SET employee_id = e.id
FROM public.chatters c
JOIN public.employees e ON c.email = e.email AND c.agency_id = e.agency_id
WHERE ca.chatter_id = c.id;