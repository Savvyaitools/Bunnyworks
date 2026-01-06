-- Create table for storing encrypted session links
CREATE TABLE public.creator_session_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('onlyfans', 'fansly')),
  encrypted_session TEXT NOT NULL,
  created_by UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for tracking session link assignments to chatters
CREATE TABLE public.session_link_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_link_id UUID NOT NULL REFERENCES public.creator_session_links(id) ON DELETE CASCADE,
  chatter_id UUID NOT NULL REFERENCES public.chatters(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.chatter_shifts(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_access_ip TEXT,
  UNIQUE(session_link_id, chatter_id)
);

-- Create table for audit logging session access
CREATE TABLE public.session_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_link_id UUID NOT NULL REFERENCES public.creator_session_links(id) ON DELETE CASCADE,
  chatter_id UUID NOT NULL REFERENCES public.chatters(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('access', 'launch', 'revoke', 'expire')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.creator_session_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_link_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_session_links
-- Agency users can manage session links for their agency
CREATE POLICY "Agency users can view their session links"
ON public.creator_session_links
FOR SELECT
USING (agency_id = get_user_agency_id());

CREATE POLICY "Agency users can create session links"
ON public.creator_session_links
FOR INSERT
WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Agency users can update their session links"
ON public.creator_session_links
FOR UPDATE
USING (agency_id = get_user_agency_id());

CREATE POLICY "Agency users can delete their session links"
ON public.creator_session_links
FOR DELETE
USING (agency_id = get_user_agency_id());

-- RLS Policies for session_link_assignments
-- Agency users can manage assignments for their sessions
CREATE POLICY "Agency users can view assignments for their sessions"
ON public.session_link_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creator_session_links csl
    WHERE csl.id = session_link_id
    AND csl.agency_id = get_user_agency_id()
  )
);

-- Chatters can view their own assignments
CREATE POLICY "Chatters can view their own assignments"
ON public.session_link_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chatters c
    WHERE c.id = chatter_id
    AND c.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Agency users can create assignments"
ON public.session_link_assignments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.creator_session_links csl
    WHERE csl.id = session_link_id
    AND csl.agency_id = get_user_agency_id()
  )
);

CREATE POLICY "Agency users can update assignments"
ON public.session_link_assignments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.creator_session_links csl
    WHERE csl.id = session_link_id
    AND csl.agency_id = get_user_agency_id()
  )
);

CREATE POLICY "Agency users can delete assignments"
ON public.session_link_assignments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.creator_session_links csl
    WHERE csl.id = session_link_id
    AND csl.agency_id = get_user_agency_id()
  )
);

-- RLS Policies for session_access_logs
CREATE POLICY "Agency users can view access logs for their sessions"
ON public.session_access_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creator_session_links csl
    WHERE csl.id = session_link_id
    AND csl.agency_id = get_user_agency_id()
  )
);

CREATE POLICY "System can insert access logs"
ON public.session_access_logs
FOR INSERT
WITH CHECK (true);

-- Add updated_at trigger for creator_session_links
CREATE TRIGGER update_creator_session_links_updated_at
BEFORE UPDATE ON public.creator_session_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_session_links_creator ON public.creator_session_links(creator_id);
CREATE INDEX idx_session_links_agency ON public.creator_session_links(agency_id);
CREATE INDEX idx_session_links_active ON public.creator_session_links(is_active, expires_at);
CREATE INDEX idx_session_assignments_link ON public.session_link_assignments(session_link_id);
CREATE INDEX idx_session_assignments_chatter ON public.session_link_assignments(chatter_id);
CREATE INDEX idx_session_logs_link ON public.session_access_logs(session_link_id);
CREATE INDEX idx_session_logs_chatter ON public.session_access_logs(chatter_id);