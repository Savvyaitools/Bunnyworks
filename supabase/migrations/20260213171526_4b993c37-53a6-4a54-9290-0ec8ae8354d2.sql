-- Allow employees to view creators they have permissions for
CREATE POLICY "Employees can view assigned creators"
  ON public.creators
  FOR SELECT
  USING (
    id IN (
      SELECT eop.creator_id
      FROM employee_of_permissions eop
      JOIN employees e ON e.id = eop.employee_id
      WHERE e.auth_user_id = auth.uid()
    )
  );
