
-- Add structured columns to warmup_intelligence for Stagehand extract() data
ALTER TABLE public.warmup_intelligence 
  ADD COLUMN IF NOT EXISTS key_takeaways text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS statistics text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS engagement_metrics jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'raw';
