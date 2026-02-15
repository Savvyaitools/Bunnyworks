-- Add board_column and board_position to content_plans for Kanban board support
ALTER TABLE public.content_plans 
  ADD COLUMN board_column text NOT NULL DEFAULT 'to_do',
  ADD COLUMN board_position integer NOT NULL DEFAULT 0;

-- Create index for efficient column+position queries
CREATE INDEX idx_content_plans_board ON public.content_plans (creator_id, board_column, board_position);
