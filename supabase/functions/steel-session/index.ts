import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const STEEL_API = "https://api.steel.dev/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function steelFetch(path: string, apiKey: string, opts: RequestInit = {}) {
  const r = await fetch(`${STEEL_API}${path}`, {
    ...opts,
    headers: {
      "Steel-Api-Key": apiKey,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Steel API error (${r.status}): ${t}`);
  }
  return r.json();
}

// CDP helper: run a script via WebSocket, return result
function cdpExecute(
  wsUrl: string,
  expression: string,
  timeoutMs = 15000
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  return new Promise((resolve) => {
    let mid = 1;
    let resolved = false;
    const ws = new WebSocket(wsUrl);

    const cleanup = (res: { success: boolean; result?: unknown; error?: string }) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try { ws.close(); } catch {}
      resolve(res);
    };

    const timer = setTimeout(() => {
      console.warn("CDP: timeout");
      cleanup({ success: false, error: "CDP timeout" });
    }, timeoutMs);

    const send = (method: string, params: Record<string, unknown> = {}, sid?: string) => {
      const id = mid++;
      const msg: any = { id, method, params };
      if (sid) msg.sessionId = sid;
      ws.send(JSON.stringify(msg));
      return id;
    };

    let getTargetsId: number | null = null;
    let attachId: number | null = null;
    let evalId: number | null = null;

    ws.onopen = () => {
      getTargetsId = send("Target.getTargets");
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);

        if (msg.id === getTargetsId) {
          const page = (msg.result?.targetInfos || []).find((t: any) => t.type === "page");
          if (page) {
            attachId = send("Target.attachToTarget", { targetId: page.targetId, flatten: true });
          } else {
            cleanup({ success: false, error: "No page target found" });
          }
          return;
        }

        if (msg.id === attachId) {
          const sid = msg.result?.sessionId;
          if (sid) {
            evalId = send("Runtime.evaluate", { expression, returnByValue: true }, sid);
          }
          return;
        }

        if (msg.id === evalId) {
          const val = msg.result?.result?.value;
          cleanup({ success: true, result: val });
          return;
        }
      } catch {}
    };

    ws.onerror = () => cleanup({ success: false, error: "WebSocket error" });
    ws.onclose = () => cleanup({ success: false, error: "WebSocket closed" });
  });
}

// CDP navigate helper
function cdpNavigate(
  wsUrl: string,
  url: string,
  timeoutMs = 20000
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    let mid = 1;
    let resolved = false;
    const ws = new WebSocket(wsUrl);

    const cleanup = (res: { success: boolean; error?: string }) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try { ws.close(); } catch {}
      resolve(res);
    };

    const timer = setTimeout(() => {
      cleanup({ success: true }); // timeout is non-fatal for navigation
    }, timeoutMs);

    const send = (method: string, params: Record<string, unknown> = {}, sid?: string) => {
      const id = mid++;
      const msg: any = { id, method, params };
      if (sid) msg.sessionId = sid;
      ws.send(JSON.stringify(msg));
      return id;
    };

    let getTargetsId: number | null = null;
    let attachId: number | null = null;
    let pageEnableId: number | null = null;
    let navigateId: number | null = null;

    ws.onopen = () => {
      getTargetsId = send("Target.getTargets");
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);

        if (msg.id === getTargetsId) {
          const page = (msg.result?.targetInfos || []).find((t: any) => t.type === "page");
          if (page) {
            attachId = send("Target.attachToTarget", { targetId: page.targetId, flatten: true });
          } else {
            cleanup({ success: false, error: "No page target found" });
          }
          return;
        }

        if (msg.id === attachId) {
          const sid = msg.result?.sessionId;
          if (sid) {
            pageEnableId = send("Page.enable", {}, sid);
          }
          return;
        }

        if (msg.id === pageEnableId) {
          const sid = (JSON.parse(evt.data) as any).sessionId;
          // We don't have sessionId from Page.enable response directly, track it
          navigateId = send("Page.navigate", { url }, undefined);
          return;
        }

        if (msg.method === "Page.loadEventFired" || msg.params?.method === "Page.loadEventFired") {
          cleanup({ success: true });
          return;
        }

        if (msg.id === navigateId) {
          // Navigation command sent, wait for load event or timeout
          return;
        }
      } catch {}
    };

    ws.onerror = () => cleanup({ success: false, error: "WebSocket error" });
    ws.onclose = () => cleanup({ success: false, error: "WebSocket closed" });
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const STEEL_KEY = Deno.env.get("STEEL_API_KEY");
    if (!STEEL_KEY) throw new Error("STEEL_API_KEY not configured");

    const sUrl = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    // Validate auth
    const sb = createClient(sUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const token = auth.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await sb.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { action, ...p } = body;

    // ========== CREATE SESSION ==========
    if (action === "create_session") {
      const useProxy = p.useProxy === true;
      const solveCaptcha = p.solveCaptcha === true;
      console.log(`Steel: Creating test session (proxy=${useProxy}, captcha=${solveCaptcha})`);
      const sessionOpts: Record<string, unknown> = {
        timeout: 900000,
      };
      if (useProxy) sessionOpts.useProxy = true;
      if (solveCaptcha) sessionOpts.solveCaptcha = true;

      const session = await steelFetch("/sessions", STEEL_KEY, {
        method: "POST",
        body: JSON.stringify(sessionOpts),
      });

      console.log("Steel: Session created:", session.id, "Status:", session.status);

      return json({
        sessionId: session.id,
        status: session.status,
        sessionViewerUrl: session.sessionViewerUrl,
        cdpWsUrl: session.websocketUrl || `wss://connect.steel.dev?apiKey=${STEEL_KEY}&sessionId=${session.id}`,
      });
    }

    // ========== CHECK STATUS ==========
    if (action === "check_status") {
      const { sessionId } = p;
      if (!sessionId) return json({ error: "sessionId required" }, 400);

      const session = await steelFetch(`/sessions/${sessionId}`, STEEL_KEY);
      return json({
        sessionId: session.id,
        status: session.status,
        isAlive: session.status === "live",
      });
    }

    // ========== CDP NAVIGATE ==========
    if (action === "cdp_navigate") {
      const { sessionId, url } = p;
      if (!sessionId || !url) return json({ error: "sessionId and url required" }, 400);

      // Get CDP WebSocket URL
      const wsUrl = `wss://connect.steel.dev?apiKey=${STEEL_KEY}&sessionId=${sessionId}`;
      console.log(`Steel CDP: Navigating to ${url}`);

      const result = await cdpNavigate(wsUrl, url);
      return json({ ...result, url });
    }

    // ========== CHECK LOGIN ==========
    if (action === "check_login") {
      const { sessionId } = p;
      if (!sessionId) return json({ error: "sessionId required" }, 400);

      const wsUrl = `wss://connect.steel.dev?apiKey=${STEEL_KEY}&sessionId=${sessionId}`;
      console.log("Steel CDP: Checking login state");

      const result = await cdpExecute(wsUrl, `(function() {
        var url = window.location.href;
        var hasLoginForm = !!document.querySelector('form.b-loginreg, form[action*="login"], .b-loginreg, input[name="email"][type="text"]');
        var onLoginPage = url.includes('/login') || url.includes('/signup') || url === 'https://onlyfans.com/' || url === 'https://onlyfans.com';
        var hasNav = !!document.querySelector('.b-tabs, .l-header__menu, [data-name="ProfileMenu"], .b-sidebar, .b-make-post');
        var status;
        if (hasNav && !hasLoginForm && !onLoginPage) status = 'logged_in';
        else if (hasLoginForm || onLoginPage) status = 'not_logged_in';
        else status = 'ambiguous';
        return JSON.stringify({ status: status, url: url, title: document.title });
      })()`);

      let loginData = { status: "unknown", url: "", title: "" };
      if (result.success && result.result) {
        try { loginData = JSON.parse(result.result as string); } catch {}
      }

      return json({
        ...result,
        loginState: loginData.status,
        pageUrl: loginData.url,
        pageTitle: loginData.title,
      });
    }

    // ========== GET COOKIES ==========
    if (action === "get_cookies") {
      const { sessionId, domain } = p;
      if (!sessionId) return json({ error: "sessionId required" }, 400);

      const wsUrl = `wss://connect.steel.dev?apiKey=${STEEL_KEY}&sessionId=${sessionId}`;
      
      const result = await cdpExecute(wsUrl, `document.cookie`);
      return json({
        success: result.success,
        hasCookies: !!(result.result && (result.result as string).length > 0),
        cookieLength: result.result ? (result.result as string).length : 0,
      });
    }

    // ========== RELEASE SESSION ==========
    if (action === "release") {
      const { sessionId } = p;
      if (!sessionId) return json({ error: "sessionId required" }, 400);

      console.log(`Steel: Releasing session ${sessionId}`);
      try {
        await steelFetch(`/sessions/${sessionId}/release`, STEEL_KEY, { method: "POST" });
      } catch (err) {
        // Try DELETE as fallback
        console.log("Steel: POST release failed, trying DELETE");
        const r = await fetch(`${STEEL_API}/sessions/${sessionId}`, {
          method: "DELETE",
          headers: { "Steel-Api-Key": STEEL_KEY },
        });
        if (!r.ok) {
          const t = await r.text();
          throw new Error(`Steel release failed: ${t}`);
        }
      }

      return json({ success: true, message: "Session released" });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err: any) {
    console.error("Steel session error:", err);
    return json({ error: err.message || "Unknown error" }, 500);
  }
});
