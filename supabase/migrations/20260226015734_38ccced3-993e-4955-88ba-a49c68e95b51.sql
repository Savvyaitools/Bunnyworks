
-- Drop the unused agency_proxy_configs table
DROP TABLE IF EXISTS public.agency_proxy_configs CASCADE;

-- Add proxy_city column to creators table for city-level geo targeting
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS proxy_city TEXT DEFAULT NULL;
