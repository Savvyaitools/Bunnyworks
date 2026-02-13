import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BB_API = "https://api.browserbase.com/v1";

function bbHeaders(apiKey: string) {
  return { "x-bb-api-key": apiKey, "Content-Type": "application/json" };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BB_KEY = Deno.env.get("BROWSERBASE_API_KEY");
    const BB_PROJECT = Deno.env.get("BROWSERBASE_PROJECT_ID");
    if (!BB_KEY || !BB_PROJECT) throw new Error("Browserbase credentials not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);
    const userId = user.id;

    const { action, ...params } = await req.json();
    console.log(`browserbase-session action=${action} user=${userId}`);

    switch (action) {
      case "create_admin_session":
        return await createAdminSession(serviceClient, BB_KEY, BB_PROJECT, userId, params);
      case "save_and_close":
        return await saveAndClose(serviceClient, BB_KEY, params);
      case "launch_chatter_session":
        return await launchChatterSession(serviceClient, BB_KEY, BB_PROJECT, userId, params);
      case "terminate_session":
        return await terminateSession(serviceClient, BB_KEY, params);
      case "get_session_status":
        return await getSessionStatus(BB_KEY, params);
      default:
        return json({ error: "Invalid action" }, 400);
    }
  } catch (error) {
    console.error("browserbase-session error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

// ── Helpers ──────────────────────────────────────────────

async function bbFetch(apiKey: string, path: string, options: RequestInit = {}) {
  const res = await fetch(`${BB_API}${path}`, {
    ...options,
    headers: { ...bbHeaders(apiKey), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Browserbase ${path} error:`, text);
    throw new Error(`Browserbase API error: ${text}`);
  }
  return res.json();
}

async function getOrCreateContext(supabase: any, apiKey: string, projectId: string, creatorId: string, platform: string) {
  // Check for existing context
  const { data: existing } = await supabase
    .from("creator_session_links")
    .select("browserbase_context_id")
    .eq("creator_id", creatorId)
    .eq("platform", platform)
    .not("browserbase_context_id", "is", null)
    .maybeSingle();

  if (existing?.browserbase_context_id) {
    console.log("Reusing existing context:", existing.browserbase_context_id);
    return existing.browserbase_context_id;
  }

  // Create new context
  const ctx = await bbFetch(apiKey, "/contexts", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
  console.log("Created new context:", ctx.id);
  return ctx.id;
}

async function getLiveViewUrl(apiKey: string, sessionId: string) {
  const debug = await bbFetch(apiKey, `/sessions/${sessionId}/debug`);
  return debug.debuggerFullscreenUrl;
}

// ── Actions ──────────────────────────────────────────────

async function createAdminSession(supabase: any, apiKey: string, projectId: string, userId: string, params: any) {
  const { creatorId, platform, agencyId } = params;
  if (!creatorId || !platform || !agencyId) {
    return json({ error: "creatorId, platform, and agencyId are required" }, 400);
  }

  const contextId = await getOrCreateContext(supabase, apiKey, projectId, creatorId, platform);

  const startUrl = platform === "onlyfans" ? "https://onlyfans.com" : "https://www.fanvue.com";

  // Create session with context
  const session = await bbFetch(apiKey, "/sessions", {
    method: "POST",
    body: JSON.stringify({
      projectId,
      browserSettings: {
        context: { id: contextId, persist: true },
      },
      keepAlive: true,
      timeout: 3600,
    }),
  });

  console.log("Admin session created:", session.id);

  const liveUrl = await getLiveViewUrl(apiKey, session.id);

  // Upsert session link
  const { data: existingLink } = await supabase
    .from("creator_session_links")
    .select("id")
    .eq("creator_id", creatorId)
    .eq("platform", platform)
    .maybeSingle();

  let sessionLinkId: string;

  if (existingLink) {
    const { data, error } = await supabase
      .from("creator_session_links")
      .update({
        browserbase_session_id: session.id,
        browserbase_context_id: contextId,
        browserbase_live_url: liveUrl,
        session_status: "authenticating",
        is_active: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingLink.id)
      .select("id")
      .single();
    if (error) throw new Error("Failed to update session link: " + error.message);
    sessionLinkId = data.id;
  } else {
    const { data, error } = await supabase
      .from("creator_session_links")
      .insert({
        creator_id: creatorId,
        agency_id: agencyId,
        platform,
        created_by: userId,
        encrypted_session: "browserbase",
        browserbase_session_id: session.id,
        browserbase_context_id: contextId,
        browserbase_live_url: liveUrl,
        session_status: "authenticating",
        is_active: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error("Failed to insert session link: " + error.message);
    sessionLinkId = data.id;
  }

  // Track active session
  await supabase.from("active_browser_sessions").insert({
    session_link_id: sessionLinkId,
    agency_id: agencyId,
    browserbase_session_id: session.id,
    browserbase_live_url: liveUrl,
    embed_url: liveUrl,
    session_type: "admin",
  });

  return json({
    success: true,
    sessionLinkId,
    embedUrl: liveUrl,
    sessionId: session.id,
    contextId,
  });
}

async function saveAndClose(supabase: any, apiKey: string, params: any) {
  const { sessionLinkId, browserbaseSessionId } = params;
  if (!sessionLinkId || !browserbaseSessionId) {
    return json({ error: "sessionLinkId and browserbaseSessionId are required" }, 400);
  }

  console.log("Saving and closing session:", browserbaseSessionId);

  // Terminate session — context auto-persists because persist:true was set
  try {
    await fetch(`${BB_API}/sessions/${browserbaseSessionId}`, {
      method: "POST",
      headers: bbHeaders(apiKey),
      body: JSON.stringify({ status: "REQUEST_RELEASE" }),
    });
  } catch (e) {
    console.log("Session may already be terminated:", e);
  }

  // Update session link
  await supabase
    .from("creator_session_links")
    .update({
      session_status: "authenticated",
      last_saved_at: new Date().toISOString(),
      browserbase_session_id: null,
      browserbase_live_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionLinkId);

  // Mark active session as ended
  await supabase
    .from("active_browser_sessions")
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq("browserbase_session_id", browserbaseSessionId);

  return json({ success: true, message: "Login saved. Chatters can now use this account." });
}

async function launchChatterSession(supabase: any, apiKey: string, projectId: string, userId: string, params: any) {
  const { sessionLinkId, chatterId } = params;
  if (!sessionLinkId) return json({ error: "sessionLinkId is required" }, 400);

  // Verify assignment
  const { data: assignment, error: assignErr } = await supabase
    .from("session_link_assignments")
    .select("*, session_link:creator_session_links(*)")
    .eq("session_link_id", sessionLinkId)
    .eq("chatter_id", chatterId)
    .maybeSingle();

  if (assignErr || !assignment) {
    return json({ error: "Not authorized for this session" }, 403);
  }

  const link = assignment.session_link;
  if (!link.is_active) return json({ error: "Session has been revoked" }, 400);
  if (new Date(link.expires_at) < new Date()) return json({ error: "Session expired" }, 400);
  if (!link.browserbase_context_id) return json({ error: "Session not authenticated yet" }, 400);

  const startUrl = link.platform === "onlyfans" ? "https://onlyfans.com/my/chats" : "https://www.fanvue.com";

  const session = await bbFetch(apiKey, "/sessions", {
    method: "POST",
    body: JSON.stringify({
      projectId,
      browserSettings: {
        context: { id: link.browserbase_context_id, persist: true },
      },
      keepAlive: true,
      timeout: 28800,
    }),
  });

  const liveUrl = await getLiveViewUrl(apiKey, session.id);

  // Track active session
  await supabase.from("active_browser_sessions").insert({
    session_link_id: sessionLinkId,
    chatter_id: chatterId,
    agency_id: link.agency_id,
    browserbase_session_id: session.id,
    browserbase_live_url: liveUrl,
    embed_url: liveUrl,
    session_type: "chatter",
  });

  // Update assignment access
  await supabase
    .from("session_link_assignments")
    .update({
      accessed_at: new Date().toISOString(),
      access_count: (assignment.access_count || 0) + 1,
    })
    .eq("id", assignment.id);

  // Log access
  await supabase.from("session_access_logs").insert({
    session_link_id: sessionLinkId,
    chatter_id: chatterId,
    action: "launch",
  });

  return json({
    success: true,
    embedUrl: liveUrl,
    sessionId: session.id,
    platform: link.platform,
  });
}

async function terminateSession(supabase: any, apiKey: string, params: any) {
  const { browserbaseSessionId } = params;
  if (!browserbaseSessionId) return json({ error: "browserbaseSessionId is required" }, 400);

  try {
    await fetch(`${BB_API}/sessions/${browserbaseSessionId}`, {
      method: "POST",
      headers: bbHeaders(apiKey),
      body: JSON.stringify({ status: "REQUEST_RELEASE" }),
    });
  } catch (e) {
    console.log("Session may already be terminated:", e);
  }

  await supabase
    .from("active_browser_sessions")
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq("browserbase_session_id", browserbaseSessionId);

  return json({ success: true });
}

async function getSessionStatus(apiKey: string, params: any) {
  const { browserbaseSessionId } = params;
  if (!browserbaseSessionId) return json({ error: "browserbaseSessionId is required" }, 400);

  try {
    const data = await bbFetch(apiKey, `/sessions/${browserbaseSessionId}`);
    return json({ active: data.status === "RUNNING", status: data.status, createdAt: data.createdAt });
  } catch {
    return json({ active: false, status: "UNKNOWN" });
  }
}
