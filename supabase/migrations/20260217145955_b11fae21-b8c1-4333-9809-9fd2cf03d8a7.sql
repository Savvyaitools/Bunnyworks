-- Default all creators to US residential proxy (California pinning)
UPDATE creators SET proxy_country = 'US' WHERE proxy_country IS NULL;
UPDATE creators SET proxy_state = 'california' WHERE proxy_state IS NULL;
ALTER TABLE creators ALTER COLUMN proxy_country SET DEFAULT 'US';
ALTER TABLE creators ALTER COLUMN proxy_state SET DEFAULT 'california';

-- Fix stuck "authenticating" sessions that have a last_saved_at (meaning context was persisted)
UPDATE creator_session_links 
SET session_status = 'authenticated' 
WHERE session_status = 'authenticating' 
  AND last_saved_at IS NOT NULL;