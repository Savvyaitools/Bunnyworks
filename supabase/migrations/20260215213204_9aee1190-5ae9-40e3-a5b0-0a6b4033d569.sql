-- Allow chatters to view creator_session_links for creators they are assigned to
CREATE POLICY "Chatters can view assigned creator sessions"
ON public.creator_session_links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.session_link_assignments sla
    JOIN public.chatters c ON c.id = sla.chatter_id
    WHERE sla.session_link_id = creator_session_links.id
      AND c.auth_user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.creator_assignments ca
    JOIN public.chatters c ON c.id = ca.chatter_id
    WHERE ca.creator_id = creator_session_links.creator_id
      AND c.auth_user_id = auth.uid()
  )
);