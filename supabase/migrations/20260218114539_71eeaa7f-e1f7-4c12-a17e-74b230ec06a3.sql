
-- Replace the overly permissive INSERT policy with a service-role-only approach
DROP POLICY IF EXISTS "System can insert payment events" ON public.payment_events;

-- Only authenticated agency owners can insert their own payment events (edge functions use service role which bypasses RLS)
CREATE POLICY "No direct insert for payment events"
ON public.payment_events FOR INSERT
WITH CHECK (false);
