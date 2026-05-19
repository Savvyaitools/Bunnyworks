-- Deduplicate any existing rows (keep the most recently connected/created)
DELETE FROM public.creator_social_accounts a
USING public.creator_social_accounts b
WHERE a.creator_id = b.creator_id
  AND lower(a.platform) = lower(b.platform)
  AND a.id < b.id;

-- Normalize platform casing so the unique constraint is effective
UPDATE public.creator_social_accounts SET platform = lower(platform) WHERE platform <> lower(platform);

CREATE UNIQUE INDEX IF NOT EXISTS creator_social_accounts_creator_platform_key
  ON public.creator_social_accounts (creator_id, platform);

ALTER TABLE public.creator_social_accounts
  ADD CONSTRAINT creator_social_accounts_creator_platform_unique UNIQUE USING INDEX creator_social_accounts_creator_platform_key;