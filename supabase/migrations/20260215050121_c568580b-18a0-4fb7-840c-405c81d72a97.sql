
-- Conversations table for Coach PBF
CREATE TABLE public.coach_pbf_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  user_id uuid NOT NULL,
  title text DEFAULT 'New Conversation',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Messages table
CREATE TABLE public.coach_pbf_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.coach_pbf_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  query_type text,
  data_accessed jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.coach_pbf_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_pbf_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can manage their conversations"
ON public.coach_pbf_conversations FOR ALL
USING (agency_id = get_user_agency_id())
WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Users can manage messages in their conversations"
ON public.coach_pbf_messages FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.coach_pbf_conversations c
  WHERE c.id = coach_pbf_messages.conversation_id
  AND c.agency_id = get_user_agency_id()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.coach_pbf_conversations c
  WHERE c.id = coach_pbf_messages.conversation_id
  AND c.agency_id = get_user_agency_id()
));

-- Indexes
CREATE INDEX idx_coach_pbf_conversations_agency ON public.coach_pbf_conversations(agency_id);
CREATE INDEX idx_coach_pbf_messages_conversation ON public.coach_pbf_messages(conversation_id);

-- Updated_at trigger
CREATE TRIGGER update_coach_pbf_conversations_updated_at
BEFORE UPDATE ON public.coach_pbf_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
