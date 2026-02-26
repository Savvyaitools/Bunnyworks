import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BB_API = "https://api.browserbase.com/v1";
const bbH = (k: string) => ({ "x-bb-api-key": k, "Content-Type": "application/json" });
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const PLATFORM_URLS: Record<string, string> = {
  onlyfans: "https://onlyfans.com",
  fanvue: "https://fanvue.com",
  fansly: "https://fansly.com",
};

// ========== CDP Navigation Helper ==========
async function navigateViaCDP(
  apiKey: string,
  sessionId: string,
  url: string,
  options?: { evaluate?: string; timeout?: number }
): Promise<{ success: boolean; timedOut?: boolean; result?: unknown; error?: string }> {
  const timeout = options?.timeout ?? 20000;
  const wsUrl = `wss://connect.browserbase.com?apiKey=${apiKey}&sessionId=${sessionId}`;
  console.log(`CDP: Connecting for navigation to ${url}`);

  return new Promise((resolve) => {
    let msgId = 1;
    let resolved = false;
    const ws = new WebSocket(wsUrl);

    const cleanup = (result: { success: boolean; timedOut?: boolean; result?: unknown; error?: string }) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try { ws.close(); } catch {}
      resolve(result);
    };

    const timer = setTimeout(() => {
      console.warn(`CDP: Navigation timeout after ${timeout}ms (non-fatal)`);
      cleanup({ success: true, timedOut: true, result: null });
    }, timeout);

    const send = (method: string, params: Record<string, unknown> = {}, sid?: string) => {
      const id = msgId++;
      const msg: any = { id, method, params };
      if (sid) msg.sessionId = sid;
      ws.send(JSON.stringify(msg));
      return id;
    };

    // Tracked IDs for robust message routing
    let getTargetsId: number | null = null;
    let attachId: number | null = null;
    let pageEnableId: number | null = null;
    let navigateId: number | null = null;
    let evaluateId: number | null = null;
    let sessionId_cdp: string | null = null;

    ws.onopen = () => {
      console.log("CDP: WebSocket connected, getting targets");
      getTargetsId = send("Target.getTargets");
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);

        if (msg.id === getTargetsId) {
          const targets = msg.result?.targetInfos || [];
          const pageTarget = targets.find((t: any) => t.type === "page");
          if (pageTarget) {
            console.log(`CDP: Found page target ${pageTarget.targetId}, attaching`);
            attachId = send("Target.attachToTarget", { targetId: pageTarget.targetId, flatten: true });
          } else {
            console.error("CDP: No page target found");
            cleanup({ success: false, error: "No page target found" });
          }
          return;
        }

        if (msg.id === attachId) {
          sessionId_cdp = msg.result?.sessionId;
          console.log(`CDP: Attached to target, sessionId: ${sessionId_cdp}`);
          if (sessionId_cdp) {
            pageEnableId = send("Page.enable", {}, sessionId_cdp);
            send("Runtime.enable", {}, sessionId_cdp);
          }
          return;
        }

        if (msg.id === pageEnableId && !navigateId && sessionId_cdp) {
          console.log(`CDP: Page.enable OK, navigating to ${url}`);
          navigateId = send("Page.navigate", { url }, sessionId_cdp);
          return;
        }

        if (msg.id === navigateId) {
          if (msg.error) {
            console.error("CDP: Page.navigate error:", msg.error);
          } else {
            console.log("CDP: Page.navigate OK, frameId:", msg.result?.frameId);
          }
          return;
        }

        if (msg.method === "Page.loadEventFired" || msg.params?.method === "Page.loadEventFired") {
          console.log("CDP: Page load event fired");
          if (options?.evaluate && sessionId_cdp) {
            evaluateId = send("Runtime.evaluate", { expression: options.evaluate, returnByValue: true }, sessionId_cdp);
          } else {
            cleanup({ success: true });
          }
          return;
        }

        if (evaluateId && msg.id === evaluateId) {
          const val = msg.result?.result?.value;
          console.log("CDP: Evaluate result received");
          cleanup({ success: true, result: val });
          return;
        }
      } catch {}
    };

    ws.onerror = (err) => {
      console.error("CDP: WebSocket error:", err);
      cleanup({ success: false, error: "WebSocket error" });
    };

    ws.onclose = () => {
      cleanup({ success: false, error: "WebSocket closed before completion" });
    };
  });
}

// ========== Browserbase API helpers ==========
async function bb(k: string, p: string, o: RequestInit = {}) {
  const r = await fetch(`${BB_API}${p}`, { ...o, headers: { ...bbH(k), ...(o.headers || {}) } });
  if (!r.ok) {
    const t = await r.text();
    if (r.status === 402) throw new Error("BILLING: Browserbase free plan minutes used up.");
    throw new Error(`Browserbase API error (${r.status}): ${t}`);
  }
  const data = await r.json();
  if (!data) {
    console.error(`Browserbase API returned null/empty for ${p}`);
    throw new Error(`Browserbase API returned empty response for ${p}`);
  }
  return data;
}

async function isSessionAlive(k: string, sessionId: string): Promise<boolean> {
  try {
    const d = await bb(k, `/sessions/${sessionId}`);
    return d.status === "RUNNING";
  } catch {
    return false;
  }
}

// Shared browser fingerprint settings
// With Advanced Stealth, Browserbase handles full fingerprint + viewport.
// We use the `os` field on browserSettings instead of fingerprint config.

// Shared session creation body builder
function sessionBody(projectId: string, contextId: string, proxies: any[], opts: {
  timeout?: number; keepAlive?: boolean; userMetadata?: Record<string, unknown>; extensionId?: string;
} = {}) {
  const body: any = {
    projectId,
    browserSettings: {
      context: { id: contextId, persist: true },
      advancedStealth: true, // 7-day trial — includes CAPTCHA solving & full fingerprinting
      os: "windows", // Per stealth-customization docs: sets UA + environment signals
    },
    proxies,
    keepAlive: opts.keepAlive ?? true,
    timeout: opts.timeout ?? 1800,
    userMetadata: opts.userMetadata || {},
  };
  if (opts.extensionId) body.extensionId = opts.extensionId;
  return body;
}

// Shared context resolution: reuse existing or create new
async function resolveContext(sb: any, bbKey: string, projectId: string, creatorId: string, platform: string, agencyId?: string, userId?: string): Promise<string> {
  const { data: ex } = await sb.from("creator_session_links")
    .select("browserbase_context_id")
    .eq("creator_id", creatorId)
    .eq("platform", platform)
    .not("browserbase_context_id", "is", null)
    .maybeSingle();
  if (ex?.browserbase_context_id) {
    console.log(`Reusing existing context ${ex.browserbase_context_id} for creator ${creatorId}`);
    return ex.browserbase_context_id;
  }
  console.log(`Creating new context for creator ${creatorId}`);
  const ctx = await bb(bbKey, "/contexts", { method: "POST", body: JSON.stringify({ projectId }) });
  if (!ctx?.id) throw new Error("Failed to create Browserbase context — no ID returned");
  // Auto-persist the new context to session links
  if (agencyId) {
    await sb.from("creator_session_links").upsert({
      creator_id: creatorId, agency_id: agencyId, platform,
      created_by: userId || null, encrypted_session: "browserbase",
      browserbase_context_id: ctx.id, session_status: "pending",
      is_active: false, expires_at: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
    }, { onConflict: "creator_id,platform" });
  }
  return ctx.id;
}

const STATE_ABBREV: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
  montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};

// Rotate through diverse US states to avoid proxy pool flagging
const PROXY_ROTATION_STATES = ["TX", "FL", "NY", "IL", "OH", "GA", "NC", "MI", "NJ", "VA", "WA", "AZ", "MA", "TN", "IN", "MO", "MD", "WI", "CO", "MN"];

function proxyConf(c: any) {
  const country = c?.proxy_country || "US";
  const rawState = c?.proxy_state;
  let state: string;
  if (rawState && rawState !== "CA") {
    // Use explicit state if set and not the old default
    state = rawState.length > 2 ? (STATE_ABBREV[rawState.toLowerCase()] || "TX") : rawState.toUpperCase();
  } else {
    // Rotate through diverse states instead of always using CA
    const idx = Math.floor(Math.random() * PROXY_ROTATION_STATES.length);
    state = PROXY_ROTATION_STATES[idx];
  }
  console.log(`Proxy: ${country}/${state} (rotation active)`);
  return [{
    type: "browserbase",
    geolocation: { country, state },
  }];
}

// ========== State → Timezone mapping for geo-consistency ==========
const STATE_TIMEZONES: Record<string, string> = {
  TX: "America/Chicago", FL: "America/New_York", NY: "America/New_York", IL: "America/Chicago",
  OH: "America/New_York", GA: "America/New_York", NC: "America/New_York", MI: "America/Detroit",
  NJ: "America/New_York", VA: "America/New_York", WA: "America/Los_Angeles", AZ: "America/Phoenix",
  MA: "America/New_York", TN: "America/Chicago", IN: "America/Indiana/Indianapolis", MO: "America/Chicago",
  MD: "America/New_York", WI: "America/Chicago", CO: "America/Denver", MN: "America/Chicago",
  CA: "America/Los_Angeles", PA: "America/New_York",
};

// Advanced stealth is now handled natively by Browserbase (advancedStealth: true).
// The custom JS stealth script (canvas noise, WebGL, AudioContext, navigator overrides,
// WebRTC leak prevention, battery API, plugin spoofing) has been removed to avoid
// conflicts with Browserbase's browser-level fingerprinting.

