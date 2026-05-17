// AI Browser Agent runner — generic Browserbase + Stagehand worker.
// Actions: start (create Browserbase session + spawn worker), cancel, status.
// Multi-tenant: scopes everything to caller's agency via JWT.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BROWSERBASE_API_KEY = Deno.env.get("BROWSERBASE_API_KEY")!;
const BROWSERBASE_PROJECT_ID = Deno.env.get("BROWSERBASE_PROJECT_ID")!;
const STAGEHAND_SERVER_URL = Deno.env.get("STAGEHAND_SERVER_URL") ?? "";
const STAGEHAND_API_KEY = Deno.env.get("STAGEHAND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Step = {
  type: "goto" | "act" | "extract" | "wait";
  value: string;
  schema?: unknown;
  ms?: number;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAgencyId(authHeader: string | null) {
  if (!authHeader) return null;
  const supa = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes } = await supa.auth.getUser();
  if (!userRes?.user) return null;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data } = await admin
    .from("profiles")
    .select("agency_id")
    .eq("id", userRes.user.id)
    .maybeSingle();
  return { agencyId: data?.agency_id as string | null, userId: userRes.user.id };
}

async function createBrowserbaseSession() {
  const res = await fetch("https://api.browserbase.com/v1/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-BB-API-Key": BROWSERBASE_API_KEY,
    },
    body: JSON.stringify({
      projectId: BROWSERBASE_PROJECT_ID,
      browserSettings: { fingerprint: { devices: ["desktop"] } },
      keepAlive: true,
    }),
  });
  if (!res.ok) throw new Error(`Browserbase create failed: ${res.status} ${await res.text()}`);
  const session = await res.json();

  // Fetch live debug URL
  const debugRes = await fetch(`https://api.browserbase.com/v1/sessions/${session.id}/debug`, {
    headers: { "X-BB-API-Key": BROWSERBASE_API_KEY },
  });
  const debug = debugRes.ok ? await debugRes.json() : {};
  return {
    sessionId: session.id as string,
    connectUrl: session.connectUrl as string,
    liveViewUrl: (debug.debuggerFullscreenUrl || debug.debuggerUrl) as string | undefined,
  };
}

async function closeBrowserbaseSession(sessionId: string) {
  await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-BB-API-Key": BROWSERBASE_API_KEY },
    body: JSON.stringify({ projectId: BROWSERBASE_PROJECT_ID, status: "REQUEST_RELEASE" }),
  }).catch(() => {});
}

// Posts the workflow to a Stagehand worker (user-hosted at STAGEHAND_SERVER_URL).
// Worker contract: POST /run { connectUrl, systemPrompt, steps } -> { logs, result }
async function runOnStagehand(payload: unknown) {
  if (!STAGEHAND_SERVER_URL) {
    throw new Error("STAGEHAND_SERVER_URL is not configured");
  }
  const res = await fetch(`${STAGEHAND_SERVER_URL.replace(/\/$/, "")}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(STAGEHAND_API_KEY ? { Authorization: `Bearer ${STAGEHAND_API_KEY}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Stagehand worker error ${res.status}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return { logs: [text], result: null };
  }
}

