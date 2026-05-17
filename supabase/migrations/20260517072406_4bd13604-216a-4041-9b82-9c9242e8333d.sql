ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS of_sync_frequency_hours integer NOT NULL DEFAULT 24;

ALTER TABLE public.agencies
  ADD CONSTRAINT agencies_of_sync_frequency_hours_check
  CHECK (of_sync_frequency_hours >= 0 AND of_sync_frequency_hours <= 168);

CREATE INDEX IF NOT EXISTS idx_csa_of_last_synced_at
  ON public.creator_social_accounts (of_last_synced_at)
  WHERE of_account_id IS NOT NULL;