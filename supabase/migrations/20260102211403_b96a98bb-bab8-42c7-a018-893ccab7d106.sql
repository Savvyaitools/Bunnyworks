-- Create the helper functions first, then the limit check functions

-- 1. Create count functions
CREATE OR REPLACE FUNCTION public.get_agency_creator_count(p_agency_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0) FROM public.creators WHERE agency_id = p_agency_id
$$;

CREATE OR REPLACE FUNCTION public.get_agency_employee_count(p_agency_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0) FROM public.employees WHERE agency_id = p_agency_id
$$;

-- 2. Create limit check functions
CREATE OR REPLACE FUNCTION public.check_agency_creator_limit()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(
      (SELECT public.get_agency_creator_count(a.id) < a.max_creators 
       FROM public.agencies a WHERE a.id = public.get_user_agency_id()),
      false
    )
$$;

CREATE OR REPLACE FUNCTION public.check_agency_employee_limit()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(
      (SELECT public.get_agency_employee_count(a.id) < a.max_employees 
       FROM public.agencies a WHERE a.id = public.get_user_agency_id()),
      false
    )
$$;