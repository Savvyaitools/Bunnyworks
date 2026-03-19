
-- Create proxy provider enum
CREATE TYPE public.proxy_provider AS ENUM ('browserbase', 'brightdata', 'custom');

-- Create proxy protocol enum  
CREATE TYPE public.proxy_protocol AS ENUM ('http', 'socks5');

-- Create creator_proxy_configs table
CREATE TABLE public.creator_proxy_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  provider proxy_provider NOT NULL DEFAULT 'browserbase',
  proxy_host TEXT,
  proxy_port INTEGER,
  proxy_username TEXT,
  proxy_password TEXT,
  proxy_protocol proxy_protocol NOT NULL DEFAULT 'http',
  is_active BOOLEAN NOT NULL DEFAULT true,
  label TEXT,
  stealth_profile JSONB DEFAULT '{"enabled": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (creator_id)
);

-- Enable RLS
ALTER TABLE public.creator_proxy_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies scoped to agency
CREATE POLICY "Users can view their agency proxy configs"
  ON public.creator_proxy_configs FOR SELECT TO authenticated
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can insert proxy configs for their agency"
  ON public.creator_proxy_configs FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can update their agency proxy configs"
  ON public.creator_proxy_configs FOR UPDATE TO authenticated
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can delete their agency proxy configs"
  ON public.creator_proxy_configs FOR DELETE TO authenticated
  USING (agency_id = public.get_user_agency_id());

-- Auto-update updated_at
CREATE TRIGGER update_creator_proxy_configs_updated_at
  BEFORE UPDATE ON public.creator_proxy_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
