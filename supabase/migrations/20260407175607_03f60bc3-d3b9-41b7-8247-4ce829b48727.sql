
-- 1. Create a security-definer function for public agency lookup
CREATE OR REPLACE FUNCTION public.get_agency_public_info(agency_uuid uuid)
RETURNS TABLE(id uuid, name text, logo_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT a.id, a.name, a.logo_url
  FROM public.agencies a
  WHERE a.id = agency_uuid;
$$;

-- Grant execute to anon so unauthenticated users can call it
GRANT EXECUTE ON FUNCTION public.get_agency_public_info(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_agency_public_info(uuid) TO authenticated;

-- 2. Enable RLS on chatter_auto_reply_rules
ALTER TABLE public.chatter_auto_reply_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can manage own auto reply rules"
ON public.chatter_auto_reply_rules
FOR ALL
TO authenticated
USING (agency_id = get_user_agency_id())
WITH CHECK (agency_id = get_user_agency_id());

-- 3. Enable RLS on chatter_message_log
ALTER TABLE public.chatter_message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can manage own message logs"
ON public.chatter_message_log
FOR ALL
TO authenticated
USING (agency_id = get_user_agency_id())
WITH CHECK (agency_id = get_user_agency_id());

-- Service role needs insert access for edge functions
CREATE POLICY "Service role full access to message logs"
ON public.chatter_message_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to auto reply rules"
ON public.chatter_auto_reply_rules
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Enable RLS on warmup_intelligence (policies already exist)
ALTER TABLE public.warmup_intelligence ENABLE ROW LEVEL SECURITY;
