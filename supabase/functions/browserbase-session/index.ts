import { createClient } from "npm:@supabase/supabase-js@2.89.0";

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
      case "get_session_recording":
        return await getSessionRecording(BB_KEY, params);
      case "get_session_logs":
        return await getSessionLogs(BB_KEY, params);
      case "get_session_downloads":
        return await getSessionDownloads(BB_KEY, params);
      case "check_captcha_events":
        return await checkCaptchaEvents(serviceClient, BB_KEY, params);
      case "upload_extension":
        return await uploadExtension(serviceClient, BB_KEY, BB_PROJECT, params);
      case "list_extensions":
        return await listExtensions(BB_KEY, BB_PROJECT);
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
    if (res.status === 402) {
      throw new Error("BILLING: Your Browserbase free plan minutes have been used up. Please upgrade your Browserbase account at https://browserbase.com/plans to continue launching browser sessions.");
    }
    throw new Error(`Browserbase API error: ${text}`);
  }
  return res.json();
}

async function bbFetchRaw(apiKey: string, path: string, options: RequestInit = {}) {
  const res = await fetch(`${BB_API}${path}`, {
    ...options,
    headers: { ...bbHeaders(apiKey), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Browserbase ${path} error:`, text);
    throw new Error(`Browserbase API error: ${text}`);
  }
  return res;
}

async function getOrCreateContext(supabase: any, apiKey: string, projectId: string, creatorId: string, platform: string) {
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

// Build proxy config with optional geolocation
function buildProxyConfig(creator: any) {
  const proxy: any = { type: "browserbase" };
  if (creator?.proxy_country) {
    proxy.geolocation = { country: creator.proxy_country };
    if (creator.proxy_state) {
      proxy.geolocation.state = creator.proxy_state;
    }
  }
  return [proxy];
}

// ── Actions ──────────────────────────────────────────────

async function createAdminSession(supabase: any, apiKey: string, projectId: string, userId: string, params: any) {
  const { creatorId, platform, agencyId } = params;
  if (!creatorId || !platform || !agencyId) {
    return json({ error: "creatorId, platform, and agencyId are required" }, 400);
  }

  // Fetch creator for proxy geolocation
  const { data: creator } = await supabase
    .from("creators")
    .select("proxy_country, proxy_state, name")
    .eq("id", creatorId)
    .single();

  const contextId = await getOrCreateContext(supabase, apiKey, projectId, creatorId, platform);

  const session = await bbFetch(apiKey, "/sessions", {
    method: "POST",
    body: JSON.stringify({
      projectId,
      browserSettings: {
        context: { id: contextId, persist: true },
        fingerprint: {
          browsers: ["chrome"],
          operatingSystems: ["windows"],
        },
      },
      proxies: buildProxyConfig(creator),
      keepAlive: true,
      timeout: 3600,
      // Session metadata for tracking
      userMetadata: {
        creatorId,
        agencyId,
        userId,
        platform,
        sessionType: "admin",
        creatorName: creator?.name || "Unknown",
      },
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
    .from("creator_session_links")
    .update({
      session_status: "authenticated",
      last_saved_at: new Date().toISOString(),
      browserbase_session_id: null,
      browserbase_live_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionLinkId);

  await supabase
    .from("active_browser_sessions")
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq("browserbase_session_id", browserbaseSessionId);

  return json({ success: true, message: "Login saved. Chatters can now use this account." });
}

async function launchChatterSession(supabase: any, apiKey: string, projectId: string, userId: string, params: any) {
  const { sessionLinkId, chatterId } = params;
  if (!sessionLinkId) return json({ error: "sessionLinkId is required" }, 400);

  const { data: link, error: linkErr } = await supabase
    .from("creator_session_links")
    .select("*")
    .eq("id", sessionLinkId)
    .single();

  if (linkErr || !link) {
    return json({ error: "Session link not found" }, 404);
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (!employee) {
    return json({ error: "Employee record not found" }, 403);
  }

  const { data: permission } = await supabase
    .from("employee_of_permissions")
    .select("id")
    .eq("employee_id", employee.id)
    .eq("creator_id", link.creator_id)
    .maybeSingle();

  if (!permission) {
    return json({ error: "Not authorized for this creator's sessions" }, 403);
  }

  if (!link.is_active) return json({ error: "Session has been revoked" }, 400);
  if (new Date(link.expires_at) < new Date()) return json({ error: "Session expired" }, 400);
  if (!link.browserbase_context_id) return json({ error: "Session not authenticated yet" }, 400);

  // Fetch creator for proxy geolocation
  const { data: creator } = await supabase
    .from("creators")
    .select("proxy_country, proxy_state, name")
    .eq("id", link.creator_id)
    .single();

  // Fetch active extensions for auto-inject
  const { data: extensions } = await supabase
    .from("browser_extensions")
    .select("browserbase_extension_id")
    .eq("agency_id", link.agency_id)
    .eq("is_active", true)
    .eq("auto_inject", true);

  const extensionIds = (extensions || [])
    .map((e: any) => e.browserbase_extension_id)
    .filter(Boolean);

  const sessionConfig: any = {
    projectId,
    browserSettings: {
      context: { id: link.browserbase_context_id, persist: true },
      fingerprint: {
        browsers: ["chrome"],
        operatingSystems: ["windows"],
      },
    },
    proxies: buildProxyConfig(creator),
    keepAlive: true,
    timeout: 28800,
    userMetadata: {
      creatorId: link.creator_id,
      agencyId: link.agency_id,
      chatterId: chatterId || userId,
      platform: link.platform,
      sessionType: "chatter",
      creatorName: creator?.name || "Unknown",
    },
  };

  if (extensionIds.length > 0) {
    sessionConfig.extensionId = extensionIds[0]; // Browserbase supports one extension per session
  }

  const session = await bbFetch(apiKey, "/sessions", {
    method: "POST",
    body: JSON.stringify(sessionConfig),
  });

  const liveUrl = await getLiveViewUrl(apiKey, session.id);

  await supabase.from("active_browser_sessions").insert({
    session_link_id: sessionLinkId,
    chatter_id: chatterId,
    agency_id: link.agency_id,
    browserbase_session_id: session.id,
    browserbase_live_url: liveUrl,
    embed_url: liveUrl,
    session_type: "chatter",
  });

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

// ── New Actions ──────────────────────────────────────────

async function getSessionRecording(apiKey: string, params: any) {
  const { browserbaseSessionId } = params;
  if (!browserbaseSessionId) return json({ error: "browserbaseSessionId is required" }, 400);

  try {
    const recording = await bbFetch(apiKey, `/sessions/${browserbaseSessionId}/recording`);
    return json({ success: true, recording });
  } catch (err: any) {
    return json({ error: "Recording not available: " + (err.message || "Unknown error") }, 404);
  }
}

async function getSessionLogs(apiKey: string, params: any) {
  const { browserbaseSessionId } = params;
  if (!browserbaseSessionId) return json({ error: "browserbaseSessionId is required" }, 400);

  try {
    const logs = await bbFetch(apiKey, `/sessions/${browserbaseSessionId}/logs`);
    return json({ success: true, logs });
  } catch (err: any) {
    return json({ error: "Logs not available: " + (err.message || "Unknown error") }, 404);
  }
}

async function getSessionDownloads(apiKey: string, params: any) {
  const { browserbaseSessionId } = params;
  if (!browserbaseSessionId) return json({ error: "browserbaseSessionId is required" }, 400);

  try {
    const downloads = await bbFetch(apiKey, `/sessions/${browserbaseSessionId}/downloads`);
    return json({ success: true, downloads });
  } catch (err: any) {
    return json({ error: "Downloads not available: " + (err.message || "Unknown error") }, 404);
  }
}

async function checkCaptchaEvents(supabase: any, apiKey: string, params: any) {
  const { browserbaseSessionId, agencyId, sessionLinkId } = params;
  if (!browserbaseSessionId) return json({ error: "browserbaseSessionId is required" }, 400);

  try {
    const logs = await bbFetch(apiKey, `/sessions/${browserbaseSessionId}/logs`);
    const captchaEvents: any[] = [];

    // Parse logs for CAPTCHA-related events
    if (Array.isArray(logs)) {
      for (const log of logs) {
        const msg = typeof log === "string" ? log : JSON.stringify(log);
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes("captcha") || lowerMsg.includes("challenge") || lowerMsg.includes("recaptcha") || lowerMsg.includes("hcaptcha")) {
          captchaEvents.push({
            timestamp: log.timestamp || new Date().toISOString(),
            message: msg,
            type: lowerMsg.includes("solved") || lowerMsg.includes("success") ? "captcha_solved" : "captcha_detected",
          });
        }
      }
    }

    // Store events in database
    if (captchaEvents.length > 0 && agencyId) {
      const inserts = captchaEvents.map((evt) => ({
        agency_id: agencyId,
        session_link_id: sessionLinkId || null,
        browserbase_session_id: browserbaseSessionId,
        event_type: evt.type,
        severity: evt.type === "captcha_detected" ? "warning" : "info",
        title: evt.type === "captcha_detected" ? "CAPTCHA Detected" : "CAPTCHA Solved",
        message: evt.message,
        metadata: { timestamp: evt.timestamp },
      }));

      await supabase.from("browser_session_events").insert(inserts);
    }

    return json({ success: true, captchaEvents, count: captchaEvents.length });
  } catch (err: any) {
    return json({ error: "Failed to check CAPTCHA events: " + (err.message || "Unknown error") }, 500);
  }
}

async function uploadExtension(supabase: any, apiKey: string, projectId: string, params: any) {
  const { agencyId, name, description } = params;
  if (!name) return json({ error: "Extension name is required" }, 400);

  // Note: Actual extension upload requires multipart form data with the extension zip
  // This creates a placeholder record. Real upload would go through Browserbase dashboard or API
  const { data, error } = await supabase
    .from("browser_extensions")
    .insert({
      agency_id: agencyId,
      name,
      description: description || null,
    })
    .select("id")
    .single();

  if (error) throw new Error("Failed to create extension record: " + error.message);

  return json({
    success: true,
    extensionId: data.id,
    message: "Extension record created. Upload the extension ZIP via the Browserbase dashboard to get the extension ID, then update this record.",
  });
}

async function listExtensions(apiKey: string, projectId: string) {
  try {
    const extensions = await bbFetch(apiKey, `/extensions?projectId=${projectId}`);
    return json({ success: true, extensions });
  } catch (err: any) {
    return json({ success: true, extensions: [] });
  }
}
