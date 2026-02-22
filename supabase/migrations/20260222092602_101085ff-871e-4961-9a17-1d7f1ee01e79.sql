
-- Agency-level proxy configurations (built-in recommendations + custom proxies)
CREATE TABLE public.agency_proxy_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  proxy_type TEXT NOT NULL DEFAULT 'residential' CHECK (proxy_type IN ('residential', 'datacenter', 'isp', 'mobile')),
  provider TEXT NOT NULL DEFAULT 'browserbase', -- 'browserbase', 'bright_data', 'custom'
  host TEXT,
  port INTEGER,
  username TEXT,
  password TEXT,
  protocol TEXT NOT NULL DEFAULT 'http' CHECK (protocol IN ('http', 'https', 'socks5')),
  country TEXT,
  state TEXT,
  city TEXT,
  is_rotating BOOLEAN NOT NULL DEFAULT true,
  sticky_session_ttl INTEGER, -- seconds for sticky sessions
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'down', 'unknown')),
  last_health_check_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add proxy_config_id to creators for per-creator proxy assignment
ALTER TABLE public.creators ADD COLUMN proxy_config_id UUID REFERENCES public.agency_proxy_configs(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.agency_proxy_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their agency proxy configs"
  ON public.agency_proxy_configs FOR SELECT
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can create proxy configs for their agency"
  ON public.agency_proxy_configs FOR INSERT
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can update their agency proxy configs"
  ON public.agency_proxy_configs FOR UPDATE
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can delete their agency proxy configs"
  ON public.agency_proxy_configs FOR DELETE
  USING (agency_id = public.get_user_agency_id());

-- Trigger for updated_at
CREATE TRIGGER update_agency_proxy_configs_updated_at
  BEFORE UPDATE ON public.agency_proxy_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for proxy health updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.agency_proxy_configs;