// ========== Lightweight pre-login setup: timezone & locale only ==========
// Site-visit warmup (Google/YouTube) removed — it left the browser stuck on YouTube
// and caused CDP navigation to the platform to timeout.
async function preLoginSetup(apiKey: string, sessionId: string, proxyState: string): Promise<void> {
  const tz = STATE_TIMEZONES[proxyState] || "America/New_York";
  const wsUrl = `wss://connect.browserbase.com?apiKey=${apiKey}&sessionId=${sessionId}`;
  console.log(`Setup: Setting timezone=${tz}, locale=en-US for state=${proxyState}`);

  await new Promise<void>((resolve) => {
    let msgId = 1;
    let resolved = false;
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => {
      if (!resolved) { resolved = true; try { ws.close(); } catch {} resolve(); }
    }, 10000);

    const send = (method: string, params: Record<string, unknown> = {}, sid?: string) => {
      const id = msgId++;
      const msg: any = { id, method, params };
      if (sid) msg.sessionId = sid;
      try { ws.send(JSON.stringify(msg)); } catch {};
      return id;
    };

    let getTargetsId: number | null = null;
    let attachId: number | null = null;

    ws.onopen = () => { getTargetsId = send("Target.getTargets"); };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);

        if (msg.id === getTargetsId) {
          const page = (msg.result?.targetInfos || []).find((t: any) => t.type === "page");
          if (page) {
            attachId = send("Target.attachToTarget", { targetId: page.targetId, flatten: true });
          } else {
            resolved = true; clearTimeout(timer); try { ws.close(); } catch {} resolve();
          }
          return;
        }

        if (msg.id === attachId) {
          const cdpSession = msg.result?.sessionId;
          if (!cdpSession) { resolved = true; clearTimeout(timer); try { ws.close(); } catch {} resolve(); return; }
          // Set timezone & locale to match proxy geo, then done
          send("Emulation.setTimezoneOverride", { timezoneId: tz }, cdpSession);
          send("Emulation.setLocaleOverride", { locale: "en-US" }, cdpSession);
          console.log("Setup: Timezone & locale set ✓");
          // Give a moment for commands to process
          setTimeout(() => {
            if (!resolved) { resolved = true; clearTimeout(timer); try { ws.close(); } catch {} resolve(); }
          }, 500);
          return;
        }
      } catch {}
    };

    ws.onerror = () => { if (!resolved) { resolved = true; clearTimeout(timer); resolve(); } };
    ws.onclose = () => { if (!resolved) { resolved = true; clearTimeout(timer); resolve(); } };
  });
}

