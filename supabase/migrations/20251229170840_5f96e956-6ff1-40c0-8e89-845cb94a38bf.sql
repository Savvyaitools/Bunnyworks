-- Add RLS policies for creators to send and receive messages

-- Allow creators to send messages (they identify via their email matching a creator record)
CREATE POLICY "Creators can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_type = 'creator' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.user_type = 'creator'
  )
);

-- Allow creators to view messages in their conversations
CREATE POLICY "Creators can view their messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.user_type = 'creator'
  ) AND (
    -- Creator conversations use the creator's user ID as conversation_id
    conversation_id = CONCAT('creator-', (
      SELECT c.id FROM creators c
      JOIN profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    ))
  )
);

-- Allow creators to update (mark as read) their messages
CREATE POLICY "Creators can update their messages"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.user_type = 'creator'
  ) AND (
    conversation_id = CONCAT('creator-', (
      SELECT c.id FROM creators c
      JOIN profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    ))
  )
);

-- Add RLS policy for creators to view their own tasks
CREATE POLICY "Creators can view their own tasks"
ON public.tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM creators c
    JOIN profiles p ON p.email = c.email
    WHERE p.id = auth.uid() AND c.id = tasks.creator_id
  )
);

-- Add RLS policy for creators to view their own invoices
CREATE POLICY "Creators can view their own invoices"
ON public.invoices
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM creators c
    JOIN profiles p ON p.email = c.email
    WHERE p.id = auth.uid() AND c.id = invoices.creator_id
  )
);

-- Add RLS policy for creators to view their own earnings
CREATE POLICY "Creators can view their own earnings"
ON public.creator_earnings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM creators c
    JOIN profiles p ON p.email = c.email
    WHERE p.id = auth.uid() AND c.id = creator_earnings.creator_id
  )
);

-- Add RLS policy for creators to view their own content plans
CREATE POLICY "Creators can view their own content plans"
ON public.content_plans
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM creators c
    JOIN profiles p ON p.email = c.email
    WHERE p.id = auth.uid() AND c.id = content_plans.creator_id
  )
);