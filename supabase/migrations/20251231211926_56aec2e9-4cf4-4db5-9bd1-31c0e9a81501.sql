-- 1) Create recruitment notification trigger
CREATE OR REPLACE FUNCTION public.create_recruiting_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT p.id, 'New Recruitment Lead', 'New prospect added: ' || NEW.name, 'recruitment', '/recruiting'
  FROM profiles p WHERE p.user_type = 'agency';
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_recruiting_creator_added
  AFTER INSERT ON public.recruiting_creators
  FOR EACH ROW
  EXECUTE FUNCTION public.create_recruiting_notification();

-- 2) Create goals table for progress tracking
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 100,
  current_value INTEGER NOT NULL DEFAULT 0,
  goal_type TEXT NOT NULL DEFAULT 'tasks',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency can manage goals"
ON public.goals
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
  )
);

CREATE POLICY "Agency can view goals"
ON public.goals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
  )
);

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Add content_type column to content_files
ALTER TABLE public.content_files ADD COLUMN content_type TEXT DEFAULT 'general';