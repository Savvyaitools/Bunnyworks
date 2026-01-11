-- Add health tracking columns to creator_social_accounts
ALTER TABLE creator_social_accounts
ADD COLUMN IF NOT EXISTS of_connection_status TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS of_last_error TEXT,
ADD COLUMN IF NOT EXISTS of_last_error_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS of_sync_retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS of_next_retry_at TIMESTAMPTZ;

-- Add check constraint for valid status values
ALTER TABLE creator_social_accounts
DROP CONSTRAINT IF EXISTS of_connection_status_check;

ALTER TABLE creator_social_accounts
ADD CONSTRAINT of_connection_status_check 
CHECK (of_connection_status IN ('healthy', 'expired', 'error', 'unknown'));

-- Create sync logs table for tracking sync attempts
CREATE TABLE IF NOT EXISTS of_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID REFERENCES creator_social_accounts(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  items_synced INTEGER DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add check constraints for sync_type and status
ALTER TABLE of_sync_logs
ADD CONSTRAINT sync_type_check CHECK (sync_type IN ('manual', 'scheduled', 'retry')),
ADD CONSTRAINT status_check CHECK (status IN ('success', 'failed', 'partial'));

-- Enable RLS on of_sync_logs
ALTER TABLE of_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for of_sync_logs
CREATE POLICY "Agency members can view their sync logs"
ON of_sync_logs FOR SELECT
USING (agency_id = get_user_agency_id());

CREATE POLICY "System can insert sync logs"
ON of_sync_logs FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_of_sync_logs_social_account ON of_sync_logs(social_account_id);
CREATE INDEX IF NOT EXISTS idx_of_sync_logs_created_at ON of_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_social_accounts_connection_status ON creator_social_accounts(of_connection_status);
CREATE INDEX IF NOT EXISTS idx_creator_social_accounts_next_retry ON creator_social_accounts(of_next_retry_at) WHERE of_connection_status = 'error';