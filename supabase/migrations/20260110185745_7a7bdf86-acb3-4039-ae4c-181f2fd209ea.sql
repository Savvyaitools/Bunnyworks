-- Fix notifications table RLS to enforce agency tenancy

-- First, drop the overly permissive policies
DROP POLICY IF EXISTS "Agency can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Agency can view all notifications" ON public.notifications;

-- Create proper agency-scoped policies
-- Agency users can only view notifications for users in their agency
CREATE POLICY "Agency can view agency notifications" 
ON public.notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles viewer
    WHERE viewer.id = auth.uid()
    AND viewer.user_type = 'agency'
    AND EXISTS (
      SELECT 1 FROM profiles target
      WHERE target.id = notifications.user_id
      AND target.agency_id = viewer.agency_id
    )
  )
);

-- Agency users can manage (insert/update/delete) notifications for users in their agency
CREATE POLICY "Agency can manage agency notifications" 
ON public.notifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles viewer
    WHERE viewer.id = auth.uid()
    AND viewer.user_type = 'agency'
    AND EXISTS (
      SELECT 1 FROM profiles target
      WHERE target.id = notifications.user_id
      AND target.agency_id = viewer.agency_id
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles viewer
    WHERE viewer.id = auth.uid()
    AND viewer.user_type = 'agency'
    AND EXISTS (
      SELECT 1 FROM profiles target
      WHERE target.id = notifications.user_id
      AND target.agency_id = viewer.agency_id
    )
  )
);