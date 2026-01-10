-- Add auth_user_id column to creators table for agency-managed login accounts
ALTER TABLE creators ADD COLUMN auth_user_id uuid REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX idx_creators_auth_user_id ON creators(auth_user_id);