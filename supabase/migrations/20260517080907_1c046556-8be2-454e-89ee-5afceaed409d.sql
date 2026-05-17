-- Purge dead browser-automation surface
DROP FUNCTION IF EXISTS public.enqueue_scrape_jobs() CASCADE;
DROP FUNCTION IF EXISTS public.claim_scrape_jobs(text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.complete_scrape_job(uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.fail_scrape_job(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.recover_stale_scrape_jobs() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_scrape_jobs() CASCADE;

DROP TABLE IF EXISTS public.scrape_jobs CASCADE;
DROP TABLE IF EXISTS public.browser_session_events CASCADE;
DROP TABLE IF EXISTS public.active_browser_sessions CASCADE;
DROP TABLE IF EXISTS public.pre_warmed_profiles CASCADE;
DROP TABLE IF EXISTS public.creator_profile_warmups CASCADE;
DROP TABLE IF EXISTS public.session_access_logs CASCADE;
DROP TABLE IF EXISTS public.session_link_assignments CASCADE;
DROP TABLE IF EXISTS public.creator_session_links CASCADE;