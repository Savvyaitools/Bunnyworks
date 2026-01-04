-- Add import_id column to creator_earnings for proper cascade deletion
ALTER TABLE public.creator_earnings 
ADD COLUMN import_id uuid REFERENCES public.data_imports(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_creator_earnings_import_id ON public.creator_earnings(import_id);

-- Add comment for documentation
COMMENT ON COLUMN public.creator_earnings.import_id IS 'Links earnings to the source data import for automatic cascade deletion';