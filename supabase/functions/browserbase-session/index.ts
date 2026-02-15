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

async function getCtx(sb: any, k: string, pid: string, cid: string, plat: string) {
  const { data: ex } = await sb.from("creator_session_links").select("browserbase_context_id").eq("creator_id", cid).eq("platform", plat).not("browserbase_context_id", "is", null).maybeSingle();
  if (ex?.browserbase_context_id) return ex.browserbase_context_id;
  const ctx = await bb(k, "/contexts", { method: "POST", body: JSON.stringify({ projectId: pid }) });
  return ctx.id;
}

function proxyConf(c: any) {
  const p: any = { type: "browserbase" };
  if (c?.proxy_country) { p.geolocation = { country: c.proxy_country }; if (c.proxy_state) p.geolocation.state = c.proxy_state; }
  return [p];
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
      const sess = await bb(BK, "/sessions", { method: "POST", body: JSON.stringify({ projectId: BP, browserSettings: { context: { id: ctxId, persist: true }, fingerprint: { browsers: ["chrome"], operatingSystems: ["windows"] } }, proxies: proxyConf(cr), keepAlive: true, timeout: 3600, userMetadata: { creatorId, agencyId, userId: uid, platform, sessionType: "admin" } }) });
      // Fetch debug URL and navigate in parallel for speed
      const startUrl = PLATFORM_URLS[platform.toLowerCase()];
      const [dbg] = await Promise.all([
        bb(BK, `/sessions/${sess.id}/debug`),
        startUrl && sess.connectUrl ? navigateSession(sess.connectUrl, startUrl) : Promise.resolve(),
      ]);
      const liveUrl = dbg.pages?.[0]?.debuggerFullscreenUrl || dbg.debuggerFullscreenUrl;
      const { data: ex } = await svc.from("creator_session_links").select("id").eq("creator_id", creatorId).eq("platform", platform).maybeSingle();
      let slId: string;
      if (ex) {
        const { data } = await svc.from("creator_session_links").update({ browserbase_session_id: sess.id, browserbase_context_id: ctxId, browserbase_live_url: liveUrl, session_status: "authenticating", is_active: true, expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString(), updated_at: new Date().toISOString() }).eq("id", ex.id).select("id").single();
        slId = data!.id;
      } else {
        const { data } = await svc.from("creator_session_links").insert({ creator_id: creatorId, agency_id: agencyId, platform, created_by: uid, encrypted_session: "browserbase", browserbase_session_id: sess.id, browserbase_context_id: ctxId, browserbase_live_url: liveUrl, session_status: "authenticating", is_active: true, expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString() }).select("id").single();
        slId = data!.id;
      }
      await svc.from("active_browser_sessions").insert({ session_link_id: slId, agency_id: agencyId, browserbase_session_id: sess.id, browserbase_live_url: liveUrl, embed_url: liveUrl, session_type: "admin" });
      return json({ success: true, sessionLinkId: slId, embedUrl: liveUrl, sessionId: sess.id, contextId: ctxId });
    }

    if (action === "save_and_close") {
      const { sessionLinkId, browserbaseSessionId } = p;
      if (!sessionLinkId || !browserbaseSessionId) return json({ error: "sessionLinkId and browserbaseSessionId required" }, 400);
      try { await fetch(`${BB_API}/sessions/${browserbaseSessionId}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); } catch {}
      await svc.from("creator_session_links").update({ session_status: "authenticated", last_saved_at: new Date().toISOString(), browserbase_session_id: null, browserbase_live_url: null, updated_at: new Date().toISOString() }).eq("id", sessionLinkId);
      await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString() }).eq("browserbase_session_id", browserbaseSessionId);
      return json({ success: true, message: "Login saved." });
    }

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
      const { data: cr } = await svc.from("creators").select("proxy_country, proxy_state, name").eq("id", link.creator_id).single();
      const { data: exts } = await svc.from("browser_extensions").select("browserbase_extension_id").eq("agency_id", link.agency_id).eq("is_active", true).eq("auto_inject", true);
      const extIds = (exts || []).map((e: any) => e.browserbase_extension_id).filter(Boolean);

      // Extract permission flags for injection into browser session
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
      // Fetch debug URL and navigate in parallel for speed
      const chatterStartUrl = PLATFORM_URLS[link.platform.toLowerCase()];
      const [dbg] = await Promise.all([
        bb(BK, `/sessions/${sess.id}/debug`),
        chatterStartUrl && sess.connectUrl ? navigateSession(sess.connectUrl, chatterStartUrl) : Promise.resolve(),
      ]);
      const liveUrl = dbg.pages?.[0]?.debuggerFullscreenUrl || dbg.debuggerFullscreenUrl;
      await svc.from("active_browser_sessions").insert({ session_link_id: sessionLinkId, chatter_id: chatterId, agency_id: link.agency_id, browserbase_session_id: sess.id, browserbase_live_url: liveUrl, embed_url: liveUrl, session_type: "chatter" });
      await svc.from("session_access_logs").insert({ session_link_id: sessionLinkId, chatter_id: chatterId, action: "launch" });
      return json({ success: true, embedUrl: liveUrl, sessionId: sess.id, platform: link.platform, permissions: permFlags });
    }

    if (action === "terminate_session") {
      const { browserbaseSessionId } = p;
      if (!browserbaseSessionId) return json({ error: "browserbaseSessionId required" }, 400);
      try { await fetch(`${BB_API}/sessions/${browserbaseSessionId}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); } catch {}
      await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString() }).eq("browserbase_session_id", browserbaseSessionId);
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

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("browserbase-session error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
