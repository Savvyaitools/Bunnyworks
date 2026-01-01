-- Allow creators to update their own tasks (for marking as complete)
CREATE POLICY "Creators can update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM creators c
    JOIN profiles p ON lower(p.email) = lower(c.email)
    WHERE p.id = auth.uid() AND c.id = tasks.creator_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM creators c
    JOIN profiles p ON lower(p.email) = lower(c.email)
    WHERE p.id = auth.uid() AND c.id = tasks.creator_id
  )
);