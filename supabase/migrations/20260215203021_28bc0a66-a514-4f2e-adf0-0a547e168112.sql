
-- Persistent memory system for AI agents
CREATE TABLE public.agent_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('coach_pbf', 'tatum', 'izzy')),
  category TEXT NOT NULL CHECK (category IN ('user_preference', 'business_context', 'action_history', 'relationship', 'general')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  importance INTEGER NOT NULL DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_agent_memories_agency_agent ON public.agent_memories (agency_id, agent_type);
CREATE INDEX idx_agent_memories_category ON public.agent_memories (agency_id, agent_type, category);
CREATE INDEX idx_agent_memories_importance ON public.agent_memories (agency_id, agent_type, importance DESC);

-- RLS
ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agency memories"
  ON public.agent_memories FOR SELECT
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can insert own agency memories"
  ON public.agent_memories FOR INSERT
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can update own agency memories"
  ON public.agent_memories FOR UPDATE
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can delete own agency memories"
  ON public.agent_memories FOR DELETE
  USING (agency_id = public.get_user_agency_id());

-- Auto-update timestamp trigger
CREATE TRIGGER update_agent_memories_updated_at
  BEFORE UPDATE ON public.agent_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
