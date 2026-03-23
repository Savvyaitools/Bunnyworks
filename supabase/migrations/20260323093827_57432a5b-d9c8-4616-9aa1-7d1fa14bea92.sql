
ALTER TABLE public.creator_social_accounts 
  ADD COLUMN IF NOT EXISTS engagement_rate numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS avg_likes integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS avg_comments integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS posts_count integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz DEFAULT NULL;
