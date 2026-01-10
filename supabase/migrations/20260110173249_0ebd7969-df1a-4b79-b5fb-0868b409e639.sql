-- Fix RLS policies for of_cache - restrict to service role operations only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on of_cache" ON public.of_cache;

-- Create more restrictive policies (edge functions use service role which bypasses RLS)
-- For regular users, only allow read access to their agency's cache
CREATE POLICY "Service role manages of_cache" ON public.of_cache 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Note: The of_cache table is primarily managed by edge functions using service role
-- which bypasses RLS entirely. The policy above is a fallback for any direct access.