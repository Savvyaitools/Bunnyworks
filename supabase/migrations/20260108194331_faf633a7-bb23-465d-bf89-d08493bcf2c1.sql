-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Agency users can manage permissions" ON public.employee_of_permissions;

-- Create separate specific policies for INSERT, UPDATE, DELETE
CREATE POLICY "Agency users can insert permissions"
ON public.employee_of_permissions FOR INSERT
WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "Agency users can update permissions"
ON public.employee_of_permissions FOR UPDATE
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Agency users can delete permissions"
ON public.employee_of_permissions FOR DELETE
USING (agency_id = public.get_user_agency_id());