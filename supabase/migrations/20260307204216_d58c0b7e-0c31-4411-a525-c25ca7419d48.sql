-- Fix privilege escalation: Creator content_plans policy uses agency-level JOIN instead of direct ownership
DROP POLICY IF EXISTS "Creators can update their own content plans status and notes" ON public.content_plans;

CREATE POLICY "Creators can update their own content plans status and notes"
ON public.content_plans
FOR UPDATE
TO authenticated
USING (
  creator_id IN (
    SELECT c.id FROM creators c WHERE c.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  creator_id IN (
    SELECT c.id FROM creators c WHERE c.auth_user_id = auth.uid()
  )
);