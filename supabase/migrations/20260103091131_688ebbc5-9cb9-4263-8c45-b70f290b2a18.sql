-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Agency can manage events" ON public.calendar_events;
DROP POLICY IF EXISTS "Agency can view events" ON public.calendar_events;

-- Create permissive policies instead
CREATE POLICY "Agency users can manage calendar events" 
ON public.calendar_events 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'agency'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'agency'
  )
);