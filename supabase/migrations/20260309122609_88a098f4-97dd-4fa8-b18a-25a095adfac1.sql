
-- Add creator_id column to of_fans
ALTER TABLE public.of_fans ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.creators(id) ON DELETE SET NULL;

-- Add creator_id column to of_chats  
ALTER TABLE public.of_chats ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.creators(id) ON DELETE SET NULL;

-- Backfill creator_id from creator_social_accounts mapping
UPDATE public.of_fans f
SET creator_id = csa.creator_id
FROM public.creator_social_accounts csa
WHERE f.of_account_id = csa.of_account_id
  AND f.creator_id IS NULL
  AND csa.creator_id IS NOT NULL;

UPDATE public.of_chats c
SET creator_id = csa.creator_id
FROM public.creator_social_accounts csa
WHERE c.of_account_id = csa.of_account_id
  AND c.creator_id IS NULL
  AND csa.creator_id IS NOT NULL;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_of_fans_creator_id ON public.of_fans(creator_id);
CREATE INDEX IF NOT EXISTS idx_of_chats_creator_id ON public.of_chats(creator_id);
