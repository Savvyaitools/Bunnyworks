-- Add onboarding_step column to track wizard progress
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN agencies.onboarding_step IS 'Tracks the current step in the onboarding wizard (1-8)';