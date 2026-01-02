-- Add explicit denial policy for anonymous users on creators table
-- This provides defense-in-depth by ensuring unauthenticated users cannot access sensitive creator data

CREATE POLICY "Deny anonymous access to creators"
ON public.creators
FOR ALL
TO anon
USING (false)
WITH CHECK (false);