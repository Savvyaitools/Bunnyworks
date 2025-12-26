-- Create messages table for real-time chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('agency', 'creator')),
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (will be scoped when auth is added)
CREATE POLICY "Anyone can view messages"
  ON public.messages
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update messages"
  ON public.messages
  FOR UPDATE
  USING (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;