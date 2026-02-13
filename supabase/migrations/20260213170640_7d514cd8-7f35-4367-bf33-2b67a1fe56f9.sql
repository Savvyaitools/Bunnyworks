
-- Fix employee_of_permissions RLS: All policies are RESTRICTIVE which blocks ALL access
-- Need to recreate SELECT policies as PERMISSIVE

-- Drop the broken restrictive SELECT policies
DROP POLICY IF EXISTS "Agency users can view their permissions" ON public.employee_of_permissions;
DROP POLICY IF EXISTS "Employees can view own permissions" ON public.employee_of_permissions;

-- Recreate as PERMISSIVE (default) so they OR together
CREATE POLICY "Agency users can view their permissions"
  ON public.employee_of_permissions
  FOR SELECT
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Employees can view own permissions"
  ON public.employee_of_permissions
  FOR SELECT
  USING (employee_id IN (
    SELECT employees.id FROM employees WHERE employees.auth_user_id = auth.uid()
  ));

-- Also fix INSERT/UPDATE/DELETE to be PERMISSIVE for agency users
DROP POLICY IF EXISTS "Agency users can insert permissions" ON public.employee_of_permissions;
DROP POLICY IF EXISTS "Agency users can update permissions" ON public.employee_of_permissions;
DROP POLICY IF EXISTS "Agency users can delete permissions" ON public.employee_of_permissions;

CREATE POLICY "Agency users can insert permissions"
  ON public.employee_of_permissions
  FOR INSERT
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Agency users can update permissions"
  ON public.employee_of_permissions
  FOR UPDATE
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Agency users can delete permissions"
  ON public.employee_of_permissions
  FOR DELETE
  USING (agency_id = get_user_agency_id());
