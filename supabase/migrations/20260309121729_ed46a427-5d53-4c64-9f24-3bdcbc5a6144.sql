-- Fix profiles INSERT escalation: The handle_new_user trigger (SECURITY DEFINER)
-- creates profiles automatically. Block direct client inserts entirely.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Only service_role (trigger) can insert profiles
CREATE POLICY "Only service role can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK ((select auth.role()) = 'service_role');