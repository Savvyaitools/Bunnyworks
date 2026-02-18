
-- Add GHL payment tracking columns to agencies
ALTER TABLE public.agencies 
ADD COLUMN IF NOT EXISTS ghl_contact_id text,
ADD COLUMN IF NOT EXISTS ghl_location_id text,
ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trialing',
ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz,
ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz,
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now() + interval '14 days');

-- Create payment events log table
CREATE TABLE public.payment_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid REFERENCES public.agencies(id),
  event_type text NOT NULL,
  ghl_order_id text,
  ghl_subscription_id text,
  amount numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owners can view own payment events"
ON public.payment_events FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "System can insert payment events"
ON public.payment_events FOR INSERT
WITH CHECK (true);

-- Index for lookups
CREATE INDEX idx_payment_events_agency ON public.payment_events(agency_id);
CREATE INDEX idx_payment_events_ghl_order ON public.payment_events(ghl_order_id);
