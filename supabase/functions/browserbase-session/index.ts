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

async function navigateSession(connectUrl: string, url: string) {
  try {
    const ws = new WebSocket(connectUrl);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => { ws.close(); reject(new Error("WS timeout")); }, 10000);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: "Page.navigate", params: { url } }));
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(typeof ev.data === "string" ? ev.data : "");
          if (msg.id === 1) { clearTimeout(timeout); ws.close(); resolve(); }
        } catch {}
      };
      ws.onerror = () => { clearTimeout(timeout); ws.close(); reject(new Error("WS error")); };
    });
  } catch (e) {
    console.warn("Auto-navigate failed (non-fatal):", e);
  }
}

async function bb(k: string, p: string, o: RequestInit = {}) {
  const r = await fetch(`${BB_API}${p}`, { ...o, headers: { ...bbH(k), ...(o.headers || {}) } });
  if (!r.ok) {
    const t = await r.text();
    if (r.status === 402) throw new Error("BILLING: Browserbase free plan minutes used up.");
    throw new Error(`Browserbase API error: ${t}`);
  }
  return r.json();
}

// Check if a Browserbase session is still alive
async function isSessionAlive(k: string, sessionId: string): Promise<boolean> {
  try {
    const d = await bb(k, `/sessions/${sessionId}`);
    return d.status === "RUNNING";
  } catch {
    return false;
  }
}

