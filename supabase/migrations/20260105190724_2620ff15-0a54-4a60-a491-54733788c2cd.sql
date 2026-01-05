-- Create browser sync tokens table for temporary authentication
CREATE TABLE public.browser_sync_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.browser_sync_tokens ENABLE ROW LEVEL SECURITY;

-- Agency users can manage their own tokens
CREATE POLICY "Users can view own agency tokens"
ON public.browser_sync_tokens
FOR SELECT
TO authenticated
USING (agency_id = get_user_agency_id());

CREATE POLICY "Users can insert own agency tokens"
ON public.browser_sync_tokens
FOR INSERT
TO authenticated
WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Users can delete own agency tokens"
ON public.browser_sync_tokens
FOR DELETE
TO authenticated
USING (agency_id = get_user_agency_id());

-- Add columns to data_imports for browser sync
ALTER TABLE public.data_imports 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'upload',
ADD COLUMN IF NOT EXISTS raw_payload JSONB;

-- Add browser_sync_enabled to agencies table
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS browser_sync_enabled BOOLEAN DEFAULT false;

-- Index for token lookup
CREATE INDEX idx_browser_sync_tokens_token ON public.browser_sync_tokens(token);
CREATE INDEX idx_browser_sync_tokens_expires ON public.browser_sync_tokens(expires_at);