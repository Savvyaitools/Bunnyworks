-- =============================================
-- Multi-Tenancy Foundation: Agencies Table
-- =============================================

-- 1. Create the agencies table
CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website text,
  commission_rate numeric NOT NULL DEFAULT 0.3,
  subscription_tier text NOT NULL DEFAULT 'starter',
  max_creators integer NOT NULL DEFAULT 10,
  max_employees integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add agency_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN agency_id uuid REFERENCES public.agencies(id);

-- 3. Create helper function for agency lookups (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.profiles WHERE id = auth.uid()
$$;

-- 4. Add agency_id to core business tables
ALTER TABLE public.creators ADD COLUMN agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.employees ADD COLUMN agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.chatters ADD COLUMN agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.tasks ADD COLUMN agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.invoices ADD COLUMN agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.content_plans ADD COLUMN agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.content_files ADD COLUMN agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.content_folders ADD COLUMN agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.recruiting_creators ADD COLUMN agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.sop_documents ADD COLUMN agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.calendar_events ADD COLUMN agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.goals ADD COLUMN agency_id uuid REFERENCES public.agencies(id);

-- 5. RLS Policies for agencies table
-- Users can view their own agency
CREATE POLICY "Users can view own agency"
ON public.agencies FOR SELECT
USING (id = get_user_agency_id());

-- Users can update their own agency
CREATE POLICY "Users can update own agency"
ON public.agencies FOR UPDATE
USING (id = get_user_agency_id());

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to agencies"
ON public.agencies FOR ALL
TO anon
USING (false)
WITH CHECK (false);