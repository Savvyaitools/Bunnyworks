-- Create cache table for general API responses
CREATE TABLE public.of_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  of_account_id TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(of_account_id, cache_key)
);

-- Create persistent fan data table
CREATE TABLE public.of_fans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  of_account_id TEXT NOT NULL,
  of_fan_id TEXT NOT NULL,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  subscribed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  total_spent NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  renew_on BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(of_account_id, of_fan_id)
);

-- Create chat list cache table
CREATE TABLE public.of_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  of_account_id TEXT NOT NULL,
  of_chat_id TEXT NOT NULL,
  of_fan_id TEXT,
  fan_name TEXT,
  fan_username TEXT,
  fan_avatar TEXT,
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_is_from_me BOOLEAN,
  unread_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(of_account_id, of_chat_id)
);

-- Create indexes for fast lookups
CREATE INDEX idx_of_cache_account_key ON public.of_cache(of_account_id, cache_key);
CREATE INDEX idx_of_cache_expires ON public.of_cache(expires_at);
CREATE INDEX idx_of_fans_account ON public.of_fans(of_account_id);
CREATE INDEX idx_of_fans_active ON public.of_fans(of_account_id, is_active);
CREATE INDEX idx_of_fans_agency ON public.of_fans(agency_id);
CREATE INDEX idx_of_chats_account ON public.of_chats(of_account_id);
CREATE INDEX idx_of_chats_agency ON public.of_chats(agency_id);
CREATE INDEX idx_of_chats_last_message ON public.of_chats(of_account_id, last_message_at DESC);

-- Enable RLS
ALTER TABLE public.of_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.of_fans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.of_chats ENABLE ROW LEVEL SECURITY;

-- RLS policies for of_cache (edge functions use service role, so permissive for now)
CREATE POLICY "Allow all operations on of_cache" ON public.of_cache FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for of_fans
CREATE POLICY "Users can view of_fans for their agency" ON public.of_fans 
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage of_fans for their agency" ON public.of_fans 
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  );

-- RLS policies for of_chats
CREATE POLICY "Users can view of_chats for their agency" ON public.of_chats 
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage of_chats for their agency" ON public.of_chats 
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  );

-- Function to clean expired cache entries (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_of_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.of_cache WHERE expires_at < now();
END;
$$;