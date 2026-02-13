
-- Add proxy geolocation fields to creators table
ALTER TABLE public.creators
ADD COLUMN IF NOT EXISTS proxy_country text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS proxy_state text DEFAULT NULL;

-- Create browser_session_events table for CAPTCHA alerts, logs, and session monitoring
CREATE TABLE public.browser_session_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  session_link_id uuid REFERENCES public.creator_session_links(id),
  active_session_id uuid REFERENCES public.active_browser_sessions(id),
  browserbase_session_id text NOT NULL,
  event_type text NOT NULL, -- 'captcha_detected', 'captcha_solved', 'error', 'page_load', 'session_warning'
  severity text DEFAULT 'info', -- 'info', 'warning', 'error'
  title text NOT NULL,
  message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.browser_session_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Agency users can view their browser session events"
ON public.browser_session_events
FOR SELECT
USING (agency_id = get_user_agency_id());

CREATE POLICY "Agency users can update their browser session events"
ON public.browser_session_events
FOR UPDATE
USING (agency_id = get_user_agency_id());

CREATE POLICY "System can insert browser session events"
ON public.browser_session_events
FOR INSERT
WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_browser_session_events_agency ON public.browser_session_events(agency_id, created_at DESC);
CREATE INDEX idx_browser_session_events_session ON public.browser_session_events(browserbase_session_id);

-- Add session recording fields to active_browser_sessions
ALTER TABLE public.active_browser_sessions
ADD COLUMN IF NOT EXISTS recording_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_recording boolean DEFAULT false;

-- Create browser_extensions table for managing uploaded extensions
CREATE TABLE public.browser_extensions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  name text NOT NULL,
  description text,
  browserbase_extension_id text, -- ID returned from Browserbase API
  is_active boolean DEFAULT true,
  auto_inject boolean DEFAULT false, -- auto-inject into all sessions
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.browser_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can manage their browser extensions"
ON public.browser_extensions
FOR ALL
USING (agency_id = get_user_agency_id())
WITH CHECK (agency_id = get_user_agency_id());
