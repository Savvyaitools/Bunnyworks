import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "./useAgency";
import { toast } from "sonner";

export type BrowserAgent = {
  id: string;
  agency_id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  persona: string | null;
  default_start_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type WorkflowStep = {
  type: "goto" | "act" | "extract" | "wait";
  value: string;
  schema?: unknown;
  ms?: number;
};

export type BrowserWorkflow = {
  id: string;
  agency_id: string;
  agent_id: string | null;
  name: string;
  description: string | null;
  start_url: string | null;
  steps: WorkflowStep[];
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};

export type BrowserAgentRun = {
  id: string;
  agency_id: string;
  agent_id: string | null;
  workflow_id: string | null;
  task: string | null;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  browserbase_session_id: string | null;
  live_view_url: string | null;
  result: unknown;
  logs: Array<{ ts: string; level?: string; msg?: string; [k: string]: unknown }>;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export function useBrowserAgents() {
  const { agencyId } = useAgency();
  const qc = useQueryClient();

  const agents = useQuery({
    queryKey: ["ai_browser_agents", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_browser_agents")
        .select("*")
        .eq("agency_id", agencyId!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as BrowserAgent[];
    },
  });

  const createAgent = useMutation({
    mutationFn: async (input: Partial<BrowserAgent>) => {
      const { data, error } = await supabase
        .from("ai_browser_agents")
        .insert({ ...input, agency_id: agencyId! } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai_browser_agents", agencyId] });
      toast.success("Agent created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateAgent = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<BrowserAgent> & { id: string }) => {
      const { error } = await supabase.from("ai_browser_agents").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai_browser_agents", agencyId] });
      toast.success("Agent updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAgent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_browser_agents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai_browser_agents", agencyId] });
      toast.success("Agent deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { agents, createAgent, updateAgent, deleteAgent };
}

export function useBrowserWorkflows() {
  const { agencyId } = useAgency();
  const qc = useQueryClient();

  const workflows = useQuery({
    queryKey: ["browser_workflows", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("browser_workflows")
        .select("*")
        .eq("agency_id", agencyId!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as BrowserWorkflow[];
    },
  });

  const createWorkflow = useMutation({
    mutationFn: async (input: Partial<BrowserWorkflow>) => {
      const { data, error } = await supabase
        .from("browser_workflows")
        .insert({ ...input, agency_id: agencyId! } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["browser_workflows", agencyId] });
      toast.success("Workflow saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateWorkflow = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<BrowserWorkflow> & { id: string }) => {
      const { error } = await supabase.from("browser_workflows").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["browser_workflows", agencyId] });
      toast.success("Workflow updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("browser_workflows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["browser_workflows", agencyId] });
      toast.success("Workflow deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { workflows, createWorkflow, updateWorkflow, deleteWorkflow };
}

export function useBrowserAgentRuns() {
  const { agencyId } = useAgency();

  const runs = useQuery({
    queryKey: ["browser_agent_runs", agencyId],
    enabled: !!agencyId,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("browser_agent_runs")
        .select("*")
        .eq("agency_id", agencyId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as BrowserAgentRun[];
    },
  });

  return { runs };
}

export async function launchBrowserAgent(payload: {
  agentId?: string;
  workflowId?: string;
  task?: string;
  steps?: WorkflowStep[];
  startUrl?: string;
  systemPrompt?: string;
}) {
  const { data, error } = await supabase.functions.invoke("browser-agent", {
    body: { action: "start", ...payload },
  });
  if (error) throw error;
  return data as { runId: string };
}

export async function cancelBrowserAgentRun(runId: string) {
  const { error } = await supabase.functions.invoke("browser-agent", {
    body: { action: "cancel", runId },
  });
  if (error) throw error;
}