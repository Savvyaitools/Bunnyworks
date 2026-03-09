
CREATE TABLE public.agency_api_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  api_key TEXT NOT NULL DEFAULT '',
  api_secret TEXT DEFAULT '',
  access_token TEXT DEFAULT '',
  additional_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id, platform)
);

ALTER TABLE public.agency_api_credentials ENABLE ROW LEVEL SECURITY;

-- Only agency owners can manage their own credentials
CREATE POLICY "Agency owners can manage their API credentials"
  ON public.agency_api_credentials
  FOR ALL
  TO authenticated
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

-- Trigger to update updated_at
CREATE TRIGGER update_agency_api_credentials_updated_at
  BEFORE UPDATE ON public.agency_api_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