async function executeRun(runId: string, agencyId: string, opts: {
  systemPrompt: string;
  steps: Step[];
  startUrl?: string;
  task?: string;
}) {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  let sessionId: string | undefined;
  const appendLog = async (entry: Record<string, unknown>) => {
    await admin.rpc("noop").catch(() => {});
    const { data } = await admin
      .from("browser_agent_runs")
      .select("logs")
      .eq("id", runId)
      .maybeSingle();
    const logs = Array.isArray(data?.logs) ? data!.logs : [];
    logs.push({ ts: new Date().toISOString(), ...entry });
    await admin.from("browser_agent_runs").update({ logs }).eq("id", runId);
  };

  try {
    await admin
      .from("browser_agent_runs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", runId);

    const session = await createBrowserbaseSession();
    sessionId = session.sessionId;
    await admin
      .from("browser_agent_runs")
      .update({
        browserbase_session_id: session.sessionId,
        live_view_url: session.liveViewUrl ?? null,
      })
      .eq("id", runId);
    await appendLog({ level: "info", msg: "Browserbase session created", sessionId: session.sessionId });

    const finalSteps: Step[] = [
      ...(opts.startUrl ? [{ type: "goto" as const, value: opts.startUrl }] : []),
      ...opts.steps,
    ];

    await appendLog({ level: "info", msg: "Dispatching to Stagehand worker", stepCount: finalSteps.length });

    const out = await runOnStagehand({
      connectUrl: session.connectUrl,
      systemPrompt: opts.systemPrompt,
      task: opts.task,
      steps: finalSteps,
    });

    if (Array.isArray(out?.logs)) {
      for (const l of out.logs) await appendLog({ level: "stagehand", msg: l });
    }

    await admin
      .from("browser_agent_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result: out?.result ?? null,
      })
      .eq("id", runId);
    await appendLog({ level: "info", msg: "Run completed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin
      .from("browser_agent_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", runId);
    await appendLog({ level: "error", msg: message });
  } finally {
    if (sessionId) await closeBrowserbaseSession(sessionId);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAgencyId(req.headers.get("Authorization"));
    if (!auth?.agencyId) return json({ error: "Unauthorized" }, 401);
    const { agencyId, userId } = auth;

    const body = await req.json();
    const action = body.action as string;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (action === "start") {
      const { agentId, workflowId, task, steps, startUrl, systemPrompt } = body;

      // Load agent + workflow if provided
      let resolvedSystemPrompt = systemPrompt || "";
      let resolvedSteps: Step[] = Array.isArray(steps) ? steps : [];
      let resolvedStartUrl: string | undefined = startUrl;

      if (agentId) {
        const { data: agent } = await admin
          .from("ai_browser_agents")
          .select("*")
          .eq("id", agentId)
          .eq("agency_id", agencyId)
          .maybeSingle();
        if (!agent) return json({ error: "Agent not found" }, 404);
        resolvedSystemPrompt = resolvedSystemPrompt || agent.system_prompt || "";
        resolvedStartUrl = resolvedStartUrl || agent.default_start_url || undefined;
      }

      if (workflowId) {
        const { data: wf } = await admin
          .from("browser_workflows")
          .select("*")
          .eq("id", workflowId)
          .eq("agency_id", agencyId)
          .maybeSingle();
        if (!wf) return json({ error: "Workflow not found" }, 404);
        if (!resolvedSteps.length) resolvedSteps = wf.steps as Step[];
        resolvedStartUrl = resolvedStartUrl || wf.start_url || undefined;
      }

      if (!resolvedSteps.length && !task) {
        return json({ error: "Provide steps, a workflow, or a task" }, 400);
      }

      // If only task (no steps), let Stagehand worker interpret it
      if (!resolvedSteps.length && task) {
        resolvedSteps = [{ type: "act", value: task }];
      }

      const { data: run, error } = await admin
        .from("browser_agent_runs")
        .insert({
          agency_id: agencyId,
          agent_id: agentId ?? null,
          workflow_id: workflowId ?? null,
          task: task ?? null,
          status: "pending",
          created_by: userId,
        })
        .select()
        .single();
      if (error) throw error;

      // Run in background — return immediately
      // @ts-ignore EdgeRuntime
      EdgeRuntime.waitUntil(
        executeRun(run.id, agencyId, {
          systemPrompt: resolvedSystemPrompt,
          steps: resolvedSteps,
          startUrl: resolvedStartUrl,
          task,
        }),
      );

      return json({ runId: run.id });
    }

    if (action === "cancel") {
      const { runId } = body;
      const { data: run } = await admin
        .from("browser_agent_runs")
        .select("*")
        .eq("id", runId)
        .eq("agency_id", agencyId)
        .maybeSingle();
      if (!run) return json({ error: "Run not found" }, 404);
      if (run.browserbase_session_id) await closeBrowserbaseSession(run.browserbase_session_id);
      await admin
        .from("browser_agent_runs")
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("id", runId);
      return json({ ok: true });
    }

    if (action === "status") {
      const { runId } = body;
      const { data } = await admin
        .from("browser_agent_runs")
        .select("*")
        .eq("id", runId)
        .eq("agency_id", agencyId)
        .maybeSingle();
      return json({ run: data });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("browser-agent error", message);
    return json({ error: message }, 500);
  }
});