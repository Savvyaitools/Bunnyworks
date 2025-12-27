-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Agency can view all notifications
CREATE POLICY "Agency can view all notifications" ON public.notifications
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'agency')
);

-- Agency can manage notifications (for marking as read, etc.)
CREATE POLICY "Agency can manage notifications" ON public.notifications
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'agency')
);

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Create function to generate notifications on key events
CREATE OR REPLACE FUNCTION public.create_task_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify when task is assigned
  IF NEW.assignee_id IS NOT NULL AND (OLD IS NULL OR OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.assignee_id,
      'New Task Assigned',
      'You have been assigned a new task: ' || NEW.title,
      'task',
      '/tasks'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for task notifications
CREATE TRIGGER on_task_assigned
AFTER INSERT OR UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.create_task_notification();