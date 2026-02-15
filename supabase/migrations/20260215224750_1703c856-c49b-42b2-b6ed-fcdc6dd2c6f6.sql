-- Fix: Allow employees with employee_of_permissions to view creator session links
-- Drop the old policy that only checks session_link_assignments and creator_assignments
DROP POLICY IF EXISTS "Chatters can view assigned creator sessions" ON creator_session_links;

-- Create new policy that also checks employee_of_permissions
CREATE POLICY "Employees can view assigned creator sessions"
ON creator_session_links
FOR SELECT
USING (
  -- Check via employee_of_permissions (primary assignment method)
  EXISTS (
    SELECT 1
    FROM employee_of_permissions eop
    JOIN employees e ON e.id = eop.employee_id
    WHERE eop.creator_id = creator_session_links.creator_id
      AND e.auth_user_id = auth.uid()
  )
  OR
  -- Check via creator_assignments (legacy)
  EXISTS (
    SELECT 1
    FROM creator_assignments ca
    JOIN chatters c ON c.id = ca.chatter_id
    WHERE ca.creator_id = creator_session_links.creator_id
      AND c.auth_user_id = auth.uid()
  )
);