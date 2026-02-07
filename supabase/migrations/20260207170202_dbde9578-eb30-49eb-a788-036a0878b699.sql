
-- =============================================
-- FIX 1: Agencies - Replace blanket public read with a restricted view
-- =============================================

-- Create a restricted view exposing ONLY id, name, logo_url for public application forms
CREATE VIEW public.agencies_public AS
SELECT id, name, logo_url FROM public.agencies;

-- Grant anon and authenticated access to the view
GRANT SELECT ON public.agencies_public TO anon;
GRANT SELECT ON public.agencies_public TO authenticated;

-- Drop the overly permissive anon policy on the actual table
DROP POLICY IF EXISTS "Public can view agency name and logo for applications" ON public.agencies;

-- =============================================
-- FIX 2: of_cache - Lock down to authenticated users only (no agency_id column)
-- =============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role manages of_cache" ON public.of_cache;

-- Only authenticated users can read/manage cache (edge functions use service role key which bypasses RLS)
CREATE POLICY "Authenticated users can read of_cache"
  ON public.of_cache
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage of_cache"
  ON public.of_cache
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to of_cache"
  ON public.of_cache
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- =============================================
-- FIX 3: ai_knowledge_base - Restrict to authenticated users only
-- =============================================

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can read knowledge base" ON public.ai_knowledge_base;

-- Only authenticated users can read
CREATE POLICY "Authenticated users can read knowledge base"
  ON public.ai_knowledge_base
  FOR SELECT
  TO authenticated
  USING (true);

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to ai_knowledge_base"
  ON public.ai_knowledge_base
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- =============================================
-- FIX 4: Creators - Strengthen cross-agency isolation
-- =============================================

-- Replace email-based matching with auth_user_id + explicit agency_id check
DROP POLICY IF EXISTS "Creators can view own creator record" ON public.creators;

CREATE POLICY "Creators can view own creator record"
  ON public.creators
  FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR agency_id = public.get_user_agency_id()
  );
