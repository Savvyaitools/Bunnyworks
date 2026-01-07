-- Add Hyperbeam-specific columns to creator_session_links
ALTER TABLE public.creator_session_links 
ADD COLUMN IF NOT EXISTS hyperbeam_session_id TEXT,
ADD COLUMN IF NOT EXISTS hyperbeam_admin_token TEXT,
ADD COLUMN IF NOT EXISTS hyperbeam_profile_id TEXT,
ADD COLUMN IF NOT EXISTS session_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMPTZ;

-- Add unique constraint for upsert operations
ALTER TABLE public.creator_session_links 
ADD CONSTRAINT creator_session_links_creator_platform_unique 
UNIQUE (creator_id, platform);

-- Create table for tracking active browser sessions
CREATE TABLE public.active_browser_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_link_id UUID REFERENCES public.creator_session_links(id) ON DELETE CASCADE,
  chatter_id UUID REFERENCES public.chatters(id) ON DELETE SET NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  hyperbeam_session_id TEXT NOT NULL,
  embed_url TEXT NOT NULL,
  admin_token TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  session_type TEXT DEFAULT 'chatter' CHECK (session_type IN ('admin', 'chatter')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.active_browser_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for active_browser_sessions
CREATE POLICY "Agency users can manage their browser sessions"
ON public.active_browser_sessions
FOR ALL
USING (agency_id = public.get_user_agency_id())
WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "Chatters can view their own active sessions"
ON public.active_browser_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chatters c
    WHERE c.id = chatter_id
    AND c.auth_user_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_active_browser_sessions_agency ON public.active_browser_sessions(agency_id);
CREATE INDEX idx_active_browser_sessions_active ON public.active_browser_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_active_browser_sessions_chatter ON public.active_browser_sessions(chatter_id);