import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSERBASE_API_KEY = Deno.env.get("BROWSERBASE_API_KEY");
const BROWSERBASE_PROJECT_ID = Deno.env.get("BROWSERBASE_PROJECT_ID");
const BROWSERBASE_API_URL = "https://api.browserbase.com/v1";

const PLATFORM_URLS: Record<string, string> = {
  onlyfans: "https://onlyfans.com",
  fansly: "https://fansly.com",
  instagram: "https://instagram.com",
  twitter: "https://x.com",
};

interface RequestBody {
  action: string;
  session_link_id?: string;
  platform?: string;
  chatter_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!BROWSERBASE_API_KEY || !BROWSERBASE_PROJECT_ID) {
      throw new Error("Browserbase credentials not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: RequestBody = await req.json();
    const { action } = body;

    console.log(`[browserbase-session] Action: ${action}`, { session_link_id: body.session_link_id });

    switch (action) {
      case "create_admin_session":
        return await handleCreateAdminSession(supabase, body);
      case "save_profile":
        return await handleSaveProfile(supabase, body);
      case "launch_chatter_session":
        return await handleLaunchChatterSession(supabase, body);
      case "terminate_session":
        return await handleTerminateSession(supabase, body);
      case "get_session_status":
        return await handleGetSessionStatus(supabase, body);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error("[browserbase-session] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleCreateAdminSession(supabase: any, body: RequestBody) {
  const { session_link_id, platform } = body;

  if (!session_link_id || !platform) {
    throw new Error("Missing session_link_id or platform");
  }

  // Get existing session link
  const { data: sessionLink, error: fetchError } = await supabase
    .from("creator_session_links")
    .select("*")
    .eq("id", session_link_id)
    .single();

  if (fetchError || !sessionLink) {
    throw new Error("Session link not found");
  }

  let contextId = sessionLink.browserbase_context_id;

  // Create a new context if one doesn't exist
  if (!contextId) {
    console.log("[browserbase-session] Creating new context...");
    const contextResponse = await fetch(`${BROWSERBASE_API_URL}/contexts`, {
      method: "POST",
      headers: {
        "X-BB-API-Key": BROWSERBASE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ projectId: BROWSERBASE_PROJECT_ID }),
    });

    if (!contextResponse.ok) {
      const errorText = await contextResponse.text();
      console.error("[browserbase-session] Context creation failed:", errorText);
      throw new Error(`Failed to create context: ${errorText}`);
    }

    const contextData = await contextResponse.json();
    contextId = contextData.id;
    console.log("[browserbase-session] Created context:", contextId);

    // Update session link with context ID
    await supabase
      .from("creator_session_links")
      .update({ browserbase_context_id: contextId })
      .eq("id", session_link_id);
  }

  // Create a new session with the context
  console.log("[browserbase-session] Creating session with context:", contextId);
  const sessionResponse = await fetch(`${BROWSERBASE_API_URL}/sessions`, {
    method: "POST",
    headers: {
      "X-BB-API-Key": BROWSERBASE_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId: BROWSERBASE_PROJECT_ID,
      browserSettings: {
        context: { id: contextId, persist: true },
        viewport: { width: 1280, height: 800 },
      },
      timeout: 900, // 15 minutes for free tier
      keepAlive: true,
    }),
  });

  if (!sessionResponse.ok) {
    const errorText = await sessionResponse.text();
    console.error("[browserbase-session] Session creation failed:", errorText);
    throw new Error(`Failed to create session: ${errorText}`);
  }

  const sessionData = await sessionResponse.json();
  const sessionId = sessionData.id;
  console.log("[browserbase-session] Created session:", sessionId);

  // Get the debug URL for embedding
  const debugResponse = await fetch(`${BROWSERBASE_API_URL}/sessions/${sessionId}/debug`, {
    headers: { "X-BB-API-Key": BROWSERBASE_API_KEY! },
  });

  if (!debugResponse.ok) {
    const errorText = await debugResponse.text();
    console.error("[browserbase-session] Debug URL fetch failed:", errorText);
    throw new Error(`Failed to get debug URL: ${errorText}`);
  }

  const debugData = await debugResponse.json();
  const embedUrl = debugData.debuggerFullscreenUrl;
  console.log("[browserbase-session] Got embed URL");

  // Update session link with session info
  await supabase
    .from("creator_session_links")
    .update({
      browserbase_session_id: sessionId,
      browserbase_live_url: embedUrl,
      session_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", session_link_id);

  // Record in active_browser_sessions
  await supabase.from("active_browser_sessions").insert({
    agency_id: sessionLink.agency_id,
    browserbase_session_id: sessionId,
    embed_url: embedUrl,
    browserbase_live_url: embedUrl,
    session_link_id,
    session_type: "admin",
    is_active: true,
  });

  return new Response(
    JSON.stringify({
      success: true,
      embedUrl,
      sessionId,
      contextId,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleSaveProfile(supabase: any, body: RequestBody) {
  const { session_link_id } = body;

  if (!session_link_id) {
    throw new Error("Missing session_link_id");
  }

  // Get session link
  const { data: sessionLink, error: fetchError } = await supabase
    .from("creator_session_links")
    .select("*")
    .eq("id", session_link_id)
    .single();

  if (fetchError || !sessionLink) {
    throw new Error("Session link not found");
  }

  const sessionId = sessionLink.browserbase_session_id;
  const contextId = sessionLink.browserbase_context_id;

  if (!sessionId || !contextId) {
    throw new Error("No active session to save");
  }

  // Terminate the session - this will persist the context automatically
  console.log("[browserbase-session] Terminating session to save context...");
  const stopResponse = await fetch(`${BROWSERBASE_API_URL}/sessions/${sessionId}`, {
    method: "POST",
    headers: {
      "X-BB-API-Key": BROWSERBASE_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "REQUEST_RELEASE" }),
  });

  if (!stopResponse.ok) {
    // Session might already be terminated, which is fine
    console.log("[browserbase-session] Session stop response:", stopResponse.status);
  }

  // Update session link status to ready
  await supabase
    .from("creator_session_links")
    .update({
      session_status: "ready",
      browserbase_session_id: null,
      browserbase_live_url: null,
      last_saved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", session_link_id);

  // Mark active session as ended
  await supabase
    .from("active_browser_sessions")
    .update({
      is_active: false,
      ended_at: new Date().toISOString(),
    })
    .eq("session_link_id", session_link_id)
    .eq("is_active", true);

  console.log("[browserbase-session] Profile saved, context:", contextId);

  return new Response(
    JSON.stringify({
      success: true,
      contextId,
      message: "Profile saved successfully",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleLaunchChatterSession(supabase: any, body: RequestBody) {
  const { session_link_id, chatter_id } = body;

  if (!session_link_id || !chatter_id) {
    throw new Error("Missing session_link_id or chatter_id");
  }

  // Verify chatter assignment
  const { data: assignment, error: assignError } = await supabase
    .from("session_link_assignments")
    .select("*")
    .eq("session_link_id", session_link_id)
    .eq("chatter_id", chatter_id)
    .single();

  if (assignError || !assignment) {
    throw new Error("Chatter is not assigned to this session");
  }

  // Get session link
  const { data: sessionLink, error: fetchError } = await supabase
    .from("creator_session_links")
    .select("*")
    .eq("id", session_link_id)
    .single();

  if (fetchError || !sessionLink) {
    throw new Error("Session link not found");
  }

  const contextId = sessionLink.browserbase_context_id;

  if (!contextId) {
    throw new Error("Session not authenticated. Please contact your manager.");
  }

  // Create a new session with the saved context (don't persist changes from chatter)
  console.log("[browserbase-session] Launching chatter session with context:", contextId);
  const sessionResponse = await fetch(`${BROWSERBASE_API_URL}/sessions`, {
    method: "POST",
    headers: {
      "X-BB-API-Key": BROWSERBASE_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId: BROWSERBASE_PROJECT_ID,
      browserSettings: {
        context: { id: contextId, persist: false }, // Don't persist chatter changes
        viewport: { width: 1280, height: 800 },
      },
      timeout: 3600, // 1 hour for chatter work
      keepAlive: true,
    }),
  });

  if (!sessionResponse.ok) {
    const errorText = await sessionResponse.text();
    console.error("[browserbase-session] Chatter session creation failed:", errorText);
    throw new Error(`Failed to create chatter session: ${errorText}`);
  }

  const sessionData = await sessionResponse.json();
  const sessionId = sessionData.id;

  // Get debug URL
  const debugResponse = await fetch(`${BROWSERBASE_API_URL}/sessions/${sessionId}/debug`, {
    headers: { "X-BB-API-Key": BROWSERBASE_API_KEY! },
  });

  if (!debugResponse.ok) {
    throw new Error("Failed to get session embed URL");
  }

  const debugData = await debugResponse.json();
  const embedUrl = debugData.debuggerFullscreenUrl;

  // Update assignment access info
  await supabase
    .from("session_link_assignments")
    .update({
      accessed_at: new Date().toISOString(),
      access_count: (assignment.access_count || 0) + 1,
    })
    .eq("id", assignment.id);

  // Log access
  await supabase.from("session_access_logs").insert({
    session_link_id,
    chatter_id,
    action: "launch",
  });

  // Record active session
  await supabase.from("active_browser_sessions").insert({
    agency_id: sessionLink.agency_id,
    chatter_id,
    browserbase_session_id: sessionId,
    embed_url: embedUrl,
    browserbase_live_url: embedUrl,
    session_link_id,
    session_type: "chatter",
    is_active: true,
  });

  console.log("[browserbase-session] Chatter session launched:", sessionId);

  return new Response(
    JSON.stringify({
      success: true,
      embedUrl,
      sessionId,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleTerminateSession(supabase: any, body: RequestBody) {
  const { session_link_id } = body;

  if (!session_link_id) {
    throw new Error("Missing session_link_id");
  }

  // Get session link
  const { data: sessionLink, error: fetchError } = await supabase
    .from("creator_session_links")
    .select("browserbase_session_id")
    .eq("id", session_link_id)
    .single();

  if (fetchError || !sessionLink) {
    throw new Error("Session link not found");
  }

  const sessionId = sessionLink.browserbase_session_id;

  if (sessionId) {
    // Terminate the session
    console.log("[browserbase-session] Terminating session:", sessionId);
    await fetch(`${BROWSERBASE_API_URL}/sessions/${sessionId}`, {
      method: "POST",
      headers: {
        "X-BB-API-Key": BROWSERBASE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "REQUEST_RELEASE" }),
    });
  }

  // Update session link
  await supabase
    .from("creator_session_links")
    .update({
      browserbase_session_id: null,
      browserbase_live_url: null,
      session_status: sessionLink.browserbase_context_id ? "ready" : "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", session_link_id);

  // Mark active session as ended
  await supabase
    .from("active_browser_sessions")
    .update({
      is_active: false,
      ended_at: new Date().toISOString(),
    })
    .eq("session_link_id", session_link_id)
    .eq("is_active", true);

  console.log("[browserbase-session] Session terminated");

  return new Response(
    JSON.stringify({ success: true, message: "Session terminated" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleGetSessionStatus(supabase: any, body: RequestBody) {
  const { session_link_id } = body;

  if (!session_link_id) {
    throw new Error("Missing session_link_id");
  }

  // Get session link
  const { data: sessionLink, error: fetchError } = await supabase
    .from("creator_session_links")
    .select("browserbase_session_id, browserbase_context_id, session_status")
    .eq("id", session_link_id)
    .single();

  if (fetchError || !sessionLink) {
    return new Response(
      JSON.stringify({ success: false, active: false, error: "Session link not found" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sessionId = sessionLink.browserbase_session_id;

  if (!sessionId) {
    return new Response(
      JSON.stringify({
        success: true,
        active: false,
        contextId: sessionLink.browserbase_context_id,
        status: sessionLink.session_status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check session status with Browserbase
  const statusResponse = await fetch(`${BROWSERBASE_API_URL}/sessions/${sessionId}`, {
    headers: { "X-BB-API-Key": BROWSERBASE_API_KEY! },
  });

  if (!statusResponse.ok) {
    return new Response(
      JSON.stringify({
        success: true,
        active: false,
        contextId: sessionLink.browserbase_context_id,
        status: "expired",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const statusData = await statusResponse.json();

  return new Response(
    JSON.stringify({
      success: true,
      active: statusData.status === "RUNNING",
      sessionId,
      contextId: sessionLink.browserbase_context_id,
      status: statusData.status,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
