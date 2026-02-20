-- Add creator_notes column to content_plans
ALTER TABLE public.content_plans ADD COLUMN creator_notes text;

-- Allow creators to update status (board_column) and add notes on their own plans
CREATE POLICY "Creators can update their own content plans status and notes"
ON public.content_plans
FOR UPDATE
USING (
  creator_id IN (
    SELECT c.id FROM public.creators c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid() AND p.user_type = 'creator'
  )
)
WITH CHECK (
  creator_id IN (
    SELECT c.id FROM public.creators c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid() AND p.user_type = 'creator'
  )
);