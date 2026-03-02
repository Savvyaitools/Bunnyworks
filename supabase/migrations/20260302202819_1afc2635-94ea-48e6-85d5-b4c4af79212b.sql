-- Add media_url column for workflow/directions attachments
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS media_url text DEFAULT NULL;

-- Add portal_visible column (defaults false - tasks are internal by default)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS portal_visible boolean DEFAULT false;