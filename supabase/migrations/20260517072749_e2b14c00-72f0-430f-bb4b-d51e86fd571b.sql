-- Campaigns table
CREATE TABLE IF NOT EXISTS public.of_mass_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  of_account_id text NOT NULL,
  created_by uuid,
  text text,
  price numeric NOT NULL DEFAULT 0,
  is_ppv boolean NOT NULL DEFAULT false,
  audience_type text NOT NULL,
  audience_meta jsonb,
  total_recipients integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_of_mass_campaigns_agency ON public.of_mass_campaigns(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_of_mass_campaigns_account ON public.of_mass_campaigns(of_account_id);

ALTER TABLE public.of_mass_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency members can view campaigns" ON public.of_mass_campaigns;
CREATE POLICY "Agency members can view campaigns"
  ON public.of_mass_campaigns FOR SELECT TO authenticated
  USING (agency_id = public.get_user_agency_id());

DROP POLICY IF EXISTS "Agency members can insert campaigns" ON public.of_mass_campaigns;
CREATE POLICY "Agency members can insert campaigns"
  ON public.of_mass_campaigns FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.get_user_agency_id());

DROP POLICY IF EXISTS "Agency members can update campaigns" ON public.of_mass_campaigns;
CREATE POLICY "Agency members can update campaigns"
  ON public.of_mass_campaigns FOR UPDATE TO authenticated
  USING (agency_id = public.get_user_agency_id());

-- of_messages extensions
ALTER TABLE public.of_messages
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.of_mass_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS error_message text;

CREATE INDEX IF NOT EXISTS idx_of_messages_campaign ON public.of_messages(campaign_id) WHERE campaign_id IS NOT NULL;