// ========== AI-Powered Extraction via Lovable AI Gateway ==========
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function aiExtractEarnings(domText: string): Promise<{ total: number; tips: number; subscriptions: number; messages: number; referrals: number; posts: number } | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) { console.warn("AI extraction: LOVABLE_API_KEY not set"); return null; }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an OnlyFans earnings data extractor. Given raw page text from an OnlyFans earnings/statements page, extract the financial data. All values should be numbers (USD). If a value is not found, return 0. The 'total' should be the overall net earnings amount." },
          { role: "user", content: domText.substring(0, 8000) },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_earnings",
            description: "Report extracted OnlyFans earnings data",
            parameters: {
              type: "object",
              properties: {
                total: { type: "number", description: "Total/net earnings in USD" },
                tips: { type: "number", description: "Tips earnings in USD" },
                subscriptions: { type: "number", description: "Subscription earnings in USD" },
                messages: { type: "number", description: "Messages/chat earnings in USD" },
                referrals: { type: "number", description: "Referral earnings in USD" },
                posts: { type: "number", description: "Posts earnings in USD" },
              },
              required: ["total", "tips", "subscriptions", "messages", "referrals", "posts"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_earnings" } },
      }),
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      console.warn(`AI extraction failed: ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      console.log("AI extraction result:", JSON.stringify(parsed));
      return {
        total: Number(parsed.total) || 0,
        tips: Number(parsed.tips) || 0,
        subscriptions: Number(parsed.subscriptions) || 0,
        messages: Number(parsed.messages) || 0,
        referrals: Number(parsed.referrals) || 0,
        posts: Number(parsed.posts) || 0,
      };
    }
    return null;
  } catch (e) {
    console.warn("AI extraction error:", e);
    return null;
  }
}

async function aiDetectLoginState(domText: string, currentUrl: string): Promise<{ logged_in: boolean; confidence: string; reason: string } | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) { console.warn("AI login detection: LOVABLE_API_KEY not set"); return null; }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an OnlyFans login state detector. Given raw page text and the current URL, determine if the user is logged into OnlyFans. Look for indicators like: navigation menus, profile elements, earnings data, chat lists (logged in) vs login forms, signup prompts, 'Enter your email' fields (not logged in). The URL being just 'https://onlyfans.com/' or containing '/login' usually means not logged in." },
          { role: "user", content: `URL: ${currentUrl}\n\nPage text:\n${domText.substring(0, 6000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "detect_login_state",
            description: "Report whether the user is logged into OnlyFans",
            parameters: {
              type: "object",
              properties: {
                logged_in: { type: "boolean", description: "Whether the user appears to be logged in" },
                confidence: { type: "string", enum: ["high", "medium", "low"], description: "Confidence level of the determination" },
                reason: { type: "string", description: "Brief explanation of why this determination was made" },
              },
              required: ["logged_in", "confidence", "reason"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "detect_login_state" } },
      }),
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      console.warn(`AI login detection failed: ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      console.log("AI login detection result:", JSON.stringify(parsed));
      return {
        logged_in: Boolean(parsed.logged_in),
        confidence: parsed.confidence || "low",
        reason: parsed.reason || "",
      };
    }
    return null;
  } catch (e) {
    console.warn("AI login detection error:", e);
    return null;
  }
}

// ========== Wait for session to be RUNNING with retries ==========
async function waitForSessionReady(apiKey: string, sessionId: string, maxWaitMs = 15000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const d = await bb(apiKey, `/sessions/${sessionId}`);
      if (d.status === "RUNNING") return true;
      if (d.status === "ERROR" || d.status === "TIMED_OUT") return false;
    } catch {}
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const BK = Deno.env.get("BROWSERBASE_API_KEY"), BP = Deno.env.get("BROWSERBASE_PROJECT_ID");
    if (!BK || !BP) throw new Error("Browserbase credentials not configured");
    const sUrl = Deno.env.get("SUPABASE_URL")!, sKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization");
    const body = await req.json();
    const { action, ...p } = body;

    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const sb = createClient(sUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const svc = createClient(sUrl, sKey);
    const { data: { user }, error: ue } = await sb.auth.getUser();
    if (ue || !user) return json({ error: "Unauthorized" }, 401);
    const uid = user.id;

    // ========== ADMIN-ONLY: REFRESH ALL CONTEXTS (authorized) ==========
    if (action === "refresh_all_contexts") {
      const { agencyId } = p;
      if (!agencyId) return json({ error: "agencyId required" }, 400);

      // Verify the caller owns this agency
      const { data: profile } = await svc.from("profiles").select("agency_id, user_type").eq("id", uid).single();
      if (!profile || profile.user_type !== "agency" || profile.agency_id !== agencyId) {
        return json({ error: "Unauthorized: only agency owners can refresh contexts" }, 403);
      }

      const { data: links } = await svc.from("creator_session_links")
        .select("id, creator_id, browserbase_context_id, platform")
        .eq("agency_id", agencyId)
        .eq("is_active", true);

      if (!links?.length) return json({ success: true, message: "No active session links found", refreshed: 0 });

      const results: any[] = [];
      for (const link of links) {
        try {
          const newCtx = await bb(BK, "/contexts", { method: "POST", body: JSON.stringify({ projectId: BP }) });
          if (!newCtx?.id) throw new Error("No context ID returned");

          await svc.from("creator_session_links").update({
            browserbase_context_id: newCtx.id,
            session_status: "pending",
            browserbase_session_id: null,
            browserbase_live_url: null,
            last_saved_at: null,
            updated_at: new Date().toISOString(),
          }).eq("id", link.id);

          results.push({ creatorId: link.creator_id, oldContext: link.browserbase_context_id, newContext: newCtx.id, status: "ok" });
          console.log(`Refreshed context for creator ${link.creator_id}: ${link.browserbase_context_id} → ${newCtx.id}`);
        } catch (err: any) {
          results.push({ creatorId: link.creator_id, status: "error", error: err.message });
          console.error(`Failed to refresh context for creator ${link.creator_id}:`, err.message);
        }
      }

      return json({ success: true, refreshed: results.filter(r => r.status === "ok").length, total: links.length, results });
    }

    // ========== CREATE ADMIN SESSION ==========
    if (action === "create_admin_session") {
      const { creatorId, platform, agencyId } = p;
      if (!creatorId || !platform || !agencyId) return json({ error: "creatorId, platform, agencyId required" }, 400);
      const { data: cr } = await svc.from("creators").select("proxy_country, proxy_state, name").eq("id", creatorId).single();
      
      const ctxId = await resolveContext(svc, BK, BP, creatorId, platform, agencyId, uid);
      
      const { data: existingLink } = await svc.from("creator_session_links")
        .select("id, session_status, browserbase_context_id, browserbase_session_id, last_saved_at")
        .eq("creator_id", creatorId)
        .eq("platform", platform)
        .maybeSingle();

      if (existingLink?.session_status === "authenticating" && existingLink?.browserbase_context_id) {
        if (existingLink.browserbase_session_id) {
          const alive = await isSessionAlive(BK, existingLink.browserbase_session_id);
          if (!alive) {
            console.log(`Recovering stuck session for creator ${creatorId} - old session is dead, context preserved`);
            await svc.from("creator_session_links").update({
              session_status: "authenticated",
              last_saved_at: existingLink.last_saved_at || new Date().toISOString(),
              browserbase_session_id: null,
              browserbase_live_url: null,
              updated_at: new Date().toISOString(),
            }).eq("id", existingLink.id);
          }
        }
      }

      const proxies = proxyConf(cr);
      const resolvedState = proxies[0]?.geolocation?.state || "TX";

      // Admin sessions: 30-minute timeout
      const sess = await bb(BK, "/sessions", { method: "POST", body: JSON.stringify(
        sessionBody(BP, ctxId, proxies, { timeout: 1800, userMetadata: { creatorId, agencyId, userId: uid, platform, sessionType: "admin" } })
      ) });
      
      if (!sess?.id) {
        console.error("Browserbase session creation returned no session ID", JSON.stringify(sess));
        return json({ error: "Failed to create browser session — no session ID returned" }, 502);
      }
      
      // Wait for session to be fully RUNNING
      console.log(`Waiting for session ${sess.id} to be ready (context=${ctxId})...`);
      const isReady = await waitForSessionReady(BK, sess.id, 20000);
      if (!isReady) {
        console.error(`Session ${sess.id} failed to reach RUNNING state`);
        return json({ error: "Browser session failed to start. Please try again." }, 502);
      }

      // Allow Browserbase time to fully restore persistent context (cookies, localStorage)
      // Without this delay, CDP connections can race ahead of cookie restoration
      console.log("Waiting 5s for context cookie restoration...");
      await new Promise(r => setTimeout(r, 5000));

      // Set timezone & locale to match proxy geo (no site visits)
      try {
        await preLoginSetup(BK, sess.id, resolvedState);
      } catch (e) {
        console.warn("Pre-login setup failed (non-fatal):", e);
      }

      // Navigate to the platform — cookies should already be loaded from context
      const startUrl = PLATFORM_URLS[platform.toLowerCase()];
      if (startUrl) {
        console.log(`Navigating to ${startUrl} (expecting cookie-based auto-login)...`);
        try {
          await navigateViaCDP(BK, sess.id, startUrl, { timeout: 30000 });
        } catch (e) {
          console.warn("CDP auto-navigate failed (non-fatal):", e);
        }
      }

      // Get embed URL
      await new Promise(r => setTimeout(r, 1500));
      const dbg = await bb(BK, `/sessions/${sess.id}/debug`);
      const liveUrl = dbg.pages?.[0]?.debuggerFullscreenUrl || dbg.debuggerFullscreenUrl;
      
      let slId: string;
      if (existingLink) {
        const { data } = await svc.from("creator_session_links").update({ browserbase_session_id: sess.id, browserbase_context_id: ctxId, browserbase_live_url: liveUrl, session_status: "authenticating", is_active: true, expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString(), updated_at: new Date().toISOString() }).eq("id", existingLink.id).select("id").single();
        slId = data!.id;
      } else {
        const { data } = await svc.from("creator_session_links").insert({ creator_id: creatorId, agency_id: agencyId, platform, created_by: uid, encrypted_session: "browserbase", browserbase_session_id: sess.id, browserbase_context_id: ctxId, browserbase_live_url: liveUrl, session_status: "authenticating", is_active: true, expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString() }).select("id").single();
        slId = data!.id;
      }
      await svc.from("active_browser_sessions").insert({ session_link_id: slId, agency_id: agencyId, browserbase_session_id: sess.id, browserbase_live_url: liveUrl, embed_url: liveUrl, session_type: "admin", viewer_count: 1, viewer_ids: [uid] });
      return json({ success: true, sessionLinkId: slId, embedUrl: liveUrl, sessionId: sess.id, contextId: ctxId });
    }

    // ========== SAVE AND CLOSE ==========
    if (action === "save_and_close") {
      const { sessionLinkId, browserbaseSessionId } = p;
      if (!sessionLinkId || !browserbaseSessionId) return json({ error: "sessionLinkId and browserbaseSessionId required" }, 400);

      const alive = await isSessionAlive(BK, browserbaseSessionId);

      // ===== LOGIN CHECK: Verify user is logged in before persisting cookies =====
      // Uses a two-phase approach: fast CDP selector pre-check, then AI-powered verification
      // for ambiguous cases. This prevents overwriting valid cookies with blank ones.
      let isLoggedIn = false;
      if (alive) {
        try {
          // Phase 1: Fast CDP selector pre-check + capture DOM text & URL for AI
          const loginCheckData = await new Promise<{ checkResult: string; domText: string; pageUrl: string }>((resolve) => {
            const ws = new WebSocket(`wss://connect.browserbase.com?apiKey=${BK}&sessionId=${browserbaseSessionId}`);
            let done = false;
            const timer = setTimeout(() => { if (!done) { done = true; try { ws.close(); } catch {} resolve({ checkResult: "unknown", domText: "", pageUrl: "" }); } }, 8000);
            let mid = 1;
            let getTargetsId: number | null = null;
            let attachId: number | null = null;
            let evalId: number | null = null;

            const send = (method: string, params: Record<string, unknown> = {}, sid?: string) => {
              const id = mid++;
              const msg: any = { id, method, params };
              if (sid) msg.sessionId = sid;
              ws.send(JSON.stringify(msg));
              return id;
            };

            ws.onopen = () => { getTargetsId = send("Target.getTargets"); };
            ws.onmessage = (evt) => {
              try {
                const msg = JSON.parse(evt.data);
                if (msg.id === getTargetsId) {
                  const page = (msg.result?.targetInfos || []).find((t: any) => t.type === "page");
                  if (page) { attachId = send("Target.attachToTarget", { targetId: page.targetId, flatten: true }); }
                  else { done = true; clearTimeout(timer); try { ws.close(); } catch {} resolve({ checkResult: "unknown", domText: "", pageUrl: "" }); }
                  return;
                }
                if (msg.id === attachId) {
                  const sid = msg.result?.sessionId;
                  if (sid) {
                    evalId = send("Runtime.evaluate", {
                      expression: `(function() {
                        var url = window.location.href;
                        var hasLoginForm = !!document.querySelector('form.b-loginreg, form[action*="login"], .b-loginreg, input[name="email"][type="text"]');
                        var onLoginPage = url.includes('/login') || url.includes('/signup') || url === 'https://onlyfans.com/' || url === 'https://onlyfans.com';
                        var hasNav = !!document.querySelector('.b-tabs, .l-header__menu, [data-name="ProfileMenu"], .b-sidebar, .b-make-post');
                        var cssResult;
                        if (hasNav && !hasLoginForm && !onLoginPage) cssResult = 'logged_in';
                        else if (hasLoginForm || onLoginPage) cssResult = 'not_logged_in';
                        else cssResult = 'ambiguous';
                        var domText = document.body ? document.body.innerText.substring(0, 6000) : '';
                        return JSON.stringify({ cssResult: cssResult, domText: domText, pageUrl: url });
                      })()`,
                      returnByValue: true,
                    }, sid);
                  }
                  return;
                }
                if (msg.id === evalId) {
                  const val = msg.result?.result?.value || '{"cssResult":"unknown","domText":"","pageUrl":""}';
                  try {
                    const parsed = JSON.parse(val);
                    done = true; clearTimeout(timer); try { ws.close(); } catch {};
                    resolve({ checkResult: parsed.cssResult || "unknown", domText: parsed.domText || "", pageUrl: parsed.pageUrl || "" });
                  } catch {
                    done = true; clearTimeout(timer); try { ws.close(); } catch {};
                    resolve({ checkResult: "unknown", domText: "", pageUrl: "" });
                  }
                  return;
                }
              } catch {}
            };
            ws.onerror = () => { if (!done) { done = true; clearTimeout(timer); resolve({ checkResult: "unknown", domText: "", pageUrl: "" }); } };
            ws.onclose = () => { if (!done) { done = true; clearTimeout(timer); resolve({ checkResult: "unknown", domText: "", pageUrl: "" }); } };
          });

          const { checkResult, domText: loginDomText, pageUrl } = loginCheckData;
          console.log(`Login CSS pre-check: ${checkResult} (url: ${pageUrl})`);

          if (checkResult === "logged_in") {
            isLoggedIn = true;
          } else if (checkResult === "not_logged_in") {
            isLoggedIn = false;
          } else {
            // Phase 2: Ambiguous/unknown — use AI to determine login state
            console.log("Login state ambiguous, invoking AI detection...");
            const aiResult = await aiDetectLoginState(loginDomText, pageUrl);
            if (aiResult && (aiResult.confidence === "high" || aiResult.confidence === "medium")) {
              isLoggedIn = aiResult.logged_in;
              console.log(`AI login detection: logged_in=${aiResult.logged_in}, confidence=${aiResult.confidence}, reason=${aiResult.reason}`);
            } else {
              // AI inconclusive — fail-open to preserve session
              isLoggedIn = true;
              console.log(`AI login detection inconclusive (${aiResult?.confidence || "no result"}), defaulting to persist`);
            }
          }

          console.log(`Save & Close: login state = ${checkResult}${checkResult === "ambiguous" ? " (AI-resolved)" : ""}, will ${isLoggedIn ? "PERSIST" : "SKIP PERSIST"} cookies`);
        } catch (e) {
          console.warn("Login check failed, defaulting to persist:", e);
          isLoggedIn = true; // Fail-open: persist if we can't determine
        }
      }

      // Get creator info from session link for earnings scraping
      const { data: sessionLink } = await svc.from("creator_session_links")
        .select("creator_id, platform")
        .eq("id", sessionLinkId)
        .single();

      // ===== CDP Earnings Scrape (before releasing session) =====
      let scrapedEarnings = null;
      if (alive && sessionLink?.platform?.toLowerCase() === "onlyfans") {
        try {
          console.log(`Scraping earnings for creator ${sessionLink.creator_id} before close...`);
          
          // ===== STRATEGY: Intercept OF's internal XHR API response via CDP Network domain =====
          // When navigating to /my/statistics/statements/earnings, OF makes an internal API call
          // (e.g. /api2/v2/earnings/chart) that returns structured JSON with earnings data.
          // We enable Network domain, navigate, and capture the JSON response — far more reliable
          // than parsing DOM innerText. DOM polling is kept as fallback.

          const scrapeWsUrl = `wss://connect.browserbase.com?apiKey=${BK}&sessionId=${browserbaseSessionId}`;
          
          const scrapeResult = await new Promise<{ json?: any; domText?: string }>((resolve) => {
            let done = false;
            const ws = new WebSocket(scrapeWsUrl);
            const timer = setTimeout(() => { if (!done) { done = true; try { ws.close(); } catch {} resolve({}); } }, 35000);
            let mid = 1;
            let cdpSid: string | null = null;
            const pendingBodyRequests = new Map<number, string>(); // tracked mid -> requestId
            const domPollIds = new Set<number>(); // tracked DOM poll evaluate IDs
            let earningsJson: any = null;
            let domText = "";
            let navigationConfirmed = false; // Guard: only DOM-poll after nav confirmed
            let xhrCaptured = false; // Guard: skip DOM polling once XHR captured
            let domPollCount = 0;
            const MAX_DOM_POLLS = 8;

            const send = (method: string, params: Record<string, unknown> = {}) => {
              const id = mid++;
              const msg: any = { id, method, params };
              if (cdpSid) msg.sessionId = cdpSid;
              try { ws.send(JSON.stringify(msg)); } catch {}
              return id;
            };

            const finish = () => {
              if (done) return;
              done = true; clearTimeout(timer);
              try { ws.close(); } catch {}
              resolve({ json: earningsJson, domText });
            };

            const startDomPoll = () => {
              // Guard: don't poll if XHR already captured or navigation not confirmed
              if (xhrCaptured || !navigationConfirmed || domPollCount >= MAX_DOM_POLLS || done) {
                if (!xhrCaptured && !earningsJson && !domText && domPollCount >= MAX_DOM_POLLS) {
                  console.warn("Earnings: DOM poll exhausted, no data found");
                }
                if (domPollCount >= MAX_DOM_POLLS || (!xhrCaptured && !navigationConfirmed)) finish();
                return;
              }
              domPollCount++;
              setTimeout(() => {
                if (done || xhrCaptured) return;
                const pollId = send("Runtime.evaluate", { expression: "document.body.innerText.substring(0,8000)", returnByValue: true });
                domPollIds.add(pollId);
              }, 1500);
            };

            // Tracked message IDs for robust response matching
            let getTargetsId: number | null = null;
            let attachId: number | null = null;
            let networkEnableId: number | null = null;
            let pageEnableId: number | null = null;
            let navigateId: number | null = null;

            ws.onopen = () => { getTargetsId = send("Target.getTargets"); };
            ws.onmessage = (evt) => {
              try {
                const msg = JSON.parse(evt.data);

                // Step 1: Get page target
                if (msg.id === getTargetsId) {
                  const page = (msg.result?.targetInfos || []).find((t: any) => t.type === "page");
                  if (page) { attachId = send("Target.attachToTarget", { targetId: page.targetId, flatten: true }); }
                  else { finish(); }
                  return;
                }

                // Step 2: Attach to page target
                if (msg.id === attachId && msg.result?.sessionId) {
                  cdpSid = msg.result.sessionId;
                  networkEnableId = send("Network.enable", {});
                  return;
                }

                // Step 3: Network enabled → enable Page + navigate
                if (msg.id === networkEnableId) {
                  console.log("CDP: Network.enable done, navigating to OF earnings page");
                  pageEnableId = send("Page.enable", {});
                  navigateId = send("Page.navigate", { url: "https://onlyfans.com/my/statistics/statements/earnings" });
                  return;
                }

                // Step 4: Navigate response confirms navigation started
                if (msg.id === navigateId) {
                  if (msg.error) {
                    console.error("CDP: Earnings navigate error:", msg.error);
                    finish();
                  } else {
                    navigationConfirmed = true;
                    console.log("CDP: Earnings navigation confirmed, starting DOM poll fallback");
                    // Start DOM polling as fallback (delayed, guarded by xhrCaptured)
                    setTimeout(() => startDomPoll(), 5000);
                  }
                  return;
                }

                // Intercept Network.responseReceived — look for earnings API calls
                if (msg.method === "Network.responseReceived") {
                  const resp = msg.params?.response;
                  const url = resp?.url || "";
                  const reqId = msg.params?.requestId;
                  if (reqId && (
                    url.includes("/api2/v2/earnings") ||
                    url.includes("/api2/v2/statics") ||  
                    url.includes("/api2/v2/statistics") ||
                    url.includes("statements/earnings") ||
                    (url.includes("/chart") && url.includes("earning"))
                  )) {
                    console.log(`CDP: Captured earnings API response: ${url}`);
                    const bodyMid = send("Network.getResponseBody", { requestId: reqId });
                    pendingBodyRequests.set(bodyMid, reqId);
                  }
                  return;
                }

                // Network.loadingFinished — request body for any tracked earnings request
                if (msg.method === "Network.loadingFinished") {
                  const reqId = msg.params?.requestId;
                  // Only request body if we haven't already for this request
                  if (reqId && !xhrCaptured) {
                    // Check if any pending body request already covers this
                    const alreadyRequested = [...pendingBodyRequests.values()].includes(reqId);
                    if (!alreadyRequested) {
                      // We don't blindly request all — only if we saw it in responseReceived
                      // (handled above). This event is informational.
                    }
                  }
                  return;
                }

                // Response body received (tracked by pendingBodyRequests)
                if (pendingBodyRequests.has(msg.id)) {
                  pendingBodyRequests.delete(msg.id);
                  const body = msg.result?.body;
                  if (body) {
                    try {
                      const parsed = JSON.parse(body);
                      console.log("CDP: Parsed earnings API JSON successfully, keys:", Object.keys(parsed));
                      earningsJson = parsed;
                      xhrCaptured = true; // Guard: stop DOM polling
                      finish();
                      return;
                    } catch {
                      console.log("CDP: Response body not JSON, length:", body.length);
                    }
                  }
                  return;
                }

                // DOM poll result (tracked by domPollIds)
                if (domPollIds.has(msg.id)) {
                  domPollIds.delete(msg.id);
                  if (xhrCaptured) return; // XHR already got data, ignore DOM
                  const text = msg.result?.result?.value;
                  if (typeof text === "string" && text.length > 200) {
                    console.log(`Earnings DOM poll ${domPollCount}/${MAX_DOM_POLLS}: text length=${text.length}`);
                    if (/\$[\d,]+/.test(text) || /(?:subscriptions|tips|messages|earnings)/i.test(text)) {
                      domText = text;
                      console.log("Earnings data detected in DOM text");
                      // Give JSON interception 3 more seconds before finishing with DOM
                      setTimeout(() => { if (!done && !xhrCaptured) finish(); }, 3000);
                      return;
                    }
                  }
                  // Continue polling if no data yet
                  startDomPoll();
                  return;
                }

              } catch (e) {
                console.warn("CDP scrape message parse error:", e);
              }
            };
            ws.onerror = () => { if (!done) { done = true; clearTimeout(timer); resolve({}); } };
            ws.onclose = () => { if (!done) { done = true; clearTimeout(timer); resolve({}); } };
          });

          // ===== Parse results: prefer JSON, fallback to DOM text =====
          let bestTotal = 0, tips = 0, subs = 0, messages = 0, referrals = 0, posts = 0;
          let earningsSource = "none";

          if (scrapeResult.json) {
            console.log("Using XHR-intercepted JSON for earnings extraction");
            const d = scrapeResult.json.data || scrapeResult.json;
            const getNet = (obj: any): number => {
              if (typeof obj === "number") return obj;
              if (obj?.total !== undefined) return Number(obj.total) || 0;
              if (obj?.net !== undefined) return Number(obj.net) || 0;
              if (obj?.total_net !== undefined) return Number(obj.total_net) || 0;
              return 0;
            };

            const totalNet = getNet(d.total || d.all);
            const tipsNet = getNet(d.tips);
            const subsNet = getNet(d.subscribes || d.subscriptions);
            const msgsNet = getNet(d.messages || d.chat_messages);
            const postsNet = getNet(d.post || d.posts);
            const refsNet = getNet(d.referrals);
            const streamsNet = getNet(d.stream || d.streams);

            bestTotal = totalNet || (tipsNet + subsNet + msgsNet + postsNet + refsNet + streamsNet);
            tips = tipsNet; subs = subsNet; messages = msgsNet; posts = postsNet; referrals = refsNet;
            earningsSource = "xhr";
            console.log(`Earnings from JSON: total=${totalNet}, tips=${tips}, subs=${subs}, msgs=${messages}, posts=${posts}, refs=${referrals}, streams=${streamsNet}, best=${bestTotal}`);
          }
          
          if (bestTotal === 0 && scrapeResult.domText) {
            console.log("Falling back to AI-powered DOM text extraction");
            const rawText = scrapeResult.domText;
            console.log("Earnings raw DOM text (first 800 chars):", rawText.substring(0, 800));

            // Phase 1: Try AI extraction
            const aiEarnings = await aiExtractEarnings(rawText);
            if (aiEarnings && aiEarnings.total > 0) {
              earningsSource = "ai";
              bestTotal = aiEarnings.total;
              tips = aiEarnings.tips;
              subs = aiEarnings.subscriptions;
              messages = aiEarnings.messages;
              referrals = aiEarnings.referrals;
              posts = aiEarnings.posts;
              console.log(`Earnings from AI: total=${bestTotal}, tips=${tips}, subs=${subs}, msgs=${messages}, refs=${referrals}, posts=${posts}`);
            } else {
              // Phase 2: Regex fallback if AI fails
              console.log("AI extraction returned no data, falling back to regex parsing");
              earningsSource = "dom";

              const parseAmount = (labels: string[]): number => {
                for (const label of labels) {
                  const nlPat = new RegExp(label + `\\s*\\n\\s*\\$\\s*([\\d,]+\\.?\\d*)`, "i");
                  const nlMatch = rawText.match(nlPat);
                  if (nlMatch) {
                    const val = parseFloat(nlMatch[1].replace(/,/g, ""));
                    if (!isNaN(val) && val > 0) return val;
                  }
                  const inlinePat = new RegExp(label + `[:\\s]+\\$\\s*([\\d,]+\\.?\\d*)`, "i");
                  const inlineMatch = rawText.match(inlinePat);
                  if (inlineMatch) {
                    const val = parseFloat(inlineMatch[1].replace(/,/g, ""));
                    if (!isNaN(val) && val > 0) return val;
                  }
                }
                return 0;
              };

              const totalEarnings = parseAmount(["total", "net", "earnings", "total earnings", "net earnings"]);
              tips = parseAmount(["tips"]);
              subs = parseAmount(["subscriptions", "subscription"]);
              messages = parseAmount(["messages", "messaging", "chat messages", "chat"]);
              referrals = parseAmount(["referrals", "referral"]);
              posts = parseAmount(["posts", "post"]);

              let fallbackTotal = 0;
              if (!totalEarnings) {
                const allAmounts = [...rawText.matchAll(/\$\s*([\d,]+\.?\d{0,2})/g)]
                  .map(m => parseFloat(m[1].replace(/,/g, "")))
                  .filter(v => !isNaN(v) && v > 0);
                if (allAmounts.length > 0) {
                  fallbackTotal = Math.max(...allAmounts);
                  console.log(`Earnings fallback: found ${allAmounts.length} dollar amounts, max=$${fallbackTotal}`);
                }
              }

              console.log(`Earnings parsed (regex): total=${totalEarnings}, tips=${tips}, subs=${subs}, msgs=${messages}, refs=${referrals}, posts=${posts}, fallback=${fallbackTotal}`);
              bestTotal = totalEarnings || (tips + subs + messages + referrals + posts) || fallbackTotal;
            }
          }

          // Upsert earnings if we got data from either path
          if (bestTotal > 0) {
            const now = new Date();
            const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
            const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

            const { data: existing } = await svc.from("creator_earnings")
              .select("id")
              .eq("creator_id", sessionLink.creator_id)
              .eq("period_start", periodStart)
              .eq("period_end", periodEnd)
              .maybeSingle();

            const earningsPayload = {
              creator_id: sessionLink.creator_id,
              amount: bestTotal,
              tips: tips || 0,
              subscriptions: subs || 0,
              messages_revenue: messages || 0,
              referrals: referrals || 0,
              period_start: periodStart,
              period_end: periodEnd,
              platform: "onlyfans",
              notes: `Auto-scraped (${earningsSource}) on ${now.toISOString().split("T")[0]}`,
            };

            if (existing) {
              await svc.from("creator_earnings").update(earningsPayload).eq("id", existing.id);
              console.log(`Updated earnings for creator ${sessionLink.creator_id}: $${bestTotal} (${earningsSource})`);
            } else {
              await svc.from("creator_earnings").insert(earningsPayload);
              console.log(`Inserted earnings for creator ${sessionLink.creator_id}: $${bestTotal} (${earningsSource})`);
            }

            scrapedEarnings = { total: bestTotal, tips, subscriptions: subs, messages, referrals };
          } else {
            console.warn("Earnings scrape: no meaningful values found");
          }
        } catch (e: any) {
          console.warn(`Earnings scrape failed (non-fatal): ${e.message}`);
        }
      }

      // Update DB
      if (isLoggedIn) {
        // User is logged in — safe to persist cookies via REQUEST_RELEASE
        await svc.from("creator_session_links").update({ 
          session_status: "authenticated", 
          last_saved_at: new Date().toISOString(), 
          browserbase_session_id: null, 
          browserbase_live_url: null, 
          updated_at: new Date().toISOString() 
        }).eq("id", sessionLinkId);
      } else {
        // NOT logged in — do NOT persist cookies (would overwrite valid ones)
        // Keep existing session_status and last_saved_at unchanged
        console.warn("Session was NOT logged in — skipping cookie persistence to protect existing context");
        await svc.from("creator_session_links").update({ 
          browserbase_session_id: null, 
          browserbase_live_url: null, 
          updated_at: new Date().toISOString() 
        }).eq("id", sessionLinkId);
      }
      
      await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString(), viewer_count: 0, viewer_ids: [] }).eq("browserbase_session_id", browserbaseSessionId);

      // Release session — only persist context if logged in
      if (alive) {
        if (isLoggedIn) {
          try { 
            await fetch(`${BB_API}/sessions/${browserbaseSessionId}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); 
            console.log(`Session ${browserbaseSessionId} released with cookie persistence ✓`);
          } catch (e) {
            console.warn(`Failed to release session ${browserbaseSessionId} (non-fatal):`, e);
          }
        } else {
          // Close without persisting — just disconnect (session will auto-expire)
          try {
            await fetch(`${BB_API}/sessions/${browserbaseSessionId}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE", persist: false }) });
            console.log(`Session ${browserbaseSessionId} closed WITHOUT cookie persistence (not logged in)`);
          } catch (e) {
            console.warn(`Failed to close session ${browserbaseSessionId} (non-fatal):`, e);
          }
        }
      }
      
      return json({ 
        success: true, 
        loginDetected: isLoggedIn,
        message: isLoggedIn
          ? (scrapedEarnings ? `Login saved. Earnings scraped: $${scrapedEarnings.total}` : "Login saved. Cookies and session data persisted.")
          : "Session closed. Cookies were NOT saved (not logged in) — existing login preserved.",
        earnings: scrapedEarnings,
      });
    }

    // ========== CHECK AND RECOVER SESSIONS ==========
    if (action === "check_and_recover_sessions") {
      const { agencyId } = p;
      if (!agencyId) return json({ error: "agencyId required" }, 400);
      
      const { data: stuck } = await svc.from("creator_session_links")
        .select("id, browserbase_session_id, browserbase_context_id, last_saved_at")
        .eq("agency_id", agencyId)
        .eq("session_status", "authenticating");
      
      const recovered: string[] = [];
      for (const link of stuck || []) {
        let shouldRecover = false;
        if (link.browserbase_session_id) {
          const alive = await isSessionAlive(BK, link.browserbase_session_id);
          if (!alive) shouldRecover = true;
        } else {
          shouldRecover = true;
        }
        if (shouldRecover) {
          await svc.from("creator_session_links").update({
            session_status: link.browserbase_context_id ? "authenticated" : "pending",
            last_saved_at: link.last_saved_at || (link.browserbase_context_id ? new Date().toISOString() : null),
            browserbase_session_id: null,
            browserbase_live_url: null,
            updated_at: new Date().toISOString(),
          }).eq("id", link.id);
          recovered.push(link.id);
          console.log(`Recovered stuck session link ${link.id}`);
        }
      }
      
      const { data: activeSessions } = await svc.from("active_browser_sessions")
        .select("id, browserbase_session_id")
        .eq("agency_id", agencyId)
        .eq("is_active", true);
      
      let cleanedActive = 0;
      for (const s of activeSessions || []) {
        const alive = await isSessionAlive(BK, s.browserbase_session_id);
        if (!alive) {
          await svc.from("active_browser_sessions").update({ 
            is_active: false, ended_at: new Date().toISOString(), viewer_count: 0, viewer_ids: [] 
          }).eq("id", s.id);
          cleanedActive++;
        }
      }
      
      return json({ success: true, recoveredCount: recovered.length, recoveredIds: recovered, cleanedActiveSessions: cleanedActive });
    }

    // ========== SESSION POOLING: launch_chatter_session ==========
    if (action === "launch_chatter_session") {
      const { sessionLinkId, chatterId } = p;
      if (!sessionLinkId) return json({ error: "sessionLinkId required" }, 400);
      const { data: link, error: le } = await svc.from("creator_session_links").select("*").eq("id", sessionLinkId).single();
      if (le || !link) return json({ error: "Session link not found" }, 404);
      const { data: emp } = await svc.from("employees").select("id").eq("auth_user_id", uid).maybeSingle();
      if (!emp) return json({ error: "Employee not found" }, 403);
      const { data: perm } = await svc.from("employee_of_permissions").select("*").eq("employee_id", emp.id).eq("creator_id", link.creator_id).maybeSingle();
      if (!perm) return json({ error: "Not authorized" }, 403);
      if (!link.is_active) return json({ error: "Session revoked" }, 400);
      if (new Date(link.expires_at) < new Date()) return json({ error: "Session expired" }, 400);
      if (!link.browserbase_context_id) return json({ error: "Not authenticated yet" }, 400);

      // Build permission flags once (used for both join and new session paths)
      const permFlags = {
        can_view_chats: perm.can_view_chats ?? false,
        can_send_messages: perm.can_send_messages ?? false,
        can_send_mass_messages: perm.can_send_mass_messages ?? false,
        can_view_fans: perm.can_view_fans ?? false,
        can_view_posts: perm.can_view_posts ?? false,
        can_create_posts: perm.can_create_posts ?? false,
        can_view_vault: perm.can_view_vault ?? false,
        can_view_earnings: perm.can_view_earnings ?? false,
        can_view_notifications: perm.can_view_notifications ?? false,
      };

      const { data: agency } = await svc.from("agencies").select("browser_session_mode").eq("id", link.agency_id).single();
      const sessionMode = agency?.browser_session_mode || "shared";

      const { data: existingSessions } = await svc.from("active_browser_sessions")
        .select("id, browserbase_session_id, embed_url, viewer_count, viewer_ids, session_link_id, chatter_id")
        .eq("session_link_id", sessionLinkId)
        .eq("is_active", true)
        .eq("session_type", "chatter")
        .order("started_at", { ascending: false })
        .limit(1);

      const existingSession = existingSessions?.[0];

      if (existingSession) {
        const alive = await isSessionAlive(BK, existingSession.browserbase_session_id);
        if (alive) {
          if (sessionMode === "exclusive") {
            let inUseBy = "another chatter";
            if (existingSession.chatter_id) {
              const { data: chatter } = await svc.from("chatters").select("name").eq("id", existingSession.chatter_id).maybeSingle();
              if (chatter) inUseBy = chatter.name;
            }
            return json({ error: `Session in use by ${inUseBy}. Please wait until they finish.`, code: "SESSION_IN_USE", inUseBy }, 409);
          }

          const currentViewerIds: string[] = existingSession.viewer_ids || [];
          const viewerId = chatterId || uid;
          if (!currentViewerIds.includes(viewerId)) {
            currentViewerIds.push(viewerId);
          }

          await svc.from("active_browser_sessions").update({
            viewer_count: currentViewerIds.length,
            viewer_ids: currentViewerIds,
            last_heartbeat_at: new Date().toISOString(),
          }).eq("id", existingSession.id);

          await svc.from("session_access_logs").insert({ session_link_id: sessionLinkId, chatter_id: chatterId, action: "join" });


          console.log(`Chatter ${viewerId} joined existing session ${existingSession.browserbase_session_id} (viewer count: ${currentViewerIds.length})`);
          return json({ success: true, embedUrl: existingSession.embed_url, sessionId: existingSession.browserbase_session_id, platform: link.platform, permissions: permFlags, joined: true, viewerCount: currentViewerIds.length });
        } else {
          await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString(), viewer_count: 0, viewer_ids: [] }).eq("id", existingSession.id);
          console.log(`Cleaned up dead session ${existingSession.browserbase_session_id}`);
        }
      }

      // Create new session
      const { data: cr } = await svc.from("creators").select("proxy_country, proxy_state, name").eq("id", link.creator_id).single();
      const { data: exts } = await svc.from("browser_extensions").select("browserbase_extension_id").eq("agency_id", link.agency_id).eq("is_active", true).eq("auto_inject", true);
      const extIds = (exts || []).map((e: any) => e.browserbase_extension_id).filter(Boolean);

      const proxies = proxyConf(cr);
      const resolvedState = proxies[0]?.geolocation?.state || "TX";

      const cfg = sessionBody(BP, link.browserbase_context_id, proxies, {
        timeout: 3600,
        extensionId: extIds[0] || undefined,
        userMetadata: { creatorId: link.creator_id, agencyId: link.agency_id, chatterId: chatterId || uid, platform: link.platform, sessionType: "chatter" },
      });
      const sess = await bb(BK, "/sessions", { method: "POST", body: JSON.stringify(cfg) });
      if (!sess?.id) {
        console.error("Browserbase chatter session creation returned no session ID", JSON.stringify(sess));
        return json({ error: "Failed to create browser session — no session ID returned" }, 502);
      }
      
      // Wait for session to be fully RUNNING
      const chatterReady = await waitForSessionReady(BK, sess.id, 20000);
      if (!chatterReady) {
        console.error(`Chatter session ${sess.id} failed to reach RUNNING state`);
        return json({ error: "Browser session failed to start. Please try again." }, 502);
      }

      // Allow Browserbase time to fully restore persistent context (cookies, localStorage)
      console.log("Waiting 5s for context cookie restoration (chatter)...");
      await new Promise(r => setTimeout(r, 5000));

      // Set timezone & locale to match proxy geo (no site visits)
      try {
        await preLoginSetup(BK, sess.id, resolvedState);
      } catch (e) {
        console.warn("Chatter pre-login setup failed (non-fatal):", e);
      }

      // Navigate via CDP + DOM-based login verification
      let loginVerified = true;
      if (chatterStartUrl) {
        try {
          const navResult = await navigateViaCDP(BK, sess.id, chatterStartUrl, {
            timeout: 25000,
            evaluate: `(function() {
              var url = window.location.href;
              var hasLoginForm = !!document.querySelector('form.b-loginreg, form[action*="login"], .b-loginreg');
              var hasNav = !!document.querySelector('.b-tabs, .l-header__menu, [data-name="ProfileMenu"]');
              var onLoginPage = url.includes('/login') || url.includes('/signup');
              if (hasNav && !hasLoginForm && !onLoginPage) return JSON.stringify({ isLoggedIn: true, indicator: 'nav_elements_present' });
              if (hasLoginForm || onLoginPage) return JSON.stringify({ isLoggedIn: false, indicator: hasLoginForm ? 'login_form_found' : 'login_url_detected' });
              return JSON.stringify({ isLoggedIn: true, indicator: 'no_login_indicators' });
            })()`,
          });

          if (navResult.success && navResult.result) {
            try {
              const loginState = JSON.parse(navResult.result as string);
              loginVerified = loginState.isLoggedIn;
              if (!loginVerified) {
                console.warn(`Login verification failed for creator ${link.creator_id}: ${loginState.indicator}`);
                await svc.from("creator_session_links").update({
                  session_status: "pending",
                  updated_at: new Date().toISOString(),
                }).eq("id", sessionLinkId);

                await svc.from("browser_session_events").insert({
                  agency_id: link.agency_id,
                  session_link_id: sessionLinkId,
                  browserbase_session_id: sess.id,
                  event_type: "login_expired",
                  severity: "warning",
                  title: "Login Expired",
                  message: `Creator session needs re-authentication. Detected: ${loginState.indicator}`,
                });
              }
            } catch {
              console.warn("Login state parse failed (non-fatal)");
            }
          }
        } catch (e) {
          console.warn("CDP chatter nav failed (non-fatal):", e);
        }
      }

      await new Promise(r => setTimeout(r, 1500));
      const dbg = await bb(BK, `/sessions/${sess.id}/debug`);
      const liveUrl = dbg.pages?.[0]?.debuggerFullscreenUrl || dbg.debuggerFullscreenUrl;
      const viewerId = chatterId || uid;
      await svc.from("active_browser_sessions").insert({ session_link_id: sessionLinkId, chatter_id: chatterId, agency_id: link.agency_id, browserbase_session_id: sess.id, browserbase_live_url: liveUrl, embed_url: liveUrl, session_type: "chatter", viewer_count: 1, viewer_ids: [viewerId], last_heartbeat_at: new Date().toISOString() });
      await svc.from("session_access_logs").insert({ session_link_id: sessionLinkId, chatter_id: chatterId, action: "launch" });
      return json({ success: true, embedUrl: liveUrl, sessionId: sess.id, platform: link.platform, permissions: permFlags, joined: false, viewerCount: 1, loginVerified });
    }

    // ========== VIEWER-AWARE TERMINATE ==========
    if (action === "terminate_session") {
      const { browserbaseSessionId, chatterId: terminatingChatterId } = p;
      if (!browserbaseSessionId) return json({ error: "browserbaseSessionId required" }, 400);

      const { data: session } = await svc.from("active_browser_sessions")
        .select("id, viewer_count, viewer_ids")
        .eq("browserbase_session_id", browserbaseSessionId)
        .eq("is_active", true)
        .maybeSingle();

      if (session) {
        const currentViewerIds: string[] = session.viewer_ids || [];
        const viewerId = terminatingChatterId || uid;
        const updatedViewerIds = currentViewerIds.filter((id: string) => id !== viewerId);
        const newViewerCount = Math.max(0, updatedViewerIds.length);

        if (newViewerCount <= 0) {
          try { await fetch(`${BB_API}/sessions/${browserbaseSessionId}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); } catch {}
          await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString(), viewer_count: 0, viewer_ids: [] }).eq("id", session.id);
          console.log(`Last viewer left — session ${browserbaseSessionId} released`);
        } else {
          await svc.from("active_browser_sessions").update({ viewer_count: newViewerCount, viewer_ids: updatedViewerIds }).eq("id", session.id);
          console.log(`Viewer ${viewerId} left session ${browserbaseSessionId} (${newViewerCount} remaining)`);
        }
      } else {
        try { await fetch(`${BB_API}/sessions/${browserbaseSessionId}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); } catch {}
        await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString() }).eq("browserbase_session_id", browserbaseSessionId);
      }

      return json({ success: true });
    }

    // ========== SESSION HEARTBEAT ==========
    if (action === "session_heartbeat") {
      const { browserbaseSessionId } = p;
      if (!browserbaseSessionId) return json({ error: "browserbaseSessionId required" }, 400);

      await svc.from("active_browser_sessions").update({
        last_heartbeat_at: new Date().toISOString(),
      }).eq("browserbase_session_id", browserbaseSessionId).eq("is_active", true);

      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: stale } = await svc.from("active_browser_sessions")
        .select("id, browserbase_session_id, viewer_ids")
        .eq("is_active", true)
        .eq("session_type", "chatter")
        .lt("last_heartbeat_at", fiveMinAgo);

      for (const s of stale || []) {
        console.log(`Cleaning up stale session ${s.browserbase_session_id}`);
        try { await fetch(`${BB_API}/sessions/${s.browserbase_session_id}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); } catch {}
        await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString(), viewer_count: 0, viewer_ids: [] }).eq("id", s.id);
      }

      return json({ success: true });
    }

    if (action === "get_session_status") {
      const { browserbaseSessionId } = p;
      if (!browserbaseSessionId) return json({ error: "browserbaseSessionId required" }, 400);
      try { const d = await bb(BK, `/sessions/${browserbaseSessionId}`); return json({ active: d.status === "RUNNING", status: d.status, createdAt: d.createdAt }); } catch { return json({ active: false, status: "UNKNOWN" }); }
    }

    if (action === "get_session_recording") {
      if (!p.browserbaseSessionId) return json({ error: "browserbaseSessionId required" }, 400);
      try { return json({ success: true, recording: await bb(BK, `/sessions/${p.browserbaseSessionId}/recording`) }); } catch (e: any) { return json({ error: e.message }, 404); }
    }

    if (action === "get_session_logs") {
      if (!p.browserbaseSessionId) return json({ error: "browserbaseSessionId required" }, 400);
      try { return json({ success: true, logs: await bb(BK, `/sessions/${p.browserbaseSessionId}/logs`) }); } catch (e: any) { return json({ error: e.message }, 404); }
    }

    if (action === "get_session_downloads") {
      if (!p.browserbaseSessionId) return json({ error: "browserbaseSessionId required" }, 400);
      try { return json({ success: true, downloads: await bb(BK, `/sessions/${p.browserbaseSessionId}/downloads`) }); } catch (e: any) { return json({ error: e.message }, 404); }
    }

    // ========== NAVIGATE IN SESSION (CDP) ==========
    if (action === "navigate_in_session") {
      const { browserbaseSessionId, command, url } = p;
      if (!browserbaseSessionId) return json({ error: "browserbaseSessionId required" }, 400);
      if (!command) return json({ error: "command required (goto|back|forward|reload)" }, 400);

      try {
        const wsUrl = `wss://connect.browserbase.com?apiKey=${BK}&sessionId=${browserbaseSessionId}`;
        const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
          let mid = 1;
          let resolved = false;
          const ws = new WebSocket(wsUrl);
          const timer = setTimeout(() => {
            if (!resolved) { resolved = true; try { ws.close(); } catch {} resolve({ success: true }); }
          }, 10000);

          const send = (method: string, params: Record<string, unknown> = {}) => {
            const id = mid++;
            ws.send(JSON.stringify({ id, method, params }));
            return id;
          };

          let getTargetsId: number | null = null;
          let attachId: number | null = null;
          let commandId: number | null = null;

          ws.onopen = () => { getTargetsId = send("Target.getTargets"); };
          ws.onmessage = (ev) => {
            try {
              const msg = JSON.parse(ev.data as string);
              if (msg.id === getTargetsId && msg.result?.targetInfos) {
                const page = msg.result.targetInfos.find((t: any) => t.type === "page");
                if (page) {
                  attachId = send("Target.attachToTarget", { targetId: page.targetId, flatten: true });
                } else {
                  resolved = true; clearTimeout(timer); ws.close(); resolve({ success: false, error: "No page target" });
                }
              } else if (msg.id === attachId && msg.result?.sessionId) {
                // Attached — send the navigation command
                if (command === "goto" && url) {
                  commandId = send("Page.navigate", { url });
                } else if (command === "back") {
                  commandId = send("Runtime.evaluate", { expression: "history.back()" });
                } else if (command === "forward") {
                  commandId = send("Runtime.evaluate", { expression: "history.forward()" });
                } else if (command === "reload") {
                  commandId = send("Page.reload");
                } else {
                  resolved = true; clearTimeout(timer); ws.close(); resolve({ success: false, error: "Invalid command" });
                }
              } else if (msg.id === commandId) {
                resolved = true; clearTimeout(timer); ws.close(); resolve({ success: true });
              }
            } catch {}
          };
          ws.onerror = () => { if (!resolved) { resolved = true; clearTimeout(timer); resolve({ success: false, error: "WebSocket error" }); } };
        });
        return json(result);
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ========== INJECT SIDEBAR RESTRICTIONS (CDP) ==========
    if (action === "inject_sidebar_restrictions") {
      const { browserbaseSessionId: bbSid, hideStatements, hideStatistics, hideMore } = p;
      if (!bbSid) return json({ error: "browserbaseSessionId required" }, 400);

      const cssRules: string[] = [];
      if (hideStatements) cssRules.push('a[href="/my/statements"] { display: none !important; }');
      if (hideStatistics) cssRules.push('a[href="/my/statistics"] { display: none !important; }');
      if (hideMore) cssRules.push('[data-name="more"], a[href="/more"] { display: none !important; }');

      if (cssRules.length === 0) return json({ success: true, message: "No restrictions to inject" });

      const injectionScript = `
        (function() {
          if (document.getElementById('creatoros-sidebar-restrictions')) return;
          var style = document.createElement('style');
          style.id = 'creatoros-sidebar-restrictions';
          style.textContent = ${JSON.stringify(cssRules.join('\n'))};
          (document.head || document.documentElement).appendChild(style);
          // Re-inject on SPA navigation via MutationObserver
          var obs = new MutationObserver(function() {
            if (!document.getElementById('creatoros-sidebar-restrictions')) {
              var s2 = document.createElement('style');
              s2.id = 'creatoros-sidebar-restrictions';
              s2.textContent = style.textContent;
              (document.head || document.documentElement).appendChild(s2);
            }
          });
          obs.observe(document.documentElement, { childList: true, subtree: true });
        })();
      `;

      try {
        const wsUrl = `wss://connect.browserbase.com?apiKey=${BK}&sessionId=${bbSid}`;
        const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
          let mid = 1;
          let resolved = false;
          const ws = new WebSocket(wsUrl);
          const timer = setTimeout(() => {
            if (!resolved) { resolved = true; try { ws.close(); } catch {} resolve({ success: true }); }
          }, 10000);

          const send = (method: string, params: Record<string, unknown> = {}) => {
            const id = mid++;
            ws.send(JSON.stringify({ id, method, params }));
            return id;
          };

          let getTargetsId: number | null = null;
          let attachId: number | null = null;
          let evalId: number | null = null;

          ws.onopen = () => { getTargetsId = send("Target.getTargets"); };
          ws.onmessage = (ev) => {
            try {
              const msg = JSON.parse(ev.data as string);
              if (msg.id === getTargetsId && msg.result?.targetInfos) {
                const page = msg.result.targetInfos.find((t: any) => t.type === "page");
                if (page) {
                  attachId = send("Target.attachToTarget", { targetId: page.targetId, flatten: true });
                } else {
                  resolved = true; clearTimeout(timer); ws.close(); resolve({ success: false, error: "No page target" });
                }
              } else if (msg.id === attachId && msg.result?.sessionId) {
                const sid = msg.result.sessionId;
                const id = mid++;
                ws.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression: injectionScript, returnByValue: true }, sessionId: sid }));
                evalId = id;
              } else if (msg.id === evalId) {
                resolved = true; clearTimeout(timer); ws.close(); resolve({ success: true });
              }
            } catch {}
          };
          ws.onerror = () => { if (!resolved) { resolved = true; clearTimeout(timer); resolve({ success: false, error: "WebSocket error" }); } };
        });
        return json(result);
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    if (action === "check_captcha_events") {
      const { browserbaseSessionId, agencyId, sessionLinkId } = p;
      if (!browserbaseSessionId) return json({ error: "browserbaseSessionId required" }, 400);
      try {
        const logs = await bb(BK, `/sessions/${browserbaseSessionId}/logs`);
        const evts: any[] = [];
        if (Array.isArray(logs)) {
          for (const l of logs) {
            const m = typeof l === "string" ? l : JSON.stringify(l);
            const lo = m.toLowerCase();
            if (lo.includes("captcha") || lo.includes("challenge") || lo.includes("recaptcha") || lo.includes("hcaptcha")) {
              evts.push({ timestamp: l.timestamp || new Date().toISOString(), message: m, type: lo.includes("solved") || lo.includes("success") ? "captcha_solved" : "captcha_detected" });
            }
          }
        }
        if (evts.length > 0 && agencyId) {
          await svc.from("browser_session_events").insert(evts.map(e => ({ agency_id: agencyId, session_link_id: sessionLinkId || null, browserbase_session_id: browserbaseSessionId, event_type: e.type, severity: e.type === "captcha_detected" ? "warning" : "info", title: e.type === "captcha_detected" ? "CAPTCHA Detected" : "CAPTCHA Solved", message: e.message, metadata: { timestamp: e.timestamp } })));
        }
        return json({ success: true, captchaEvents: evts, count: evts.length });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (action === "upload_extension") {
      const { agencyId, name, description } = p;
      if (!name) return json({ error: "Extension name required" }, 400);
      const { data, error } = await svc.from("browser_extensions").insert({ agency_id: agencyId, name, description: description || null }).select("id").single();
      if (error) throw new Error(error.message);
      return json({ success: true, extensionId: data.id, message: "Extension record created." });
    }

    if (action === "list_extensions") {
      try { return json({ success: true, extensions: await bb(BK, `/extensions?projectId=${BP}`) }); } catch { return json({ success: true, extensions: [] }); }
    }

    // ========== PROFILE WARMUP: warmup_single_profile (CDP-powered) ==========
    if (action === "warmup_single_profile") {
      const { creatorId, agencyId, warmupType = "generic", contextId, keywords } = p;
      if (!agencyId) return json({ error: "agencyId required" }, 400);

      let bbContextId = contextId;
      const targetCreatorId = creatorId || null;

      if (creatorId && !bbContextId) {
        bbContextId = await resolveContext(svc, BK, BP, creatorId, "onlyfans", agencyId, uid);
      }

      if (!bbContextId) return json({ error: "No context available for warmup" }, 400);

      const { data: warmupRec, error: wErr } = await svc.from("creator_profile_warmups").insert({
        creator_id: targetCreatorId, agency_id: agencyId, browserbase_context_id: bbContextId,
        status: "running", warmup_type: warmupType,
        total_sites: warmupType === "generic" ? 10 : warmupType === "research" ? 15 : 25,
        started_at: new Date().toISOString(),
      }).select("id").single();
      if (wErr) throw new Error(wErr.message);
      const warmupId = warmupRec.id;

      let proxySettings = null;
      if (creatorId) {
        const { data: cr } = await svc.from("creators").select("proxy_country, proxy_state").eq("id", creatorId).maybeSingle();
        if (cr) proxySettings = cr;
      }

      try {
        const proxies = proxySettings ? proxyConf(proxySettings) : [];
        const sessPayload = sessionBody(BP, bbContextId, proxies, {
          keepAlive: false, timeout: 600,
          userMetadata: { warmup: true, agencyId, creatorId: targetCreatorId },
        });

        const sess = await bb(BK, "/sessions", { method: "POST", body: JSON.stringify(sessPayload) });
        if (!sess?.id) throw new Error("Session creation failed");

        const sessReady = await waitForSessionReady(BK, sess.id, 15000);
        if (!sessReady) throw new Error("Session failed to start");

        let sitesVisited = 0;

        // ===== Phase 1: Generic warmup (navigate + scroll) =====
        if (warmupType === "generic" || warmupType === "full") {
          const genericSites = [
            "https://www.google.com/search?q=best+movies+2026",
            "https://www.youtube.com",
            "https://www.reddit.com",
            "https://www.x.com",
            "https://www.instagram.com",
            "https://www.amazon.com/s?k=wireless+headphones",
            "https://en.wikipedia.org/wiki/Main_Page",
            "https://www.espn.com",
            "https://weather.com",
            "https://www.netflix.com",
          ];

          for (const siteUrl of genericSites) {
            try {
              await navigateViaCDP(BK, sess.id, siteUrl, {
                timeout: 15000,
                evaluate: "window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); 'scrolled'",
              });
              // Random delay between sites for cookie credibility
              await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));

              sitesVisited++;
              await svc.from("creator_profile_warmups").update({ sites_visited: sitesVisited }).eq("id", warmupId);
            } catch (e) {
              console.warn(`Warmup nav failed for ${siteUrl}:`, e);
            }
          }
        }

        // ===== Phase 2: Research (navigate + extract raw text) =====
        if (warmupType === "research" || warmupType === "full") {
          const defaultKeywords = [
            "onlyfans marketing strategy 2026",
            "onlyfans agency management tips",
            "creator economy trends",
            "onlyfans subscriber growth tactics",
            "fansly vs onlyfans comparison",
          ];
          const searchKeywords = (keywords && Array.isArray(keywords) && keywords.length > 0) ? keywords : defaultKeywords;

          for (const kw of searchKeywords) {
            try {
              const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(kw)}`;
              const searchResult = await navigateViaCDP(BK, sess.id, searchUrl, {
                timeout: 15000,
                evaluate: "document.body.innerText.substring(0, 3000)",
              });

              if (searchResult.success && searchResult.result) {
                await svc.from("warmup_intelligence").insert({
                  warmup_id: warmupId, agency_id: agencyId,
                  source_url: searchUrl, page_title: `Search: ${kw}`,
                  extracted_text: (searchResult.result as string).substring(0, 2000),
                  category: "search_result",
                  content_type: "search_result",
                  keywords: [kw],
                });
              }

              await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
              sitesVisited++;
              await svc.from("creator_profile_warmups").update({ sites_visited: sitesVisited }).eq("id", warmupId);
            } catch (e) {
              console.warn(`Research search failed for "${kw}":`, e);
            }
          }

          // Reddit trend scraping via raw text
          const redditUrls = [
            "https://www.reddit.com/r/onlyfansadvice/",
            "https://www.reddit.com/r/CreatorsAdvice/",
          ];

          for (const url of redditUrls) {
            try {
              const redditResult = await navigateViaCDP(BK, sess.id, url, {
                timeout: 15000,
                evaluate: "document.body.innerText.substring(0, 3000)",
              });

              if (redditResult.success && redditResult.result) {
                await svc.from("warmup_intelligence").insert({
                  warmup_id: warmupId, agency_id: agencyId,
                  source_url: url, page_title: url.split("/r/")[1]?.replace("/", "") || "reddit",
                  extracted_text: (redditResult.result as string).substring(0, 2000),
                  category: "niche_research",
                  content_type: "reddit_post",
                  keywords: ["onlyfans", "reddit"],
                });
              }

              await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
              sitesVisited++;
              await svc.from("creator_profile_warmups").update({ sites_visited: sitesVisited }).eq("id", warmupId);
            } catch (e) {
              console.warn(`Reddit scraping failed for ${url}:`, e);
            }
          }

          // X/Twitter trend browsing
          try {
            await navigateViaCDP(BK, sess.id, "https://x.com/search?q=onlyfans+tips&src=typed_query", {
              timeout: 15000,
              evaluate: "window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); 'scrolled'",
            });
            await new Promise(r => setTimeout(r, 3000));
            sitesVisited++;
            await svc.from("creator_profile_warmups").update({ sites_visited: sitesVisited }).eq("id", warmupId);
          } catch (e) {
            console.warn("X/Twitter browsing failed:", e);
          }
        }

        // Release session to persist cookies
        try {
          await fetch(`${BB_API}/sessions/${sess.id}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) });
        } catch (e) {
          console.warn("Release failed (non-fatal):", e);
        }

        await svc.from("creator_profile_warmups").update({
          status: "completed", sites_visited: sitesVisited, completed_at: new Date().toISOString(),
        }).eq("id", warmupId);

        return json({ success: true, warmupId, sitesVisited, status: "completed" });
      } catch (e: any) {
        await svc.from("creator_profile_warmups").update({
          status: "failed", error_message: e.message, completed_at: new Date().toISOString(),
        }).eq("id", warmupId);
        return json({ error: e.message, warmupId, status: "failed" }, 500);
      }
    }

    // ========== PROFILE WARMUP: warmup_profiles (batch) ==========
    if (action === "warmup_profiles") {
      const { creatorIds, agencyId, warmupType = "generic", keywords } = p;
      if (!agencyId) return json({ error: "agencyId required" }, 400);

      let targetIds: string[] = creatorIds || [];
      if (!targetIds.length) {
        const { data: links } = await svc.from("creator_session_links")
          .select("creator_id")
          .eq("agency_id", agencyId)
          .not("browserbase_context_id", "is", null);
        targetIds = (links || []).map((l: any) => l.creator_id);
      }

      return json({ success: true, creatorIds: targetIds, count: targetIds.length, warmupType });
    }

    // ========== PRE-WARM: create_pre_warm_profile ==========
    if (action === "create_pre_warm_profile") {
      const { agencyId, warmupType = "full", keywords } = p;
      if (!agencyId) return json({ error: "agencyId required" }, 400);

      const ctx = await bb(BK, "/contexts", { method: "POST", body: JSON.stringify({ projectId: BP }) });

      const { data: profile, error: pErr } = await svc.from("pre_warmed_profiles").insert({
        agency_id: agencyId, browserbase_context_id: ctx.id, status: "available",
      }).select("id").single();
      if (pErr) throw new Error(pErr.message);

      return json({ success: true, profileId: profile.id, contextId: ctx.id, message: "Pre-warm profile created. Trigger warmup_single_profile to warm it up." });
    }

    // ========== PRE-WARM: assign_pre_warm_profile ==========
    if (action === "assign_pre_warm_profile") {
      const { profileId, creatorId, agencyId } = p;
      if (!profileId || !creatorId || !agencyId) return json({ error: "profileId, creatorId, agencyId required" }, 400);

      const { data: profile } = await svc.from("pre_warmed_profiles")
        .select("browserbase_context_id")
        .eq("id", profileId)
        .eq("status", "available")
        .single();
      if (!profile) return json({ error: "Pre-warm profile not found or already assigned" }, 404);

      await svc.from("pre_warmed_profiles").update({
        assigned_creator_id: creatorId, status: "assigned",
      }).eq("id", profileId);

      const { data: existingLink } = await svc.from("creator_session_links")
        .select("id")
        .eq("creator_id", creatorId)
        .eq("platform", "onlyfans")
        .maybeSingle();

      if (existingLink) {
        await svc.from("creator_session_links").update({
          browserbase_context_id: profile.browserbase_context_id,
          updated_at: new Date().toISOString(),
        }).eq("id", existingLink.id);
      } else {
        await svc.from("creator_session_links").insert({
          creator_id: creatorId, agency_id: agencyId, platform: "onlyfans",
          created_by: uid, encrypted_session: "browserbase",
          browserbase_context_id: profile.browserbase_context_id,
          session_status: "pending", is_active: false,
          expires_at: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
        });
      }

      return json({ success: true, contextId: profile.browserbase_context_id });
    }

    // ========== EXTENDED WARMUP: 4-hour deep browsing session ==========
    if (action === "extended_warmup") {
      const { creatorId, agencyId, contextId, durationHours = 4 } = p;
      if (!agencyId) return json({ error: "agencyId required" }, 400);

      let bbContextId = contextId;
      if (creatorId && !bbContextId) {
        bbContextId = await resolveContext(svc, BK, BP, creatorId, "onlyfans", agencyId, uid);
      }
      if (!bbContextId) {
        const ctx = await bb(BK, "/contexts", { method: "POST", body: JSON.stringify({ projectId: BP }) });
        bbContextId = ctx.id;
      }

      const totalSites = 60;
      const timeoutSec = Math.min(durationHours * 3600, 14400);

      const { data: warmupRec } = await svc.from("creator_profile_warmups").insert({
        creator_id: creatorId || null, agency_id: agencyId,
        browserbase_context_id: bbContextId,
        status: "running", warmup_type: "extended",
        total_sites: totalSites,
        started_at: new Date().toISOString(),
      }).select("id").single();
      const warmupId = warmupRec!.id;

      let proxySettings = null;
      if (creatorId) {
        const { data: cr } = await svc.from("creators").select("proxy_country, proxy_state").eq("id", creatorId).maybeSingle();
        if (cr) proxySettings = cr;
      }

      try {
        const proxies = proxySettings ? proxyConf(proxySettings) : [];
        const sessPayload = sessionBody(BP, bbContextId, proxies, {
          keepAlive: true, timeout: timeoutSec,
          userMetadata: { warmup: true, extended: true, agencyId, creatorId },
        });

        const sess = await bb(BK, "/sessions", { method: "POST", body: JSON.stringify(sessPayload) });
        if (!sess?.id) throw new Error("Session creation failed");

        const ready = await waitForSessionReady(BK, sess.id, 20000);
        if (!ready) throw new Error("Session failed to start");

        let sitesVisited = 0;

        // Extended site list for deep cookie/history building
        const EXTENDED_SITES = [
          // Search engines & portals
          "https://www.google.com/search?q=best+restaurants+near+me",
          "https://www.google.com/search?q=weather+today",
          "https://www.google.com/search?q=latest+movies+2026",
          "https://www.bing.com/search?q=trending+news",
          // Social media
          "https://www.youtube.com", "https://www.youtube.com/feed/trending",
          "https://www.reddit.com", "https://www.reddit.com/r/popular",
          "https://www.x.com", "https://www.instagram.com",
          "https://www.tiktok.com", "https://www.facebook.com",
          "https://www.linkedin.com",
          // Shopping
          "https://www.amazon.com/s?k=headphones",
          "https://www.amazon.com/s?k=running+shoes",
          "https://www.ebay.com", "https://www.walmart.com",
          "https://www.target.com", "https://www.bestbuy.com",
          // News
          "https://www.cnn.com", "https://www.bbc.com/news",
          "https://www.reuters.com", "https://news.google.com",
          "https://www.foxnews.com", "https://www.nytimes.com",
          // Entertainment
          "https://www.netflix.com", "https://www.twitch.tv",
          "https://www.spotify.com", "https://www.imdb.com",
          "https://www.hulu.com",
          // Utilities
          "https://weather.com", "https://www.google.com/maps",
          "https://www.wikipedia.org", "https://en.wikipedia.org/wiki/Main_Page",
          "https://www.espn.com", "https://www.nba.com",
          // Tech
          "https://www.github.com", "https://stackoverflow.com",
          "https://www.medium.com", "https://www.quora.com",
          // Finance
          "https://www.yahoo.com/finance", "https://www.coinbase.com",
          "https://www.bankofamerica.com",
          // Travel
          "https://www.booking.com", "https://www.airbnb.com",
          "https://www.expedia.com",
          // Health & Lifestyle
          "https://www.webmd.com", "https://www.healthline.com",
          "https://www.yelp.com",
          // More social/creator
          "https://www.pinterest.com", "https://www.tumblr.com",
          "https://www.discord.com",
          // Adult-adjacent (builds realistic browsing for OF accounts)
          "https://www.patreon.com", "https://ko-fi.com",
          "https://linktr.ee",
          // Random deep browsing
          "https://www.craigslist.org", "https://www.etsy.com",
          "https://www.zillow.com",
        ];

        // Shuffle sites for randomness
        const shuffled = [...EXTENDED_SITES].sort(() => Math.random() - 0.5);
        const sitesToVisit = shuffled.slice(0, totalSites);

        // Human-like browsing simulation scripts
        const SCROLL_SCRIPTS = [
          `window.scrollTo({top: Math.floor(Math.random()*800)+200, behavior:'smooth'})`,
          `window.scrollBy({top: Math.floor(Math.random()*600)+100, behavior:'smooth'})`,
          `document.querySelectorAll('a').length`,
          `window.scrollTo({top: document.body.scrollHeight * Math.random(), behavior:'smooth'})`,
          `(async()=>{for(let i=0;i<3;i++){window.scrollBy({top:300,behavior:'smooth'});await new Promise(r=>setTimeout(r,800))}})()`,
        ];

        for (const siteUrl of sitesToVisit) {
          try {
            const scrollScript = SCROLL_SCRIPTS[Math.floor(Math.random() * SCROLL_SCRIPTS.length)];
            await navigateViaCDP(BK, sess.id, siteUrl, {
              timeout: 20000,
              evaluate: scrollScript,
            });

            // Realistic delays: 5-30 seconds per site (human browsing pace)
            const delay = 5000 + Math.floor(Math.random() * 25000);
            await new Promise(r => setTimeout(r, delay));

            sitesVisited++;
            // Update progress every 3 sites to reduce DB writes
            if (sitesVisited % 3 === 0 || sitesVisited === totalSites) {
              await svc.from("creator_profile_warmups").update({ sites_visited: sitesVisited }).eq("id", warmupId);
            }
          } catch (e) {
            console.warn(`Extended warmup nav failed for ${siteUrl}:`, e);
          }
        }

        // Release session to persist all cookies
        try {
          await fetch(`${BB_API}/sessions/${sess.id}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) });
        } catch {}

        await svc.from("creator_profile_warmups").update({
          status: "completed", sites_visited: sitesVisited, completed_at: new Date().toISOString(),
        }).eq("id", warmupId);

        // Update pre_warmed_profiles if this context is there
        await svc.from("pre_warmed_profiles").update({
          warmup_count: sitesVisited, last_warmed_at: new Date().toISOString(),
        }).eq("browserbase_context_id", bbContextId);

        return json({ success: true, warmupId, sitesVisited, status: "completed", durationHours });
      } catch (e: any) {
        await svc.from("creator_profile_warmups").update({
          status: "failed", error_message: e.message, completed_at: new Date().toISOString(),
        }).eq("id", warmupId);
        return json({ error: e.message, warmupId, status: "failed" }, 500);
      }
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("browserbase-session error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