async function getCtx(sb: any, k: string, pid: string, cid: string, plat: string) {
  const { data: ex } = await sb.from("creator_session_links")
    .select("browserbase_context_id")
    .eq("creator_id", cid)
    .eq("platform", plat)
    .not("browserbase_context_id", "is", null)
    .maybeSingle();
  if (ex?.browserbase_context_id) {
    console.log(`Reusing existing context ${ex.browserbase_context_id} for creator ${cid}`);
    return ex.browserbase_context_id;
  }
  console.log(`Creating new context for creator ${cid}`);
  const ctx = await bb(k, "/contexts", { method: "POST", body: JSON.stringify({ projectId: pid }) });
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

function proxyConf(c: any) {
  const country = c?.proxy_country || "US";
  const rawState = c?.proxy_state || "CA";
  // Convert full state name to 2-letter code if needed
  const state = rawState.length > 2 ? (STATE_ABBREV[rawState.toLowerCase()] || "CA") : rawState.toUpperCase();
  return [{
    type: "browserbase",
    geolocation: { country, state },
  }];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const BK = Deno.env.get("BROWSERBASE_API_KEY"), BP = Deno.env.get("BROWSERBASE_PROJECT_ID");
    if (!BK || !BP) throw new Error("Browserbase credentials not configured");
    const sUrl = Deno.env.get("SUPABASE_URL")!, sKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const sb = createClient(sUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const svc = createClient(sUrl, sKey);
    const { data: { user }, error: ue } = await sb.auth.getUser();
    if (ue || !user) return json({ error: "Unauthorized" }, 401);
    const uid = user.id;
    const { action, ...p } = await req.json();

    if (action === "create_admin_session") {
      const { creatorId, platform, agencyId } = p;
      if (!creatorId || !platform || !agencyId) return json({ error: "creatorId, platform, agencyId required" }, 400);
      const { data: cr } = await svc.from("creators").select("proxy_country, proxy_state, name").eq("id", creatorId).single();
      
      const ctxId = await getCtx(svc, BK, BP, creatorId, platform);
      
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

      // Admin sessions: 30-minute timeout — give admins enough time to complete 2FA and verify login
      const sess = await bb(BK, "/sessions", { method: "POST", body: JSON.stringify({ projectId: BP, browserSettings: { context: { id: ctxId, persist: true }, fingerprint: { browsers: ["chrome"], operatingSystems: ["windows"] } }, proxies: proxyConf(cr), keepAlive: true, timeout: 1800, userMetadata: { creatorId, agencyId, userId: uid, platform, sessionType: "admin" } }) });
      
      const startUrl = PLATFORM_URLS[platform.toLowerCase()];
      // Wait for persistent context cookies to fully load into the browser before navigating.
      // Browserbase injects cookies from the context during session init — navigating too
      // early races with this injection and OnlyFans sees an unauthenticated browser.
      await new Promise(r => setTimeout(r, 3000));
      if (startUrl && sess.connectUrl) {
        await navigateSession(sess.connectUrl, startUrl);
      }
      // Let the page start rendering before grabbing the debug URL
      await new Promise(r => setTimeout(r, 2000));
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

    if (action === "save_and_close") {
      const { sessionLinkId, browserbaseSessionId } = p;
      if (!sessionLinkId || !browserbaseSessionId) return json({ error: "sessionLinkId and browserbaseSessionId required" }, 400);
      
      // Update DB immediately — don't block the UI waiting for Browserbase
      await svc.from("creator_session_links").update({ 
        session_status: "authenticated", 
        last_saved_at: new Date().toISOString(), 
        browserbase_session_id: null, 
        browserbase_live_url: null, 
        updated_at: new Date().toISOString() 
      }).eq("id", sessionLinkId);
      
      await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString(), viewer_count: 0, viewer_ids: [] }).eq("browserbase_session_id", browserbaseSessionId);

      // Fire-and-forget: request Browserbase to release (context persists automatically via persist:true)
      const alive = await isSessionAlive(BK, browserbaseSessionId);
      if (alive) {
        try { 
          await fetch(`${BB_API}/sessions/${browserbaseSessionId}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); 
          console.log(`Session ${browserbaseSessionId} release requested`);
        } catch (e) {
          console.warn(`Failed to release session ${browserbaseSessionId} (non-fatal):`, e);
        }
      } else {
        console.log(`Session ${browserbaseSessionId} already ended`);
      }
      
      return json({ success: true, message: "Login saved. Cookies and session data persisted in context." });
    }

    if (action === "check_and_recover_sessions") {
      const { agencyId } = p;
      if (!agencyId) return json({ error: "agencyId required" }, 400);
      
      // 1. Recover stuck session links
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
          // No session ID means the session was never created or already died
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
      
      // 2. Clean up orphaned active_browser_sessions (any type)
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
          console.log(`Cleaned orphaned active session ${s.browserbase_session_id}`);
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

      // Get agency session mode
      const { data: agency } = await svc.from("agencies").select("browser_session_mode").eq("id", link.agency_id).single();
      const sessionMode = agency?.browser_session_mode || "shared";

      // Check for existing active session for this creator
      const { data: existingSessions } = await svc.from("active_browser_sessions")
        .select("id, browserbase_session_id, embed_url, viewer_count, viewer_ids, session_link_id, chatter_id")
        .eq("session_link_id", sessionLinkId)
        .eq("is_active", true)
        .eq("session_type", "chatter")
        .order("started_at", { ascending: false })
        .limit(1);

      const existingSession = existingSessions?.[0];

      if (existingSession) {
        // Verify the Browserbase session is still alive
        const alive = await isSessionAlive(BK, existingSession.browserbase_session_id);

        if (alive) {
          if (sessionMode === "exclusive") {
            // In exclusive mode, block access — find who's using it
            let inUseBy = "another chatter";
            if (existingSession.chatter_id) {
              const { data: chatter } = await svc.from("chatters").select("name").eq("id", existingSession.chatter_id).maybeSingle();
              if (chatter) inUseBy = chatter.name;
            }
            return json({ error: `Session in use by ${inUseBy}. Please wait until they finish.`, code: "SESSION_IN_USE", inUseBy }, 409);
          }

          // Shared mode: join existing session
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

          console.log(`Chatter ${viewerId} joined existing session ${existingSession.browserbase_session_id} (viewer count: ${currentViewerIds.length})`);
          return json({ success: true, embedUrl: existingSession.embed_url, sessionId: existingSession.browserbase_session_id, platform: link.platform, permissions: permFlags, joined: true, viewerCount: currentViewerIds.length });
        } else {
          // Session died — clean it up
          await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString(), viewer_count: 0, viewer_ids: [] }).eq("id", existingSession.id);
          console.log(`Cleaned up dead session ${existingSession.browserbase_session_id}`);
        }
      }

      // No existing session or it was dead — create a new one
      const { data: cr } = await svc.from("creators").select("proxy_country, proxy_state, name").eq("id", link.creator_id).single();
      const { data: exts } = await svc.from("browser_extensions").select("browserbase_extension_id").eq("agency_id", link.agency_id).eq("is_active", true).eq("auto_inject", true);
      const extIds = (exts || []).map((e: any) => e.browserbase_extension_id).filter(Boolean);

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

      const cfg: any = { projectId: BP, browserSettings: { context: { id: link.browserbase_context_id, persist: true }, fingerprint: { browsers: ["chrome"], operatingSystems: ["windows"] } }, proxies: proxyConf(cr), keepAlive: true, timeout: 3600, userMetadata: { creatorId: link.creator_id, agencyId: link.agency_id, chatterId: chatterId || uid, platform: link.platform, sessionType: "chatter" } };
      if (extIds.length > 0) cfg.extensionId = extIds[0];
      const sess = await bb(BK, "/sessions", { method: "POST", body: JSON.stringify(cfg) });
      const chatterStartUrl = PLATFORM_URLS[link.platform.toLowerCase()];
      // Wait for persistent context cookies to load before navigating
      await new Promise(r => setTimeout(r, 3000));
      if (chatterStartUrl && sess.connectUrl) {
        await navigateSession(sess.connectUrl, chatterStartUrl);
      }
      await new Promise(r => setTimeout(r, 2000));
      const dbg = await bb(BK, `/sessions/${sess.id}/debug`);
      const liveUrl = dbg.pages?.[0]?.debuggerFullscreenUrl || dbg.debuggerFullscreenUrl;
      const viewerId = chatterId || uid;
      await svc.from("active_browser_sessions").insert({ session_link_id: sessionLinkId, chatter_id: chatterId, agency_id: link.agency_id, browserbase_session_id: sess.id, browserbase_live_url: liveUrl, embed_url: liveUrl, session_type: "chatter", viewer_count: 1, viewer_ids: [viewerId], last_heartbeat_at: new Date().toISOString() });
      await svc.from("session_access_logs").insert({ session_link_id: sessionLinkId, chatter_id: chatterId, action: "launch" });
      return json({ success: true, embedUrl: liveUrl, sessionId: sess.id, platform: link.platform, permissions: permFlags, joined: false, viewerCount: 1 });
    }

    // ========== VIEWER-AWARE TERMINATE ==========
    if (action === "terminate_session") {
      const { browserbaseSessionId, chatterId: terminatingChatterId } = p;
      if (!browserbaseSessionId) return json({ error: "browserbaseSessionId required" }, 400);

      // Find the active session
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
          // Last viewer — release the Browserbase session
          try { await fetch(`${BB_API}/sessions/${browserbaseSessionId}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); } catch {}
          await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString(), viewer_count: 0, viewer_ids: [] }).eq("id", session.id);
          console.log(`Last viewer left — session ${browserbaseSessionId} released`);
        } else {
          // Other viewers still active — just remove this viewer
          await svc.from("active_browser_sessions").update({ viewer_count: newViewerCount, viewer_ids: updatedViewerIds }).eq("id", session.id);
          console.log(`Viewer ${viewerId} left session ${browserbaseSessionId} (${newViewerCount} remaining)`);
        }
      } else {
        // No tracked session, just try to release
        try { await fetch(`${BB_API}/sessions/${browserbaseSessionId}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); } catch {}
        await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString() }).eq("browserbase_session_id", browserbaseSessionId);
      }

      return json({ success: true });
    }

    // ========== SESSION HEARTBEAT ==========
    if (action === "session_heartbeat") {
      const { browserbaseSessionId, chatterId: heartbeatChatterId } = p;
      if (!browserbaseSessionId) return json({ error: "browserbaseSessionId required" }, 400);

      await svc.from("active_browser_sessions").update({
        last_heartbeat_at: new Date().toISOString(),
      }).eq("browserbase_session_id", browserbaseSessionId).eq("is_active", true);

      // Cleanup stale sessions: any active session with no heartbeat for 5+ minutes
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: stale } = await svc.from("active_browser_sessions")
        .select("id, browserbase_session_id, viewer_ids")
        .eq("is_active", true)
        .eq("session_type", "chatter")
        .lt("last_heartbeat_at", fiveMinAgo);

      for (const s of stale || []) {
        console.log(`Cleaning up stale session ${s.browserbase_session_id} (no heartbeat for 5+ min)`);
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
      return json({ success: true, extensionId: data.id, message: "Extension record created. Upload ZIP via Browserbase dashboard." });
    }

    if (action === "list_extensions") {
      try { return json({ success: true, extensions: await bb(BK, `/extensions?projectId=${BP}`) }); } catch { return json({ success: true, extensions: [] }); }
    }

    // ========== PROFILE WARMUP: warmup_single_profile ==========
    if (action === "warmup_single_profile") {
      const { creatorId, agencyId, warmupType = "generic", contextId, keywords } = p;
      if (!agencyId) return json({ error: "agencyId required" }, 400);

      let bbContextId = contextId;
      let targetCreatorId = creatorId || null;

      // If creator specified, look up their context
      if (creatorId && !bbContextId) {
        const { data: link } = await svc.from("creator_session_links")
          .select("browserbase_context_id")
          .eq("creator_id", creatorId)
          .not("browserbase_context_id", "is", null)
          .maybeSingle();
        if (link?.browserbase_context_id) {
          bbContextId = link.browserbase_context_id;
        } else {
          // Auto-provision a context for this creator
          const ctx = await bb(BK, "/contexts", { method: "POST", body: JSON.stringify({ projectId: BP }) });
          bbContextId = ctx.id;
          // Save it to a session link
          const { data: { user: warmupUser } } = await sb.auth.getUser();
          await svc.from("creator_session_links").upsert({
            creator_id: creatorId, agency_id: agencyId, platform: "onlyfans",
            created_by: warmupUser?.id || uid, encrypted_session: "browserbase",
            browserbase_context_id: bbContextId, session_status: "pending",
            is_active: false, expires_at: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
          }, { onConflict: "creator_id,platform" }).select("id").single();
        }
      }

      if (!bbContextId) return json({ error: "No context available for warmup" }, 400);

      // Create warmup record
      const { data: warmupRec, error: wErr } = await svc.from("creator_profile_warmups").insert({
        creator_id: targetCreatorId, agency_id: agencyId, browserbase_context_id: bbContextId,
        status: "running", warmup_type: warmupType,
        total_sites: warmupType === "generic" ? 10 : warmupType === "research" ? 15 : 25,
        started_at: new Date().toISOString(),
      }).select("id").single();
      if (wErr) throw new Error(wErr.message);
      const warmupId = warmupRec.id;

      // Get creator proxy settings if available
      let proxySettings = null;
      if (creatorId) {
        const { data: cr } = await svc.from("creators").select("proxy_country, proxy_state").eq("id", creatorId).maybeSingle();
        if (cr) proxySettings = cr;
      }

      try {
        // Create short-lived session for warmup
        const sessBody: any = {
          projectId: BP,
          browserSettings: { context: { id: bbContextId, persist: true }, fingerprint: { browsers: ["chrome"], operatingSystems: ["windows"] } },
          keepAlive: false, timeout: 300,
          userMetadata: { warmup: true, agencyId, creatorId: targetCreatorId },
        };
        if (proxySettings) sessBody.proxies = proxyConf(proxySettings);

        const sess = await bb(BK, "/sessions", { method: "POST", body: JSON.stringify(sessBody) });
        await new Promise(r => setTimeout(r, 3000)); // Wait for context to load

        const ws = new WebSocket(sess.connectUrl);
        let msgId = 0;

        const cdpSend = (method: string, params: any = {}) => new Promise<any>((resolve, reject) => {
          const id = ++msgId;
          const timeout = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), 30000);
          const handler = (ev: MessageEvent) => {
            try {
              const msg = JSON.parse(typeof ev.data === "string" ? ev.data : "");
              if (msg.id === id) {
                clearTimeout(timeout);
                ws.removeEventListener("message", handler);
                resolve(msg.result || {});
              }
            } catch {}
          };
          ws.addEventListener("message", handler);
          ws.send(JSON.stringify({ id, method, params }));
        });

        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error("WS connect timeout")), 15000);
          ws.onopen = () => { clearTimeout(t); resolve(); };
          ws.onerror = () => { clearTimeout(t); reject(new Error("WS error")); };
        });

        await cdpSend("Page.enable");
        await cdpSend("Runtime.enable");

        let sitesVisited = 0;

        // Phase 1: Generic warmup sites
        const genericSites = [
          "https://www.google.com/search?q=best+movies+2026",
          "https://www.youtube.com",
          "https://www.reddit.com",
          "https://www.x.com",
          "https://www.instagram.com",
          "https://www.amazon.com",
          "https://en.wikipedia.org/wiki/Main_Page",
          "https://www.espn.com",
          "https://weather.com",
          "https://www.netflix.com",
        ];

        if (warmupType === "generic" || warmupType === "full") {
          for (const url of genericSites) {
            try {
              await cdpSend("Page.navigate", { url });
              await new Promise(r => setTimeout(r, 5000 + Math.random() * 3000));
              await cdpSend("Runtime.evaluate", { expression: "window.scrollTo(0, Math.floor(Math.random() * 800) + 200)" });
              await new Promise(r => setTimeout(r, 2000));
              sitesVisited++;
              // Update progress
              await svc.from("creator_profile_warmups").update({ sites_visited: sitesVisited }).eq("id", warmupId);
            } catch (e) {
              console.warn(`Warmup nav failed for ${url}:`, e);
            }
          }
        }

        // Phase 2: Research (niche-aware browsing + intelligence extraction)
        if (warmupType === "research" || warmupType === "full") {
          const defaultKeywords = [
            "onlyfans marketing strategy 2026",
            "onlyfans agency management tips",
            "creator economy trends",
            "onlyfans subscriber growth tactics",
            "fansly vs onlyfans comparison",
          ];
          const searchKeywords = (keywords && Array.isArray(keywords) && keywords.length > 0) ? keywords : defaultKeywords;

          const directUrls = [
            "https://www.reddit.com/r/onlyfansadvice/",
            "https://www.reddit.com/r/CreatorsAdvice/",
            "https://x.com/search?q=onlyfans+tips&src=typed_query",
          ];

          // Keyword searches
          for (const kw of searchKeywords) {
            try {
              const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(kw)}`;
              await cdpSend("Page.navigate", { url: searchUrl });
              await new Promise(r => setTimeout(r, 5000 + Math.random() * 3000));

              // Extract page content
              const result = await cdpSend("Runtime.evaluate", {
                expression: `JSON.stringify({ title: document.title, text: document.body.innerText.substring(0, 2000) })`,
                returnByValue: true,
              });
              const pageData = JSON.parse(result?.result?.value || "{}");

              if (pageData.text) {
                await svc.from("warmup_intelligence").insert({
                  warmup_id: warmupId, agency_id: agencyId,
                  source_url: searchUrl, page_title: pageData.title || kw,
                  extracted_text: pageData.text, category: "trend",
                  keywords: [kw],
                });
              }

              await cdpSend("Runtime.evaluate", { expression: "window.scrollTo(0, 500)" });
              await new Promise(r => setTimeout(r, 2000));
              sitesVisited++;
              await svc.from("creator_profile_warmups").update({ sites_visited: sitesVisited }).eq("id", warmupId);
            } catch (e) {
              console.warn(`Research search failed for "${kw}":`, e);
            }
          }

          // Direct URL visits
          for (const url of directUrls) {
            try {
              await cdpSend("Page.navigate", { url });
              await new Promise(r => setTimeout(r, 6000 + Math.random() * 3000));

              const result = await cdpSend("Runtime.evaluate", {
                expression: `JSON.stringify({ title: document.title, text: document.body.innerText.substring(0, 2000) })`,
                returnByValue: true,
              });
              const pageData = JSON.parse(result?.result?.value || "{}");

              if (pageData.text) {
                const cat = url.includes("reddit") ? "niche_research" : url.includes("x.com") ? "trend" : "competitor";
                await svc.from("warmup_intelligence").insert({
                  warmup_id: warmupId, agency_id: agencyId,
                  source_url: url, page_title: pageData.title || url,
                  extracted_text: pageData.text, category: cat,
                  keywords: ["onlyfans"],
                });
              }

              await cdpSend("Runtime.evaluate", { expression: "window.scrollTo(0, 600)" });
              await new Promise(r => setTimeout(r, 2000));
              sitesVisited++;
              await svc.from("creator_profile_warmups").update({ sites_visited: sitesVisited }).eq("id", warmupId);
            } catch (e) {
              console.warn(`Research direct nav failed for ${url}:`, e);
            }
          }
        }

        ws.close();

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
        // Get all creators with browser contexts
        const { data: links } = await svc.from("creator_session_links")
          .select("creator_id")
          .eq("agency_id", agencyId)
          .not("browserbase_context_id", "is", null);
        targetIds = (links || []).map((l: any) => l.creator_id);
      }

      // Return list of creator IDs — frontend will fire individual warmup calls in parallel
      return json({ success: true, creatorIds: targetIds, count: targetIds.length, warmupType });
    }

    // ========== PRE-WARM: create_pre_warm_profile ==========
    if (action === "create_pre_warm_profile") {
      const { agencyId, warmupType = "full", keywords } = p;
      if (!agencyId) return json({ error: "agencyId required" }, 400);

      // Create a new Browserbase context (no creator)
      const ctx = await bb(BK, "/contexts", { method: "POST", body: JSON.stringify({ projectId: BP }) });

      // Insert into pre_warmed_profiles
      const { data: profile, error: pErr } = await svc.from("pre_warmed_profiles").insert({
        agency_id: agencyId, browserbase_context_id: ctx.id, status: "available",
      }).select("id").single();
      if (pErr) throw new Error(pErr.message);

      // Now warmup this context (reuse warmup_single_profile logic inline)
      // We return immediately and the caller should invoke warmup_single_profile separately
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

      // Assign to creator
      await svc.from("pre_warmed_profiles").update({
        assigned_creator_id: creatorId, status: "assigned",
      }).eq("id", profileId);

      // Create/update creator's session link with this context
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

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("browserbase-session error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
