import { createClient } from "npm:@supabase/supabase-js@2.89.0";
import {
  corsHeaders, json, bb, bbH, isSessionAlive, waitForSessionReady,
  PLATFORM_URLS, navigateViaCDP, checkLoginViaCDP, verifyCookiesRestored,
  executeCDPScript, aiExtractEarnings, aiDetectLoginState,
  proxyConf, sessionBody, resolveContext, preLoginSetup, STATE_TIMEZONES,
  autoLoginViaCDP,
} from "../_shared/cdp-helpers.ts";

const BB_API = "https://api.browserbase.com/v1";

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

    // Auth via getClaims for signing-keys compatibility
    const sb = createClient(sUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const token = auth.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await sb.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const uid = claimsData.claims.sub as string;

    const svc = createClient(sUrl, sKey);

    // ========== ADMIN-ONLY: REFRESH ALL CONTEXTS ==========
    if (action === "refresh_all_contexts") {
      const { agencyId } = p;
      if (!agencyId) return json({ error: "agencyId required" }, 400);
      const { data: profile } = await svc.from("profiles").select("agency_id, user_type").eq("id", uid).single();
      if (!profile || profile.user_type !== "agency" || profile.agency_id !== agencyId) {
        return json({ error: "Unauthorized: only agency owners can refresh contexts" }, 403);
      }
      const { data: links } = await svc.from("creator_session_links")
        .select("id, creator_id, browserbase_context_id, platform")
        .eq("agency_id", agencyId).eq("is_active", true);
      if (!links?.length) return json({ success: true, message: "No active session links found", refreshed: 0 });

      const results: any[] = [];
      for (const link of links) {
        try {
          const newCtx = await bb(BK, "/contexts", { method: "POST", body: JSON.stringify({ projectId: BP }) });
          if (!newCtx?.id) throw new Error("No context ID returned");
          await svc.from("creator_session_links").update({
            browserbase_context_id: newCtx.id, session_status: "pending",
            browserbase_session_id: null, browserbase_live_url: null,
            last_saved_at: null, updated_at: new Date().toISOString(),
          }).eq("id", link.id);
          results.push({ creatorId: link.creator_id, oldContext: link.browserbase_context_id, newContext: newCtx.id, status: "ok" });
        } catch (err: any) {
          results.push({ creatorId: link.creator_id, status: "error", error: err.message });
        }
      }
      return json({ success: true, refreshed: results.filter(r => r.status === "ok").length, total: links.length, results });
    }

    // ========== CREATE ADMIN SESSION ==========
    if (action === "create_admin_session") {
      const { creatorId, platform, agencyId } = p;
      if (!creatorId || !platform || !agencyId) return json({ error: "creatorId, platform, agencyId required" }, 400);
      const { data: cr } = await svc.from("creators").select("proxy_country, proxy_state, proxy_city, name").eq("id", creatorId).single();
      const ctxId = await resolveContext(svc, BK, BP, creatorId, platform, agencyId, uid);

      const { data: existingLink } = await svc.from("creator_session_links")
        .select("id, session_status, browserbase_context_id, browserbase_session_id, last_saved_at")
        .eq("creator_id", creatorId).eq("platform", platform).maybeSingle();

      if (existingLink?.session_status === "authenticating" && existingLink?.browserbase_context_id) {
        if (existingLink.browserbase_session_id) {
          const alive = await isSessionAlive(BK, existingLink.browserbase_session_id);
          if (!alive) {
            await svc.from("creator_session_links").update({
              session_status: "authenticated", last_saved_at: existingLink.last_saved_at || new Date().toISOString(),
              browserbase_session_id: null, browserbase_live_url: null, updated_at: new Date().toISOString(),
            }).eq("id", existingLink.id);
            existingLink.session_status = "authenticated";
          } else {
            const { data: existingActive } = await svc.from("active_browser_sessions")
              .select("embed_url").eq("browserbase_session_id", existingLink.browserbase_session_id)
              .eq("is_active", true).maybeSingle();
            if (existingActive) {
              return json({ success: true, sessionLinkId: existingLink.id, embedUrl: existingActive.embed_url, sessionId: existingLink.browserbase_session_id, contextId: existingLink.browserbase_context_id, reused: true });
            }
          }
        }
      }

      const proxies = proxyConf(cr);
      const resolvedState = proxies[0]?.geolocation?.state || "TX";
      const sess = await bb(BK, "/sessions", { method: "POST", body: JSON.stringify(
        sessionBody(BP, ctxId, proxies, { timeout: 1800, userMetadata: { creatorId, agencyId, userId: uid, platform, sessionType: "admin" } })
      ) });
      if (!sess?.id) return json({ error: "Failed to create browser session — no session ID returned" }, 502);

      const isReady = await waitForSessionReady(BK, sess.id, 20000);
      if (!isReady) return json({ error: "Browser session failed to start. Please try again." }, 502);

      console.log("Waiting 8s for context cookie restoration...");
      await new Promise(r => setTimeout(r, 8000));

      const hasSavedContext = Boolean(existingLink?.browserbase_context_id && existingLink?.last_saved_at);
      const wasAuthenticated = Boolean(
        existingLink?.browserbase_context_id &&
        (existingLink?.session_status === "authenticated" || hasSavedContext)
      );
      if (wasAuthenticated) {
        const platformDomain = platform.toLowerCase() === "onlyfans" ? "onlyfans.com" : platform.toLowerCase() === "fansly" ? "fansly.com" : "fanvue.com";
        const cookieCheck = await verifyCookiesRestored(BK, sess.id, platformDomain);
        if (cookieCheck.verified) {
          console.log(`Cookie restoration verified: ${cookieCheck.cookieCount} cookies ✓`);
        } else if (cookieCheck.cookieCount === 0) {
          await svc.from("browser_session_events").insert({
            agency_id: agencyId, browserbase_session_id: sess.id, event_type: "cookie_restoration_failed",
            severity: "warning", title: "Cookie Restoration Warning",
            message: `No cookies found for ${platformDomain} after context restoration.`,
          });
        }
      }

      try { await preLoginSetup(BK, sess.id, resolvedState); } catch (e) { console.warn("Pre-login setup failed (non-fatal):", e); }

      const startUrl = PLATFORM_URLS[platform.toLowerCase()];
      if (startUrl) {
        try { await navigateViaCDP(BK, sess.id, startUrl, { timeout: 30000 }); } catch (e) { console.warn("CDP auto-navigate failed (non-fatal):", e); }
      }

      let adminLoginVerified = true;
      if (wasAuthenticated && startUrl) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const loginResult = await checkLoginViaCDP(BK, sess.id, { label: "Admin login" });
          adminLoginVerified = loginResult.isLoggedIn;
          if (!adminLoginVerified) {
            await svc.from("browser_session_events").insert({
              agency_id: agencyId, browserbase_session_id: sess.id, event_type: "login_expired",
              severity: "warning", title: "Login Expired",
              message: `Creator session cookies may have expired. Please re-authenticate.`,
            });
          }
        } catch (e) { console.warn("Admin login verification failed (non-fatal):", e); }
      }

      await new Promise(r => setTimeout(r, 1500));
      const dbg = await bb(BK, `/sessions/${sess.id}/debug`);
      const liveUrl = dbg.pages?.[0]?.debuggerFullscreenUrl || dbg.debuggerFullscreenUrl;

      let slId: string;
      let newStatus: string;
      if (wasAuthenticated) { newStatus = adminLoginVerified ? "authenticated" : "pending"; }
      else { newStatus = "authenticating"; }

      if (existingLink) {
        const { data } = await svc.from("creator_session_links").update({ browserbase_session_id: sess.id, browserbase_context_id: ctxId, browserbase_live_url: liveUrl, session_status: newStatus, is_active: true, expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString(), updated_at: new Date().toISOString() }).eq("id", existingLink.id).select("id").single();
        slId = data!.id;
      } else {
        const { data } = await svc.from("creator_session_links").insert({ creator_id: creatorId, agency_id: agencyId, platform, created_by: uid, encrypted_session: "browserbase", browserbase_session_id: sess.id, browserbase_context_id: ctxId, browserbase_live_url: liveUrl, session_status: "authenticating", is_active: true, expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString() }).select("id").single();
        slId = data!.id;
      }
      await svc.from("active_browser_sessions").insert({ session_link_id: slId, agency_id: agencyId, browserbase_session_id: sess.id, browserbase_live_url: liveUrl, embed_url: liveUrl, session_type: "admin", viewer_count: 1, viewer_ids: [uid] });
      return json({ success: true, sessionLinkId: slId, embedUrl: liveUrl, sessionId: sess.id, contextId: ctxId, loginVerified: adminLoginVerified });
    }

    // ========== SAVE AND CLOSE ==========
    if (action === "save_and_close") {
      const { sessionLinkId, browserbaseSessionId } = p;
      if (!sessionLinkId || !browserbaseSessionId) return json({ error: "sessionLinkId and browserbaseSessionId required" }, 400);
      const alive = await isSessionAlive(BK, browserbaseSessionId);

      const { data: prevLink } = await svc.from("creator_session_links")
        .select("session_status, browserbase_context_id, last_saved_at")
        .eq("id", sessionLinkId)
        .single();

      const hadSavedContext = Boolean(prevLink?.browserbase_context_id && prevLink?.last_saved_at);

      let isLoggedIn = false;
      if (alive) {
        try {
          const loginResult = await checkLoginViaCDP(BK, browserbaseSessionId, { label: "Save & Close" });
          isLoggedIn = loginResult.isLoggedIn;
        } catch (e) { console.warn("Login check failed, defaulting to persist:", e); isLoggedIn = true; }
      } else if (prevLink?.session_status === "authenticated" || hadSavedContext) {
        isLoggedIn = true;
      }

      const { data: sessionLink } = await svc.from("creator_session_links").select("creator_id, platform").eq("id", sessionLinkId).single();

      // Earnings scrape before close
      let scrapedEarnings = null;
      if (alive && sessionLink?.platform?.toLowerCase() === "onlyfans") {
        try {
          console.log(`Scraping earnings for creator ${sessionLink.creator_id} before close...`);
          const scrapeWsUrl = `wss://connect.browserbase.com?apiKey=${BK}&sessionId=${browserbaseSessionId}`;

          const scrapeResult = await new Promise<{ json?: any; domText?: string }>((resolve) => {
            let done = false;
            const ws = new WebSocket(scrapeWsUrl);
            const timer = setTimeout(() => { if (!done) { done = true; try { ws.close(); } catch {} resolve({}); } }, 35000);
            let mid = 1;
            let cdpSid: string | null = null;
            const pendingBodyRequests = new Map<number, string>();
            const domPollIds = new Set<number>();
            const earningsAccumulator: Record<string, any> = {};
            let earningsJson: any = null;
            let domText = "";
            let xhrCaptured = false;
            let xhrResponseCount = 0;
            let xhrFinishTimer: ReturnType<typeof setTimeout> | null = null;
            let navigationConfirmed = false;
            let domPollCount = 0;
            const MAX_DOM_POLLS = 7;
            let getTargetsId: number | null = null;
            let attachId: number | null = null;
            let networkEnableId: number | null = null;
            let pageEnableId: number | null = null;
            let navigateId: number | null = null;

            const send = (method: string, params: Record<string, unknown> = {}) => {
              const id = mid++;
              const msg: any = { id, method, params };
              if (cdpSid) msg.sessionId = cdpSid;
              try { ws.send(JSON.stringify(msg)); } catch {}
              return id;
            };

            const finish = () => {
              if (done) return;
              done = true; clearTimeout(timer); if (xhrFinishTimer) clearTimeout(xhrFinishTimer);
              earningsJson = Object.keys(earningsAccumulator).length > 0 ? earningsAccumulator : null;
              try { ws.close(); } catch {}
              resolve({ json: earningsJson, domText });
            };

            const startDomPoll = () => {
              if (xhrCaptured || done || domPollCount >= MAX_DOM_POLLS) return;
              domPollCount++;
              const id = send("Runtime.evaluate", {
                expression: `document.body ? document.body.innerText.substring(0, 8000) : ''`,
                returnByValue: true,
              });
              domPollIds.add(id);
            };

            ws.onopen = () => { getTargetsId = send("Target.getTargets"); };
            ws.onmessage = (evt) => {
              try {
                const msg = JSON.parse(evt.data);
                if (msg.id === getTargetsId) {
                  const page = (msg.result?.targetInfos || []).find((t: any) => t.type === "page");
                  if (page) { attachId = send("Target.attachToTarget", { targetId: page.targetId, flatten: true }); }
                  else finish();
                  return;
                }
                if (msg.id === attachId) {
                  cdpSid = msg.result?.sessionId;
                  if (cdpSid) { networkEnableId = send("Network.enable", {}); }
                  return;
                }
                if (msg.id === networkEnableId) {
                  pageEnableId = send("Page.enable", {});
                  navigateId = send("Page.navigate", { url: "https://onlyfans.com/my/statistics/statements/earnings" });
                  return;
                }
                if (msg.id === navigateId) {
                  if (!msg.error) { navigationConfirmed = true; setTimeout(() => startDomPoll(), 5000); }
                  else finish();
                  return;
                }
                if (msg.method === "Network.responseReceived") {
                  const resp = msg.params?.response;
                  const url = resp?.url || "";
                  const reqId = msg.params?.requestId;
                  if (reqId && (url.includes("/api2/v2/earnings") || url.includes("/api2/v2/statics") || url.includes("/api2/v2/statistics") || url.includes("statements/earnings") || (url.includes("/chart") && url.includes("earning")))) {
                    const bodyMid = send("Network.getResponseBody", { requestId: reqId });
                    pendingBodyRequests.set(bodyMid, reqId);
                  }
                  return;
                }
                if (pendingBodyRequests.has(msg.id)) {
                  pendingBodyRequests.delete(msg.id);
                  const body = msg.result?.body;
                  if (body) {
                    try {
                      const parsed = JSON.parse(body);
                      for (const key of Object.keys(parsed)) { earningsAccumulator[key] = parsed[key]; }
                      xhrResponseCount++; xhrCaptured = true;
                      if (xhrFinishTimer) clearTimeout(xhrFinishTimer);
                      xhrFinishTimer = setTimeout(() => { earningsJson = earningsAccumulator; finish(); }, 3000);
                    } catch {}
                  }
                  return;
                }
                if (domPollIds.has(msg.id)) {
                  domPollIds.delete(msg.id);
                  if (xhrCaptured) return;
                  const text = msg.result?.result?.value;
                  if (typeof text === "string" && text.length > 200 && (/\$[\d,]+/.test(text) || /(?:subscriptions|tips|messages|earnings)/i.test(text))) {
                    domText = text;
                    setTimeout(() => { if (!done && !xhrCaptured) finish(); }, 3000);
                    return;
                  }
                  startDomPoll();
                  return;
                }
              } catch {}
            };
            ws.onerror = () => finish();
            ws.onclose = () => finish();
          });

          // Parse results
          let bestTotal = 0, tips = 0, subs = 0, messages = 0, referrals = 0, posts = 0;
          let earningsSource = "none";

          if (scrapeResult.json) {
            earningsSource = "xhr";
            const d = scrapeResult.json.data || scrapeResult.json;
            const getNet = (obj: any): number => {
              if (typeof obj === "number") return obj;
              if (obj?.total !== undefined) return Number(obj.total) || 0;
              if (obj?.net !== undefined) return Number(obj.net) || 0;
              return 0;
            };
            const totalNet = getNet(d.total || d.all);
            tips = getNet(d.tips); subs = getNet(d.subscribes || d.subscriptions);
            messages = getNet(d.messages || d.chat_messages); posts = getNet(d.post || d.posts);
            referrals = getNet(d.referrals);
            const streamsNet = getNet(d.stream || d.streams);
            bestTotal = totalNet || (tips + subs + messages + posts + referrals + streamsNet);
          }

          if (bestTotal === 0 && scrapeResult.domText) {
            const aiEarnings = await aiExtractEarnings(scrapeResult.domText);
            if (aiEarnings && aiEarnings.total > 0) {
              earningsSource = "ai"; bestTotal = aiEarnings.total; tips = aiEarnings.tips;
              subs = aiEarnings.subscriptions; messages = aiEarnings.messages;
              referrals = aiEarnings.referrals; posts = aiEarnings.posts;
            } else {
              earningsSource = "dom";
              const rawText = scrapeResult.domText;
              const parseAmount = (labels: string[]): number => {
                for (const label of labels) {
                  const nlPat = new RegExp(label + `\\s*\\n\\s*\\$\\s*([\\d,]+\\.?\\d*)`, "i");
                  const nlMatch = rawText.match(nlPat);
                  if (nlMatch) { const val = parseFloat(nlMatch[1].replace(/,/g, "")); if (!isNaN(val) && val > 0) return val; }
                  const inlinePat = new RegExp(label + `[:\\s]+\\$\\s*([\\d,]+\\.?\\d*)`, "i");
                  const inlineMatch = rawText.match(inlinePat);
                  if (inlineMatch) { const val = parseFloat(inlineMatch[1].replace(/,/g, "")); if (!isNaN(val) && val > 0) return val; }
                }
                return 0;
              };
              const totalEarnings = parseAmount(["total", "net", "earnings"]);
              tips = parseAmount(["tips"]); subs = parseAmount(["subscriptions"]);
              messages = parseAmount(["messages", "chat"]); referrals = parseAmount(["referrals"]); posts = parseAmount(["posts"]);
              let fallbackTotal = 0;
              if (!totalEarnings) {
                const allAmounts = [...rawText.matchAll(/\$\s*([\d,]+\.?\d{0,2})/g)].map(m => parseFloat(m[1].replace(/,/g, ""))).filter(v => !isNaN(v) && v > 0);
                if (allAmounts.length > 0) fallbackTotal = Math.max(...allAmounts);
              }
              bestTotal = totalEarnings || (tips + subs + messages + referrals + posts) || fallbackTotal;
            }
          }

          if (bestTotal > 0) {
            const now = new Date();
            const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
            const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
            const { data: existing } = await svc.from("creator_earnings").select("id").eq("creator_id", sessionLink.creator_id).eq("period_start", periodStart).eq("period_end", periodEnd).maybeSingle();
            const earningsPayload = {
              creator_id: sessionLink.creator_id, amount: bestTotal, tips: tips || 0,
              subscriptions: subs || 0, messages_revenue: messages || 0, referrals: referrals || 0,
              period_start: periodStart, period_end: periodEnd, platform: "onlyfans",
              notes: `Auto-scraped (${earningsSource}) on ${now.toISOString().split("T")[0]}`,
            };
            if (existing) { await svc.from("creator_earnings").update(earningsPayload).eq("id", existing.id); }
            else { await svc.from("creator_earnings").insert(earningsPayload); }
            scrapedEarnings = { total: bestTotal, tips, subscriptions: subs, messages, referrals };
          }
        } catch (e: any) { console.warn(`Earnings scrape failed (non-fatal): ${e.message}`); }
      }

      // Update DB
      if (isLoggedIn) {
        await svc.from("creator_session_links").update({ session_status: "authenticated", last_saved_at: new Date().toISOString(), browserbase_session_id: null, browserbase_live_url: null, updated_at: new Date().toISOString() }).eq("id", sessionLinkId);
      } else if (hadSavedContext) {
        // Keep previously saved context as authenticated when a live check is inconclusive.
        await svc.from("creator_session_links").update({ session_status: "authenticated", browserbase_session_id: null, browserbase_live_url: null, updated_at: new Date().toISOString() }).eq("id", sessionLinkId);
      } else {
        await svc.from("creator_session_links").update({ browserbase_session_id: null, browserbase_live_url: null, updated_at: new Date().toISOString() }).eq("id", sessionLinkId);
      }
      await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString(), viewer_count: 0, viewer_ids: [] }).eq("browserbase_session_id", browserbaseSessionId);

      if (alive) {
        try {
          const releasePayload = !isLoggedIn && !hadSavedContext
            ? { status: "REQUEST_RELEASE", persist: false }
            : { status: "REQUEST_RELEASE" };
          await fetch(`${BB_API}/sessions/${browserbaseSessionId}`, { method: "POST", headers: bbH(BK), body: JSON.stringify(releasePayload) });
        } catch {}
      }

      const contextPreserved = isLoggedIn || hadSavedContext;
      return json({
        success: true,
        loginDetected: isLoggedIn,
        contextPreserved,
        message: contextPreserved
          ? (scrapedEarnings ? `Login saved. Earnings scraped: $${scrapedEarnings.total}` : "Login saved.")
          : "Session closed. Cookies were NOT saved.",
        earnings: scrapedEarnings,
      });
    }

    // ========== CHECK AND RECOVER SESSIONS ==========
    if (action === "check_and_recover_sessions") {
      const { agencyId } = p;
      if (!agencyId) return json({ error: "agencyId required" }, 400);
      const { data: stuck } = await svc.from("creator_session_links").select("id, browserbase_session_id, browserbase_context_id, last_saved_at").eq("agency_id", agencyId).eq("session_status", "authenticating");
      const recovered: string[] = [];
      for (const link of stuck || []) {
        let shouldRecover = false;
        if (link.browserbase_session_id) { const alive = await isSessionAlive(BK, link.browserbase_session_id); if (!alive) shouldRecover = true; } else shouldRecover = true;
        if (shouldRecover) {
          await svc.from("creator_session_links").update({ session_status: link.browserbase_context_id ? "authenticated" : "pending", last_saved_at: link.last_saved_at || (link.browserbase_context_id ? new Date().toISOString() : null), browserbase_session_id: null, browserbase_live_url: null, updated_at: new Date().toISOString() }).eq("id", link.id);
          recovered.push(link.id);
        }
      }
      const { data: activeSessions } = await svc.from("active_browser_sessions").select("id, browserbase_session_id").eq("agency_id", agencyId).eq("is_active", true);
      let cleanedActive = 0;
      for (const s of activeSessions || []) { const alive = await isSessionAlive(BK, s.browserbase_session_id); if (!alive) { await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString(), viewer_count: 0, viewer_ids: [] }).eq("id", s.id); cleanedActive++; } }
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

      const permFlags = {
        can_view_chats: perm.can_view_chats ?? false, can_send_messages: perm.can_send_messages ?? false,
        can_send_mass_messages: perm.can_send_mass_messages ?? false, can_view_fans: perm.can_view_fans ?? false,
        can_view_posts: perm.can_view_posts ?? false, can_create_posts: perm.can_create_posts ?? false,
        can_view_vault: perm.can_view_vault ?? false, can_view_earnings: perm.can_view_earnings ?? false,
        can_view_notifications: perm.can_view_notifications ?? false,
      };

      const { data: agency } = await svc.from("agencies").select("browser_session_mode").eq("id", link.agency_id).single();
      const sessionMode = agency?.browser_session_mode || "shared";

      const { data: existingSessions } = await svc.from("active_browser_sessions")
        .select("id, browserbase_session_id, embed_url, viewer_count, viewer_ids, session_link_id, chatter_id")
        .eq("session_link_id", sessionLinkId).eq("is_active", true).eq("session_type", "chatter")
        .order("started_at", { ascending: false }).limit(1);
      const existingSession = existingSessions?.[0];

      if (existingSession) {
        const alive = await isSessionAlive(BK, existingSession.browserbase_session_id);
        if (alive) {
          if (sessionMode === "exclusive") {
            let inUseBy = "another chatter";
            if (existingSession.chatter_id) { const { data: ch } = await svc.from("chatters").select("name").eq("id", existingSession.chatter_id).maybeSingle(); if (ch) inUseBy = ch.name; }
            return json({ error: `Session in use by ${inUseBy}. Please wait.`, code: "SESSION_IN_USE", inUseBy }, 409);
          }
          const currentViewerIds: string[] = existingSession.viewer_ids || [];
          const viewerId = chatterId || uid;
          if (!currentViewerIds.includes(viewerId)) currentViewerIds.push(viewerId);
          await svc.from("active_browser_sessions").update({ viewer_count: currentViewerIds.length, viewer_ids: currentViewerIds, last_heartbeat_at: new Date().toISOString() }).eq("id", existingSession.id);
          await svc.from("session_access_logs").insert({ session_link_id: sessionLinkId, chatter_id: chatterId, action: "join" });
          return json({ success: true, embedUrl: existingSession.embed_url, sessionId: existingSession.browserbase_session_id, platform: link.platform, permissions: permFlags, joined: true, viewerCount: currentViewerIds.length });
        } else {
          await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString(), viewer_count: 0, viewer_ids: [] }).eq("id", existingSession.id);
        }
      }

      const { data: cr } = await svc.from("creators").select("proxy_country, proxy_state, proxy_city, name").eq("id", link.creator_id).single();
      const { data: exts } = await svc.from("browser_extensions").select("browserbase_extension_id").eq("agency_id", link.agency_id).eq("is_active", true).eq("auto_inject", true);
      const extIds = (exts || []).map((e: any) => e.browserbase_extension_id).filter(Boolean);
      const proxies = proxyConf(cr);
      const resolvedState = proxies[0]?.geolocation?.state || "TX";

      const cfg = sessionBody(BP, link.browserbase_context_id, proxies, { timeout: 3600, extensionId: extIds[0] || undefined, userMetadata: { creatorId: link.creator_id, agencyId: link.agency_id, chatterId: chatterId || uid, platform: link.platform, sessionType: "chatter" } });
      const sess = await bb(BK, "/sessions", { method: "POST", body: JSON.stringify(cfg) });
      if (!sess?.id) return json({ error: "Failed to create browser session" }, 502);

      const chatterReady = await waitForSessionReady(BK, sess.id, 20000);
      if (!chatterReady) return json({ error: "Browser session failed to start." }, 502);

      await new Promise(r => setTimeout(r, 8000));
      try { await preLoginSetup(BK, sess.id, resolvedState); } catch {}

      const chatterStartUrl = PLATFORM_URLS[link.platform.toLowerCase()];
      let loginVerified = true;
      if (chatterStartUrl) {
        try {
          await navigateViaCDP(BK, sess.id, chatterStartUrl, { timeout: 25000 });
          await new Promise(r => setTimeout(r, 3000));
          const loginResult = await checkLoginViaCDP(BK, sess.id, { label: "Chatter login" });
          loginVerified = loginResult.isLoggedIn;
          if (!loginVerified) {
            await svc.from("creator_session_links").update({ session_status: "pending", updated_at: new Date().toISOString() }).eq("id", sessionLinkId);
            await svc.from("browser_session_events").insert({ agency_id: link.agency_id, session_link_id: sessionLinkId, browserbase_session_id: sess.id, event_type: "login_expired", severity: "warning", title: "Login Expired", message: `Creator session needs re-authentication.` });
          }
        } catch {}
      }

      await new Promise(r => setTimeout(r, 1500));
      const dbg = await bb(BK, `/sessions/${sess.id}/debug`);
      const liveUrl = dbg.pages?.[0]?.debuggerFullscreenUrl || dbg.debuggerFullscreenUrl;
      const viewerId = chatterId || uid;
      await svc.from("active_browser_sessions").insert({ session_link_id: sessionLinkId, chatter_id: chatterId, agency_id: link.agency_id, browserbase_session_id: sess.id, browserbase_live_url: liveUrl, embed_url: liveUrl, session_type: "chatter", viewer_count: 1, viewer_ids: [viewerId], last_heartbeat_at: new Date().toISOString() });
      await svc.from("session_access_logs").insert({ session_link_id: sessionLinkId, chatter_id: chatterId, action: "launch" });
      return json({ success: true, embedUrl: liveUrl, sessionId: sess.id, platform: link.platform, permissions: permFlags, joined: false, viewerCount: 1, loginVerified });
    }

    // ========== TERMINATE SESSION ==========
    if (action === "terminate_session") {
      const { browserbaseSessionId, chatterId: terminatingChatterId } = p;
      if (!browserbaseSessionId) return json({ error: "browserbaseSessionId required" }, 400);
      const { data: session } = await svc.from("active_browser_sessions")
        .select("id, viewer_count, viewer_ids, session_link_id, session_type")
        .eq("browserbase_session_id", browserbaseSessionId).eq("is_active", true).maybeSingle();
      if (session) {
        const currentViewerIds: string[] = session.viewer_ids || [];
        const viewerId = terminatingChatterId || uid;
        const updatedViewerIds = currentViewerIds.filter((id: string) => id !== viewerId);
        if (updatedViewerIds.length <= 0) {
          try { await fetch(`${BB_API}/sessions/${browserbaseSessionId}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); } catch {}
          await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString(), viewer_count: 0, viewer_ids: [] }).eq("id", session.id);
          if (session.session_link_id) {
            await svc.from("creator_session_links").update({ last_saved_at: new Date().toISOString(), browserbase_session_id: null, browserbase_live_url: null, updated_at: new Date().toISOString() }).eq("id", session.session_link_id);
          }
        } else {
          await svc.from("active_browser_sessions").update({ viewer_count: updatedViewerIds.length, viewer_ids: updatedViewerIds }).eq("id", session.id);
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
      await svc.from("active_browser_sessions").update({ last_heartbeat_at: new Date().toISOString() }).eq("browserbase_session_id", browserbaseSessionId).eq("is_active", true);
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: stale } = await svc.from("active_browser_sessions").select("id, browserbase_session_id").eq("is_active", true).eq("session_type", "chatter").lt("last_heartbeat_at", fiveMinAgo);
      for (const s of stale || []) { try { await fetch(`${BB_API}/sessions/${s.browserbase_session_id}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); } catch {} await svc.from("active_browser_sessions").update({ is_active: false, ended_at: new Date().toISOString(), viewer_count: 0, viewer_ids: [] }).eq("id", s.id); }
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
      if (!command) return json({ error: "command required" }, 400);

      const result = await executeCDPScript(BK, browserbaseSessionId,
        command === "goto" && url ? `(() => { window.location.href = '${url}'; return JSON.stringify({success:true}); })()`
        : command === "back" ? `(() => { history.back(); return JSON.stringify({success:true}); })()`
        : command === "forward" ? `(() => { history.forward(); return JSON.stringify({success:true}); })()`
        : command === "reload" ? `(() => { location.reload(); return JSON.stringify({success:true}); })()`
        : `JSON.stringify({success:false,error:"Invalid command"})`
      );
      return json(result);
    }

    // ========== INJECT SIDEBAR RESTRICTIONS ==========
    if (action === "inject_sidebar_restrictions") {
      const { browserbaseSessionId: bbSid, hideStatements, hideStatistics, hideMore } = p;
      if (!bbSid) return json({ error: "browserbaseSessionId required" }, 400);
      const cssRules: string[] = [];
      if (hideStatements) cssRules.push('a[href="/my/statements"] { display: none !important; }');
      if (hideStatistics) cssRules.push('a[href="/my/statistics"] { display: none !important; }');
      if (hideMore) cssRules.push('[data-name="more"], a[href="/more"] { display: none !important; }');
      if (cssRules.length === 0) return json({ success: true, message: "No restrictions to inject" });

      const injectionScript = `(function() { if (document.getElementById('creatoros-sidebar-restrictions')) return JSON.stringify({success:true}); var style = document.createElement('style'); style.id = 'creatoros-sidebar-restrictions'; style.textContent = ${JSON.stringify(cssRules.join('\n'))}; (document.head || document.documentElement).appendChild(style); var obs = new MutationObserver(function() { if (!document.getElementById('creatoros-sidebar-restrictions')) { var s2 = document.createElement('style'); s2.id = 'creatoros-sidebar-restrictions'; s2.textContent = style.textContent; (document.head || document.documentElement).appendChild(s2); } }); obs.observe(document.documentElement, { childList: true, subtree: true }); return JSON.stringify({success:true}); })()`;
      const result = await executeCDPScript(BK, bbSid, injectionScript);
      return json(result);
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
      return json({ success: true, extensionId: data.id });
    }

    if (action === "list_extensions") {
      try { return json({ success: true, extensions: await bb(BK, `/extensions?projectId=${BP}`) }); } catch { return json({ success: true, extensions: [] }); }
    }

    // ========== PROFILE WARMUP ==========
    if (action === "warmup_single_profile") {
      const { creatorId, agencyId, warmupType = "generic", contextId, keywords } = p;
      if (!agencyId) return json({ error: "agencyId required" }, 400);
      let bbContextId = contextId;
      if (creatorId && !bbContextId) bbContextId = await resolveContext(svc, BK, BP, creatorId, "onlyfans", agencyId, uid);
      if (!bbContextId) return json({ error: "No context available" }, 400);

      const { data: warmupRec } = await svc.from("creator_profile_warmups").insert({
        creator_id: creatorId || null, agency_id: agencyId, browserbase_context_id: bbContextId,
        status: "running", warmup_type: warmupType, total_sites: warmupType === "generic" ? 10 : warmupType === "research" ? 15 : 25,
        started_at: new Date().toISOString(),
      }).select("id").single();
      const warmupId = warmupRec!.id;

      let proxySettings = null;
      if (creatorId) { const { data: cr } = await svc.from("creators").select("proxy_country, proxy_state, proxy_city").eq("id", creatorId).maybeSingle(); if (cr) proxySettings = cr; }

      try {
        const proxies = proxySettings ? proxyConf(proxySettings) : [];
        const sess = await bb(BK, "/sessions", { method: "POST", body: JSON.stringify(sessionBody(BP, bbContextId, proxies, { keepAlive: false, timeout: 600, userMetadata: { warmup: true, agencyId, creatorId } })) });
        if (!sess?.id) throw new Error("Session creation failed");
        const sessReady = await waitForSessionReady(BK, sess.id, 15000);
        if (!sessReady) throw new Error("Session failed to start");

        let sitesVisited = 0;
        const genericSites = ["https://www.google.com/search?q=best+movies+2026", "https://www.youtube.com", "https://www.reddit.com/r/popular", "https://www.amazon.com/s?k=headphones", "https://www.cnn.com", "https://weather.com", "https://www.wikipedia.org", "https://www.espn.com", "https://www.instagram.com", "https://www.x.com"];
        const targetSites = genericSites.slice(0, warmupType === "generic" ? 10 : 15);

        for (const siteUrl of targetSites) {
          try {
            await navigateViaCDP(BK, sess.id, siteUrl, { timeout: 15000, evaluate: `window.scrollTo({top: Math.floor(Math.random()*800)+200, behavior:'smooth'})` });
            await new Promise(r => setTimeout(r, 3000 + Math.floor(Math.random() * 5000)));
            sitesVisited++;
            if (sitesVisited % 3 === 0) await svc.from("creator_profile_warmups").update({ sites_visited: sitesVisited }).eq("id", warmupId);
          } catch {}
        }

        try { await fetch(`${BB_API}/sessions/${sess.id}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); } catch {}
        await svc.from("creator_profile_warmups").update({ status: "completed", sites_visited: sitesVisited, completed_at: new Date().toISOString() }).eq("id", warmupId);
        return json({ success: true, warmupId, sitesVisited, status: "completed" });
      } catch (e: any) {
        await svc.from("creator_profile_warmups").update({ status: "failed", error_message: e.message, completed_at: new Date().toISOString() }).eq("id", warmupId);
        return json({ error: e.message, warmupId, status: "failed" }, 500);
      }
    }

    if (action === "assign_pre_warm_profile") {
      const { profileId, creatorId, agencyId } = p;
      if (!profileId || !creatorId || !agencyId) return json({ error: "profileId, creatorId, agencyId required" }, 400);
      const { data: profile } = await svc.from("pre_warmed_profiles").select("browserbase_context_id").eq("id", profileId).eq("status", "available").single();
      if (!profile) return json({ error: "Pre-warm profile not found or assigned" }, 404);
      await svc.from("pre_warmed_profiles").update({ assigned_creator_id: creatorId, status: "assigned" }).eq("id", profileId);
      const { data: existingLink } = await svc.from("creator_session_links").select("id").eq("creator_id", creatorId).eq("platform", "onlyfans").maybeSingle();
      if (existingLink) { await svc.from("creator_session_links").update({ browserbase_context_id: profile.browserbase_context_id, updated_at: new Date().toISOString() }).eq("id", existingLink.id); }
      else { await svc.from("creator_session_links").insert({ creator_id: creatorId, agency_id: agencyId, platform: "onlyfans", created_by: uid, encrypted_session: "browserbase", browserbase_context_id: profile.browserbase_context_id, session_status: "pending", is_active: false, expires_at: new Date(Date.now() + 365*24*60*60*1000).toISOString() }); }
      return json({ success: true, contextId: profile.browserbase_context_id });
    }

    if (action === "extended_warmup") {
      const { creatorId, agencyId, contextId, durationHours = 4 } = p;
      if (!agencyId) return json({ error: "agencyId required" }, 400);
      let bbContextId = contextId;
      if (creatorId && !bbContextId) bbContextId = await resolveContext(svc, BK, BP, creatorId, "onlyfans", agencyId, uid);
      if (!bbContextId) { const ctx = await bb(BK, "/contexts", { method: "POST", body: JSON.stringify({ projectId: BP }) }); bbContextId = ctx.id; }

      const totalSites = 60;
      const { data: warmupRec } = await svc.from("creator_profile_warmups").insert({ creator_id: creatorId || null, agency_id: agencyId, browserbase_context_id: bbContextId, status: "running", warmup_type: "extended", total_sites: totalSites, started_at: new Date().toISOString() }).select("id").single();
      const warmupId = warmupRec!.id;

      let proxySettings = null;
      if (creatorId) { const { data: cr } = await svc.from("creators").select("proxy_country, proxy_state, proxy_city").eq("id", creatorId).maybeSingle(); if (cr) proxySettings = cr; }

      try {
        const proxies = proxySettings ? proxyConf(proxySettings) : [];
        const timeoutSec = Math.min(durationHours * 3600, 14400);
        const sess = await bb(BK, "/sessions", { method: "POST", body: JSON.stringify(sessionBody(BP, bbContextId, proxies, { keepAlive: true, timeout: timeoutSec, userMetadata: { warmup: true, extended: true, agencyId, creatorId } })) });
        if (!sess?.id) throw new Error("Session creation failed");
        const ready = await waitForSessionReady(BK, sess.id, 20000);
        if (!ready) throw new Error("Session failed to start");

        let sitesVisited = 0;
        const EXTENDED_SITES = [
          "https://www.google.com/search?q=best+restaurants+near+me", "https://www.google.com/search?q=weather+today",
          "https://www.youtube.com", "https://www.youtube.com/feed/trending", "https://www.reddit.com", "https://www.reddit.com/r/popular",
          "https://www.x.com", "https://www.instagram.com", "https://www.tiktok.com", "https://www.facebook.com",
          "https://www.amazon.com/s?k=headphones", "https://www.amazon.com/s?k=running+shoes",
          "https://www.ebay.com", "https://www.walmart.com", "https://www.target.com", "https://www.bestbuy.com",
          "https://www.cnn.com", "https://www.bbc.com/news", "https://www.reuters.com", "https://news.google.com",
          "https://www.netflix.com", "https://www.twitch.tv", "https://www.spotify.com", "https://www.imdb.com",
          "https://weather.com", "https://www.google.com/maps", "https://www.wikipedia.org", "https://www.espn.com",
          "https://www.github.com", "https://stackoverflow.com", "https://www.medium.com", "https://www.quora.com",
          "https://www.yahoo.com/finance", "https://www.coinbase.com", "https://www.booking.com", "https://www.airbnb.com",
          "https://www.expedia.com", "https://www.webmd.com", "https://www.healthline.com", "https://www.yelp.com",
          "https://www.pinterest.com", "https://www.tumblr.com", "https://www.discord.com",
          "https://www.patreon.com", "https://ko-fi.com", "https://linktr.ee",
          "https://www.craigslist.org", "https://www.etsy.com", "https://www.zillow.com",
          "https://www.linkedin.com", "https://www.nba.com", "https://www.foxnews.com",
          "https://www.nytimes.com", "https://www.hulu.com", "https://www.bankofamerica.com",
        ];
        const shuffled = [...EXTENDED_SITES].sort(() => Math.random() - 0.5).slice(0, totalSites);
        const SCROLL_SCRIPTS = [
          `window.scrollTo({top: Math.floor(Math.random()*800)+200, behavior:'smooth'})`,
          `window.scrollBy({top: Math.floor(Math.random()*600)+100, behavior:'smooth'})`,
          `window.scrollTo({top: document.body.scrollHeight * Math.random(), behavior:'smooth'})`,
        ];

        for (const siteUrl of shuffled) {
          try {
            await navigateViaCDP(BK, sess.id, siteUrl, { timeout: 20000, evaluate: SCROLL_SCRIPTS[Math.floor(Math.random() * SCROLL_SCRIPTS.length)] });
            await new Promise(r => setTimeout(r, 5000 + Math.floor(Math.random() * 25000)));
            sitesVisited++;
            if (sitesVisited % 3 === 0) await svc.from("creator_profile_warmups").update({ sites_visited: sitesVisited }).eq("id", warmupId);
          } catch {}
        }

        try { await fetch(`${BB_API}/sessions/${sess.id}`, { method: "POST", headers: bbH(BK), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); } catch {}
        await svc.from("creator_profile_warmups").update({ status: "completed", sites_visited: sitesVisited, completed_at: new Date().toISOString() }).eq("id", warmupId);
        await svc.from("pre_warmed_profiles").update({ warmup_count: sitesVisited, last_warmed_at: new Date().toISOString() }).eq("browserbase_context_id", bbContextId);
        return json({ success: true, warmupId, sitesVisited, status: "completed", durationHours });
      } catch (e: any) {
        await svc.from("creator_profile_warmups").update({ status: "failed", error_message: e.message, completed_at: new Date().toISOString() }).eq("id", warmupId);
        return json({ error: e.message, warmupId, status: "failed" }, 500);
      }
    }

    // ========== JODIE: READ CHAT CONTEXT (CDP) ==========
    if (action === "read_chat_context") {
      const { browserbaseSessionId: bbSid } = p;
      if (!bbSid) return json({ error: "browserbaseSessionId required" }, 400);
      const extractScript = `(function() { var result = { messages: [], currentUrl: window.location.href, fanName: '' }; var header = document.querySelector('.b-chat__header-name, .g-user-name, [class*="chat-header"] .g-user-name'); if (header) result.fanName = header.innerText.trim(); var msgEls = document.querySelectorAll('.b-chat__message, [class*="b-chat__message"]'); var msgs = Array.from(msgEls).slice(-10); msgs.forEach(function(el) { var isOwn = el.classList.contains('b-chat__message--owner') || el.closest('[class*="message--owner"]'); var textEl = el.querySelector('.b-chat__message__text, [class*="message__text"]'); var text = textEl ? textEl.innerText.trim() : ''; if (text) result.messages.push({ role: isOwn ? 'creator' : 'fan', text: text }); }); var fanMsgs = result.messages.filter(function(m) { return m.role === 'fan'; }); result.lastFanMessage = fanMsgs.length > 0 ? fanMsgs[fanMsgs.length - 1].text : ''; return JSON.stringify(result); })()`;
      const result = await executeCDPScript(BK, bbSid, extractScript);
      return json(result);
    }

    // ========== JODIE: INJECT CHAT TEXT (CDP) ==========
    if (action === "inject_chat_text") {
      const { browserbaseSessionId: bbSid, text } = p;
      if (!bbSid) return json({ error: "browserbaseSessionId required" }, 400);
      if (!text) return json({ error: "text required" }, 400);
      const escapedText = (text as string).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
      const injectScript = `(function() { var input = document.querySelector('textarea[id="new_post_text_input"], .b-chat__input textarea, [class*="chat-input"] textarea, .b-make-post__textarea textarea'); if (!input) { input = document.querySelector('[contenteditable="true"][class*="chat"], .b-chat__input [contenteditable="true"]'); } if (!input) { input = document.querySelector('.b-make-post__wrapper textarea, .b-chat-message-input textarea'); } if (!input) return JSON.stringify({ success: false, error: 'Chat input not found' }); var text = '${escapedText}'; if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') { var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set; if (nativeSetter) nativeSetter.call(input, text); else input.value = text; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); } else { input.innerText = text; input.dispatchEvent(new Event('input', { bubbles: true })); } input.focus(); return JSON.stringify({ success: true }); })()`;
      const result = await executeCDPScript(BK, bbSid, injectScript);
      return json(result);
    }

    // ========== AUTO-LOGIN VIA CDP ==========
    if (action === "auto_login") {
      const { browserbaseSessionId: bbSid, sessionLinkId } = p;
      if (!bbSid) return json({ error: "browserbaseSessionId required" }, 400);
      if (!sessionLinkId) return json({ error: "sessionLinkId required" }, 400);

      // Get session link to find creator_id
      const { data: link } = await svc.from("creator_session_links")
        .select("creator_id, platform, agency_id")
        .eq("id", sessionLinkId).single();
      if (!link) return json({ error: "Session link not found" }, 404);

      // Verify caller belongs to this agency
      const { data: profile } = await svc.from("profiles").select("agency_id").eq("id", uid).single();
      if (!profile || profile.agency_id !== link.agency_id) return json({ error: "Unauthorized" }, 403);

      // First try to reuse existing authenticated context in the live session
      try {
        const contextLogin = await checkLoginViaCDP(BK, bbSid, { label: "Auto-login precheck" });
        if (contextLogin.isLoggedIn) {
          await svc.from("creator_session_links").update({
            session_status: "authenticated",
            last_saved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("id", sessionLinkId);
          return json({ success: true, step: "already_logged_in_context", loginVerified: true });
        }
      } catch (e) {
        console.warn("Auto-login precheck failed (continuing):", e);
      }

      // If precheck didn't detect login, navigate to the platform and retry
      // (cookies may not have been applied to the current page yet)
      const platformUrl = PLATFORM_URLS[link.platform?.toLowerCase() || "onlyfans"] || "https://onlyfans.com";
      try {
        console.log("Auto-login: Navigating to platform for cookie check...");
        await navigateViaCDP(BK, bbSid, platformUrl, { timeout: 20000 });
        await new Promise(r => setTimeout(r, 4000));
        const retryLogin = await checkLoginViaCDP(BK, bbSid, { label: "Auto-login retry after nav" });
        if (retryLogin.isLoggedIn) {
          await svc.from("creator_session_links").update({
            session_status: "authenticated",
            last_saved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("id", sessionLinkId);
          return json({ success: true, step: "already_logged_in_context", loginVerified: true });
        }
      } catch (e) {
        console.warn("Auto-login retry nav failed (continuing to credentials):", e);
      }

      // Get credentials from creator_credential_submissions
      const { data: creds } = await svc.from("creator_credential_submissions")
        .select("username, encrypted_password")
        .eq("creator_id", link.creator_id)
        .eq("platform", link.platform)
        .eq("status", "accepted")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!creds) {
        // No credentials and context didn't work — give actionable guidance
        return json({
          error: "Login session expired and no saved credentials found. Please either log in manually in the browser window, or submit credentials from the Creator's Platform Accounts tab.",
          step: "no_credentials",
        }, 404);
      }

      // The password is stored as base64-encoded (simple obfuscation)
      let password: string;
      try {
        password = atob(creds.encrypted_password);
      } catch {
        password = creds.encrypted_password;
      }

      console.log(`Auto-login: Starting for creator ${link.creator_id} on ${link.platform}`);
      const result = await autoLoginViaCDP(BK, bbSid, creds.username, password);
      console.log(`Auto-login result:`, JSON.stringify(result));

      if (result.success && result.step === "login_clicked") {
        // Wait a moment then check login status
        await new Promise(r => setTimeout(r, 5000));
        try {
          const loginCheck = await checkLoginViaCDP(BK, bbSid, { label: "Auto-login verify" });
          if (loginCheck.isLoggedIn) {
            await svc.from("creator_session_links").update({
              session_status: "authenticated",
              updated_at: new Date().toISOString(),
            }).eq("id", sessionLinkId);
          }
          return json({ ...result, loginVerified: loginCheck.isLoggedIn });
        } catch (e) {
          console.warn("Post-login verification failed:", e);
        }
      }

      return json(result);
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("browserbase-session error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
