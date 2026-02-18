
-- Table 1: creator_profile_warmups - tracks warmup run history
CREATE TABLE public.creator_profile_warmups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  browserbase_context_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  warmup_type TEXT NOT NULL DEFAULT 'generic' CHECK (warmup_type IN ('generic', 'research', 'full')),
  sites_visited INTEGER NOT NULL DEFAULT 0,
  total_sites INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_profile_warmups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agency warmups"
  ON public.creator_profile_warmups FOR SELECT
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can insert their agency warmups"
  ON public.creator_profile_warmups FOR INSERT
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can update their agency warmups"
  ON public.creator_profile_warmups FOR UPDATE
  USING (agency_id = public.get_user_agency_id());

CREATE INDEX idx_warmups_agency ON public.creator_profile_warmups(agency_id);
CREATE INDEX idx_warmups_creator ON public.creator_profile_warmups(creator_id);

-- Table 2: warmup_intelligence - stores scraped research data
CREATE TABLE public.warmup_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warmup_id UUID REFERENCES public.creator_profile_warmups(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  source_url TEXT,
  page_title TEXT,
  extracted_text TEXT,
  category TEXT NOT NULL DEFAULT 'trend' CHECK (category IN ('trend', 'competitor', 'strategy', 'niche_research', 'platform_update')),
  keywords TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.warmup_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agency intelligence"
  ON public.warmup_intelligence FOR SELECT
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can insert their agency intelligence"
  ON public.warmup_intelligence FOR INSERT
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE INDEX idx_intelligence_agency ON public.warmup_intelligence(agency_id);
CREATE INDEX idx_intelligence_category ON public.warmup_intelligence(category);

-- Table 3: pre_warmed_profiles - pool of pre-built browser contexts
CREATE TABLE public.pre_warmed_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  browserbase_context_id TEXT NOT NULL,
  warmup_count INTEGER NOT NULL DEFAULT 0,
  last_warmed_at TIMESTAMPTZ,
  assigned_creator_id UUID REFERENCES public.creators(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pre_warmed_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agency pre-warmed profiles"
  ON public.pre_warmed_profiles FOR SELECT
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can insert their agency pre-warmed profiles"
  ON public.pre_warmed_profiles FOR INSERT
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can update their agency pre-warmed profiles"
  ON public.pre_warmed_profiles FOR UPDATE
  USING (agency_id = public.get_user_agency_id());

CREATE INDEX idx_prewarm_agency ON public.pre_warmed_profiles(agency_id);
CREATE INDEX idx_prewarm_status ON public.pre_warmed_profiles(status);

-- Enable realtime for warmup progress tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_profile_warmups;
