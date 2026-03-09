-- Fix 2: of_cache - replace fully permissive policy with service_role only
-- Client code should access cache via edge functions, not directly
DROP POLICY IF EXISTS "Allow all operations on of_cache" ON public.of_cache;

CREATE POLICY "Service role full access to of_cache"
ON public.of_cache FOR ALL
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');