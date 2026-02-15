
-- Tatum (Social Media Manager) conversation memory
CREATE TABLE public.tatum_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id),
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tatum_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.tatum_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  data_accessed JSONB,
  query_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Izzy (AI Chatter) conversation memory
CREATE TABLE public.izzy_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id),
  user_id UUID NOT NULL,
  creator_id UUID REFERENCES public.creators(id),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.izzy_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.izzy_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  data_accessed JSONB,
  query_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.tatum_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tatum_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.izzy_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.izzy_messages ENABLE ROW LEVEL SECURITY;

-- Tatum policies
CREATE POLICY "Users can view own tatum conversations" ON public.tatum_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tatum conversations" ON public.tatum_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tatum conversations" ON public.tatum_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tatum conversations" ON public.tatum_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tatum messages" ON public.tatum_messages FOR SELECT USING (conversation_id IN (SELECT id FROM public.tatum_conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can create own tatum messages" ON public.tatum_messages FOR INSERT WITH CHECK (conversation_id IN (SELECT id FROM public.tatum_conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own tatum messages" ON public.tatum_messages FOR DELETE USING (conversation_id IN (SELECT id FROM public.tatum_conversations WHERE user_id = auth.uid()));

-- Izzy policies
CREATE POLICY "Users can view own izzy conversations" ON public.izzy_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own izzy conversations" ON public.izzy_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own izzy conversations" ON public.izzy_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own izzy conversations" ON public.izzy_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own izzy messages" ON public.izzy_messages FOR SELECT USING (conversation_id IN (SELECT id FROM public.izzy_conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can create own izzy messages" ON public.izzy_messages FOR INSERT WITH CHECK (conversation_id IN (SELECT id FROM public.izzy_conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own izzy messages" ON public.izzy_messages FOR DELETE USING (conversation_id IN (SELECT id FROM public.izzy_conversations WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_tatum_conversations_user ON public.tatum_conversations(user_id);
CREATE INDEX idx_tatum_conversations_agency ON public.tatum_conversations(agency_id);
CREATE INDEX idx_tatum_messages_conversation ON public.tatum_messages(conversation_id);
CREATE INDEX idx_izzy_conversations_user ON public.izzy_conversations(user_id);
CREATE INDEX idx_izzy_conversations_agency ON public.izzy_conversations(agency_id);
CREATE INDEX idx_izzy_conversations_creator ON public.izzy_conversations(creator_id);
CREATE INDEX idx_izzy_messages_conversation ON public.izzy_messages(conversation_id);

-- Updated_at triggers
CREATE TRIGGER update_tatum_conversations_updated_at BEFORE UPDATE ON public.tatum_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_izzy_conversations_updated_at BEFORE UPDATE ON public.izzy_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
