-- Add employee user type support
-- Note: The profiles table already has a text user_type column

-- Add auth_user_id to employees table to link with auth
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON public.employees(auth_user_id);

-- Add RLS policy for employees to view their own profile
CREATE POLICY "Employees can view own employee record"
ON public.employees
FOR SELECT
USING (auth_user_id = auth.uid());

-- Allow employees to view internal messages where they are sender or recipient
CREATE POLICY "Employees can view their internal messages"
ON public.internal_messages
FOR SELECT
USING (
  (sender_type = 'employee' AND EXISTS (
    SELECT 1 FROM employees WHERE employees.id = internal_messages.sender_id AND employees.auth_user_id = auth.uid()
  ))
  OR 
  (recipient_type = 'employee' AND EXISTS (
    SELECT 1 FROM employees WHERE employees.id = internal_messages.recipient_id AND employees.auth_user_id = auth.uid()
  ))
);

-- Allow employees to send internal messages (only to agency, not to creators)
CREATE POLICY "Employees can send internal messages"
ON public.internal_messages
FOR INSERT
WITH CHECK (
  sender_type = 'employee' 
  AND recipient_type != 'creator'
  AND EXISTS (
    SELECT 1 FROM employees WHERE employees.id = internal_messages.sender_id AND employees.auth_user_id = auth.uid()
  )
);

-- Allow employees to view their own chatter shifts if they are a chatter
CREATE POLICY "Employees can view own chatter shifts"
ON public.chatter_shifts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chatters 
    WHERE chatters.id = chatter_shifts.chatter_id 
    AND chatters.auth_user_id = auth.uid()
  )
);

-- Allow employees to view their own chatter time logs if they are a chatter
CREATE POLICY "Employees can view own chatter time logs"
ON public.chatter_time_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chatters 
    WHERE chatters.id = chatter_time_logs.chatter_id 
    AND chatters.auth_user_id = auth.uid()
  )
);

-- Allow employees (chatters) to clock in/out
CREATE POLICY "Employees can clock in/out"
ON public.chatter_time_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chatters 
    WHERE chatters.id = chatter_time_logs.chatter_id 
    AND chatters.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Employees can update own time logs"
ON public.chatter_time_logs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM chatters 
    WHERE chatters.id = chatter_time_logs.chatter_id 
    AND chatters.auth_user_id = auth.uid()
  )
);