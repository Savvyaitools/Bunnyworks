-- Add OnlyFans API integration columns to creator_social_accounts
ALTER TABLE public.creator_social_accounts
ADD COLUMN IF NOT EXISTS of_account_id TEXT,
ADD COLUMN IF NOT EXISTS of_connected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS of_last_synced_at TIMESTAMP WITH TIME ZONE;