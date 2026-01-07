-- Migrate from Hyperbeam to Browserbase: rename and add columns

-- Update creator_session_links table
ALTER TABLE creator_session_links 
  RENAME COLUMN hyperbeam_session_id TO browserbase_session_id;

ALTER TABLE creator_session_links 
  RENAME COLUMN hyperbeam_profile_id TO browserbase_context_id;

ALTER TABLE creator_session_links 
  DROP COLUMN IF EXISTS hyperbeam_admin_token;

ALTER TABLE creator_session_links 
  ADD COLUMN IF NOT EXISTS browserbase_live_url TEXT;

-- Update active_browser_sessions table
ALTER TABLE active_browser_sessions 
  RENAME COLUMN hyperbeam_session_id TO browserbase_session_id;

ALTER TABLE active_browser_sessions 
  DROP COLUMN IF EXISTS admin_token;

ALTER TABLE active_browser_sessions 
  ADD COLUMN IF NOT EXISTS browserbase_live_url TEXT;