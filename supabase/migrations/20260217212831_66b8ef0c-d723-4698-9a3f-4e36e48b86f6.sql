
-- Add viewer tracking to active_browser_sessions
ALTER TABLE public.active_browser_sessions 
  ADD COLUMN IF NOT EXISTS viewer_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS viewer_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz DEFAULT now();

-- Add session mode setting to agencies
ALTER TABLE public.agencies 
  ADD COLUMN IF NOT EXISTS browser_session_mode text NOT NULL DEFAULT 'shared';
-- Values: 'shared' (multiple chatters share one session), 'exclusive' (one at a time)
