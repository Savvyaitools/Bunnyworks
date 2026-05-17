
CREATE TABLE public.ai_browser_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  system_prompt text NOT NULL DEFAULT '',
  persona text,
  default_start_url text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_browser_agents_agency ON public.ai_browser_agents (agency_id, created_at DESC);
ALTER TABLE public.ai_browser_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agency read agents" ON public.ai_browser_agents FOR SELECT TO authenticated USING (agency_id = public.get_user_agency_id());
CREATE POLICY "agency insert agents" ON public.ai_browser_agents FOR INSERT TO authenticated WITH CHECK (agency_id = public.get_user_agency_id());
CREATE POLICY "agency update agents" ON public.ai_browser_agents FOR UPDATE TO authenticated USING (agency_id = public.get_user_agency_id());
CREATE POLICY "agency delete agents" ON public.ai_browser_agents FOR DELETE TO authenticated USING (agency_id = public.get_user_agency_id());
CREATE TRIGGER trg_ai_browser_agents_updated BEFORE UPDATE ON public.ai_browser_agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.browser_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  agent_id uuid REFERENCES public.ai_browser_agents(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  start_url text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_browser_workflows_agency ON public.browser_workflows (agency_id, created_at DESC);
CREATE INDEX idx_browser_workflows_agent ON public.browser_workflows (agent_id);
ALTER TABLE public.browser_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agency read workflows" ON public.browser_workflows FOR SELECT TO authenticated USING (agency_id = public.get_user_agency_id());
CREATE POLICY "agency insert workflows" ON public.browser_workflows FOR INSERT TO authenticated WITH CHECK (agency_id = public.get_user_agency_id());
CREATE POLICY "agency update workflows" ON public.browser_workflows FOR UPDATE TO authenticated USING (agency_id = public.get_user_agency_id());
CREATE POLICY "agency delete workflows" ON public.browser_workflows FOR DELETE TO authenticated USING (agency_id = public.get_user_agency_id());
CREATE TRIGGER trg_browser_workflows_updated BEFORE UPDATE ON public.browser_workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.browser_agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  agent_id uuid REFERENCES public.ai_browser_agents(id) ON DELETE SET NULL,
  workflow_id uuid REFERENCES public.browser_workflows(id) ON DELETE SET NULL,
  task text,
  status text NOT NULL DEFAULT 'pending',
  browserbase_session_id text,
  live_view_url text,
  result jsonb,
  logs jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_browser_agent_runs_agency ON public.browser_agent_runs (agency_id, created_at DESC);
CREATE INDEX idx_browser_agent_runs_agent ON public.browser_agent_runs (agent_id);
CREATE INDEX idx_browser_agent_runs_status ON public.browser_agent_runs (status) WHERE status IN ('pending','running');
ALTER TABLE public.browser_agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agency read runs" ON public.browser_agent_runs FOR SELECT TO authenticated USING (agency_id = public.get_user_agency_id());
CREATE POLICY "agency insert runs" ON public.browser_agent_runs FOR INSERT TO authenticated WITH CHECK (agency_id = public.get_user_agency_id());
CREATE POLICY "agency update runs" ON public.browser_agent_runs FOR UPDATE TO authenticated USING (agency_id = public.get_user_agency_id());
CREATE POLICY "agency delete runs" ON public.browser_agent_runs FOR DELETE TO authenticated USING (agency_id = public.get_user_agency_id());
CREATE TRIGGER trg_browser_agent_runs_updated BEFORE UPDATE ON public.browser_agent_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER PUBLICATION supabase_realtime ADD TABLE public.browser_agent_runs;
