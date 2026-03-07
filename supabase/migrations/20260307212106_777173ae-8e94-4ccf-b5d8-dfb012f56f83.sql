-- Fix: notifications column is 'read' not 'is_read'
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);