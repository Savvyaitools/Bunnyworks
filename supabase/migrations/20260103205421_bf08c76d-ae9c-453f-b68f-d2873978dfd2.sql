-- Add commission_rate column to creators table
-- Nullable so it falls back to agency default when not set
ALTER TABLE public.creators 
ADD COLUMN commission_rate numeric DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.creators.commission_rate IS 'Custom commission rate for this creator. If NULL, uses agency default rate.';