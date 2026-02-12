
-- Agent Runs: logs every orchestrator execution
CREATE TABLE public.agent_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL, -- 'sentinel', 'herald', 'scholar'
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  actions_taken INTEGER NOT NULL DEFAULT 0,
  data_snapshot JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can view their agent runs"
  ON public.agent_runs FOR SELECT
  USING (agency_id = get_user_agency_id());

-- Agent Actions: individual actions taken by agents
CREATE TABLE public.agent_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'create_alert', 'assign_task', 'send_notification', 'update_goal'
  target_entity_type TEXT, -- 'creator', 'employee', 'task', etc.
  target_entity_id UUID,
  parameters JSONB DEFAULT '{}'::jsonb,
  outcome TEXT, -- 'success', 'failed', 'skipped'
  outcome_details TEXT,
  was_overridden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can view their agent actions"
  ON public.agent_actions FOR SELECT
  USING (agency_id = get_user_agency_id());

CREATE POLICY "Agency users can update agent actions"
  ON public.agent_actions FOR UPDATE
  USING (agency_id = get_user_agency_id());

-- Agent Goals: configurable goals per agency
CREATE TABLE public.agent_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  metric TEXT NOT NULL, -- 'monthly_revenue', 'task_completion_rate', 'response_time', etc.
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT '', -- '$', '%', 'minutes', etc.
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can manage their agent goals"
  ON public.agent_goals FOR ALL
  USING (agency_id = get_user_agency_id())
  WITH CHECK (agency_id = get_user_agency_id());

-- Agent Feedback: owner feedback on agent actions
CREATE TABLE public.agent_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES public.agent_actions(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating IN (-1, 1)), -- thumbs down / thumbs up
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can manage their agent feedback"
  ON public.agent_feedback FOR ALL
  USING (agency_id = get_user_agency_id())
  WITH CHECK (agency_id = get_user_agency_id());

-- Indexes for performance
CREATE INDEX idx_agent_runs_agency_type ON public.agent_runs(agency_id, agent_type);
CREATE INDEX idx_agent_runs_created ON public.agent_runs(created_at DESC);
CREATE INDEX idx_agent_actions_run ON public.agent_actions(run_id);
CREATE INDEX idx_agent_actions_agency ON public.agent_actions(agency_id, created_at DESC);
CREATE INDEX idx_agent_goals_agency ON public.agent_goals(agency_id, is_active);
CREATE INDEX idx_agent_feedback_action ON public.agent_feedback(action_id);
