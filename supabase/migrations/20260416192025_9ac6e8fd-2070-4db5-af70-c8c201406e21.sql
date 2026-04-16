-- Allow agency owners to delete messages within their agency
CREATE POLICY "Agency can delete own messages"
ON public.messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'agency'
  )
  AND agency_id = public.get_user_agency_id()
);

-- Allow creators to delete their OWN sent messages
CREATE POLICY "Creators can delete their own sent messages"
ON public.messages
FOR DELETE
USING (
  sender_type = 'creator'
  AND EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.auth_user_id = auth.uid()
      AND messages.conversation_id = concat('creator-', c.id)
  )
);

-- Allow assigned managers to delete messages in their creator conversations
CREATE POLICY "Managers can delete assigned creator messages"
ON public.messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.user_type = 'employee'
  )
  AND EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.creators c ON c.manager_id = e.id
    WHERE e.auth_user_id = auth.uid()
      AND messages.conversation_id = concat('creator-', c.id)
      AND e.role <> 'Chatter'
  )
);