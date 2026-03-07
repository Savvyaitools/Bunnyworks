import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BB_API = "https://api.browserbase.com/v1";
const bbH = (k: string) => ({ "x-bb-api-key": k, "Content-Type": "application/json" });
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function bb(k: string, p: string, o: RequestInit = {}) {
  const r = await fetch(`${BB_API}${p}`, { ...o, headers: { ...bbH(k), ...(o.headers || {}) } });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Browserbase API error (${r.status}): ${t}`);
  }
  return await r.json();
}

async function waitForSessionReady(apiKey: string, sessionId: string, maxWaitMs = 20000): Promise<boolean> {
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

// ===== AI extraction fallback =====
async function aiExtractEarnings(domText: string): Promise<{ total: number; tips: number; subscriptions: number; messages: number; referrals: number; posts: number } | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;
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
          { role: "system", content: "You are an OnlyFans earnings data extractor. Given raw page text from an OnlyFans earnings/statements page, extract the financial data. All values should be numbers (USD). If a value is not found, return 0." },
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
                total: { type: "number" }, tips: { type: "number" },
                subscriptions: { type: "number" }, messages: { type: "number" },
                referrals: { type: "number" }, posts: { type: "number" },
              },
              required: ["total", "tips", "subscriptions", "messages", "referrals", "posts"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_earnings" } },
      }),
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const p = JSON.parse(toolCall.function.arguments);
      return { total: Number(p.total) || 0, tips: Number(p.tips) || 0, subscriptions: Number(p.subscriptions) || 0, messages: Number(p.messages) || 0, referrals: Number(p.referrals) || 0, posts: Number(p.posts) || 0 };
    }
    return null;
  } catch { return null; }
}

// Proxy rotation
const PROXY_ROTATION_STATES = ["TX", "FL", "NY", "IL", "OH", "GA", "NC", "MI", "NJ", "VA", "WA", "AZ", "MA", "TN", "IN", "MO", "MD", "WI", "CO", "MN"];
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
  const rawState = c?.proxy_state;
  const rawCity = c?.proxy_city;
  let state: string;
  if (rawState && rawState !== "CA") {
    state = rawState.length > 2 ? (STATE_ABBREV[rawState.toLowerCase()] || "TX") : rawState.toUpperCase();
  } else {
    state = PROXY_ROTATION_STATES[Math.floor(Math.random() * PROXY_ROTATION_STATES.length)];
  }
  const geo: Record<string, string> = { country, state };
  if (rawCity) geo.city = rawCity;
  return [{ type: "browserbase", geolocation: geo }];
}

// ===== CDP Earnings Scraper (headless) =====
async function scrapeEarningsForCreator(
  bbKey: string, projectId: string, contextId: string, proxies: any[], creatorId: string, svc: any
): Promise<{ success: boolean; total?: number; error?: string }> {
  console.log(`[${creatorId}] Launching headless scrape session (context=${contextId})`);

  const sess = await bb(bbKey, "/sessions", {
    method: "POST",
    body: JSON.stringify({
      projectId,
      browserSettings: {
        context: { id: contextId, persist: true },
        advancedStealth: true,
        os: "windows",
      },
      proxies,
      keepAlive: false,
      timeout: 120,
      userMetadata: { cronScrape: true, creatorId },
    }),
  });

  if (!sess?.id) throw new Error("No session ID returned");

  const ready = await waitForSessionReady(bbKey, sess.id, 20000);
  if (!ready) {
    try { await fetch(`${BB_API}/sessions/${sess.id}`, { method: "POST", headers: bbH(bbKey), body: JSON.stringify({ status: "REQUEST_RELEASE" }) }); } catch { }
    throw new Error("Session failed to reach RUNNING state");
  }

  await new Promise(r => setTimeout(r, 5000));

  const wsUrl = `wss://connect.browserbase.com?apiKey=${bbKey}&sessionId=${sess.id}`;

  const scrapeResult = await new Promise<{ json?: any; domText?: string }>((resolve) => {
    let done = false;
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => { if (!done) { done = true; try { ws.close(); } catch { } resolve({}); } }, 45000);
    let mid = 1;
    let cdpSid: string | null = null;
    const pendingBodyRequests = new Map<number, string>();
    const domPollIds = new Set<number>();
    const earningsAccumulator: Record<string, any> = {};
    let earningsJson: any = null;
    let domText = "";
    let navigationConfirmed = false;
    let xhrCaptured = false;
    let xhrResponseCount = 0;
    let xhrFinishTimer: ReturnType<typeof setTimeout> | null = null;
    let domPollCount = 0;
    const MAX_DOM_POLLS = 8;

    const send = (method: string, params: Record<string, unknown> = {}) => {
      const id = mid++;
      const msg: any = { id, method, params };
      if (cdpSid) msg.sessionId = cdpSid;
      try { ws.send(JSON.stringify(msg)); } catch { }
      return id;
    };

    const finish = () => {
      if (done) return;
      done = true; clearTimeout(timer);
      if (xhrFinishTimer) clearTimeout(xhrFinishTimer);
      try { ws.close(); } catch { }
      resolve({ json: Object.keys(earningsAccumulator).length > 0 ? earningsAccumulator : earningsJson, domText });
    };

    const startDomPoll = () => {
      if (xhrCaptured || !navigationConfirmed || domPollCount >= MAX_DOM_POLLS || done) {
        if (domPollCount >= MAX_DOM_POLLS && !xhrCaptured) finish();
        return;
      }
      domPollCount++;
      setTimeout(() => {
        if (done || xhrCaptured) return;
        const pollId = send("Runtime.evaluate", { expression: "document.body.innerText.substring(0,8000)", returnByValue: true });
        domPollIds.add(pollId);
      }, 1500);
    };

    let getTargetsId: number | null = null;
    let attachId: number | null = null;
    let networkEnableId: number | null = null;
    let navigateId: number | null = null;

    ws.onopen = () => { getTargetsId = send("Target.getTargets"); };
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);

        if (msg.id === getTargetsId) {
          const page = (msg.result?.targetInfos || []).find((t: any) => t.type === "page");
          if (page) { attachId = send("Target.attachToTarget", { targetId: page.targetId, flatten: true }); }
          else { finish(); }
          return;
        }

        if (msg.id === attachId && msg.result?.sessionId) {
          cdpSid = msg.result.sessionId;
          networkEnableId = send("Network.enable", {});
          return;
        }

        if (msg.id === networkEnableId) {
          send("Page.enable", {});
          navigateId = send("Page.navigate", { url: "https://onlyfans.com/my/statistics/statements/earnings" });
          return;
        }

        if (msg.id === navigateId) {
          if (msg.error) { console.error(`[CDP] nav error:`, msg.error); finish(); }
          else { navigationConfirmed = true; setTimeout(() => startDomPoll(), 5000); }
          return;
        }

        if (msg.method === "Network.responseReceived") {
          const url = msg.params?.response?.url || "";
          const reqId = msg.params?.requestId;
          if (reqId && (
            url.includes("/api2/v2/earnings") || url.includes("/api2/v2/statics") ||
            url.includes("/api2/v2/statistics") || url.includes("statements/earnings") ||
            (url.includes("/chart") && url.includes("earning"))
          )) {
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
              xhrResponseCount++;
              xhrCaptured = true;
              if (xhrFinishTimer) clearTimeout(xhrFinishTimer);
              xhrFinishTimer = setTimeout(() => {
                earningsJson = earningsAccumulator;
                finish();
              }, 3000);
            } catch { }
          }
          return;
        }

        if (domPollIds.has(msg.id)) {
          domPollIds.delete(msg.id);
          if (xhrCaptured) return;
          const text = msg.result?.result?.value;
          if (typeof text === "string" && text.length > 200) {
            if (/\$[\d,]+/.test(text) || /(?:subscriptions|tips|messages|earnings)/i.test(text)) {
              domText = text;
              setTimeout(() => { if (!done && !xhrCaptured) finish(); }, 3000);
              return;
            }
          }
          startDomPoll();
          return;
        }
      } catch { }
    };
    ws.onerror = () => { if (!done) { done = true; clearTimeout(timer); if (xhrFinishTimer) clearTimeout(xhrFinishTimer); resolve({ json: Object.keys(earningsAccumulator).length > 0 ? earningsAccumulator : null, domText }); } };
    ws.onclose = () => { if (!done) { done = true; clearTimeout(timer); if (xhrFinishTimer) clearTimeout(xhrFinishTimer); resolve({ json: Object.keys(earningsAccumulator).length > 0 ? earningsAccumulator : null, domText }); } };
  });

  try {
    await fetch(`${BB_API}/sessions/${sess.id}`, { method: "POST", headers: bbH(bbKey), body: JSON.stringify({ status: "REQUEST_RELEASE" }) });
  } catch { }

  // ===== Parse results =====
  let bestTotal = 0, tips = 0, subs = 0, messages = 0, referrals = 0, posts = 0;
  let earningsSource = "none";

  if (scrapeResult.json) {
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
  }

  if (bestTotal === 0 && scrapeResult.domText) {
    const aiEarnings = await aiExtractEarnings(scrapeResult.domText);
    if (aiEarnings && aiEarnings.total > 0) {
      earningsSource = "ai";
      bestTotal = aiEarnings.total; tips = aiEarnings.tips; subs = aiEarnings.subscriptions;
      messages = aiEarnings.messages; referrals = aiEarnings.referrals; posts = aiEarnings.posts;
    } else {
      earningsSource = "dom";
      const rawText = scrapeResult.domText;
      const parseAmount = (labels: string[]): number => {
        for (const label of labels) {
          const m = rawText.match(new RegExp(label + `\\s*\\n\\s*\\$\\s*([\\d,]+\\.?\\d*)`, "i"));
          if (m) { const v = parseFloat(m[1].replace(/,/g, "")); if (!isNaN(v) && v > 0) return v; }
          const m2 = rawText.match(new RegExp(label + `[:\\s]+\\$\\s*([\\d,]+\\.?\\d*)`, "i"));
          if (m2) { const v = parseFloat(m2[1].replace(/,/g, "")); if (!isNaN(v) && v > 0) return v; }
        }
        return 0;
      };
      const totalE = parseAmount(["total", "net", "earnings"]);
      tips = parseAmount(["tips"]); subs = parseAmount(["subscriptions"]); messages = parseAmount(["messages", "chat"]);
      referrals = parseAmount(["referrals"]); posts = parseAmount(["posts"]);
      bestTotal = totalE || (tips + subs + messages + referrals + posts);
      if (!bestTotal) {
        const allAmounts = [...rawText.matchAll(/\$\s*([\d,]+\.?\d{0,2})/g)].map(m => parseFloat(m[1].replace(/,/g, ""))).filter(v => !isNaN(v) && v > 0);
        if (allAmounts.length > 0) bestTotal = Math.max(...allAmounts);
      }
    }
  }

  if (bestTotal > 0) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const { data: existing } = await svc.from("creator_earnings")
      .select("id").eq("creator_id", creatorId).eq("period_start", periodStart).eq("period_end", periodEnd).maybeSingle();

    const payload = {
      creator_id: creatorId, amount: bestTotal, tips: tips || 0, subscriptions: subs || 0,
      messages_revenue: messages || 0, referrals: referrals || 0,
      period_start: periodStart, period_end: periodEnd, platform: "onlyfans",
      notes: `Auto-scraped (queue/${earningsSource}) on ${now.toISOString().split("T")[0]}`,
    };

    if (existing) {
      await svc.from("creator_earnings").update(payload).eq("id", existing.id);
    } else {
      await svc.from("creator_earnings").insert(payload);
    }
    console.log(`[${creatorId}] Upserted earnings: $${bestTotal} (${earningsSource})`);
    return { success: true, total: bestTotal };
  }

  console.warn(`[${creatorId}] No earnings data found`);
  return { success: true, total: 0 };
}

// ===== Main handler: Queue-based worker =====
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const workerId = `worker-${crypto.randomUUID().slice(0, 8)}`;
  console.log(`=== Scrape Worker ${workerId} Started ===`);

  try {
    const BK = Deno.env.get("BROWSERBASE_API_KEY");
    const BP = Deno.env.get("BROWSERBASE_PROJECT_ID");
    if (!BK || !BP) throw new Error("Browserbase credentials not configured");

    const sUrl = Deno.env.get("SUPABASE_URL")!;
    const sKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const svc = createClient(sUrl, sKey);

    // Parse mode from request body
    let mode = "work"; // "enqueue" | "work" | "full" (enqueue + work) | "cleanup"
    try {
      const body = await req.json();
      if (body?.mode) mode = body.mode;
    } catch { }

    // --- ENQUEUE MODE: populate the queue ---
    if (mode === "enqueue" || mode === "full") {
      const { data: enqueueResult } = await svc.rpc("enqueue_scrape_jobs");
      console.log(`Enqueued ${enqueueResult ?? 0} new scrape jobs`);
      
      // Also recover stale jobs
      const { data: recovered } = await svc.rpc("recover_stale_scrape_jobs");
      if (recovered && recovered > 0) console.log(`Recovered ${recovered} stale jobs`);
      
      if (mode === "enqueue") {
        return new Response(
          JSON.stringify({ message: "Jobs enqueued", count: enqueueResult }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // --- CLEANUP MODE: run retention policies ---
    if (mode === "cleanup") {
      const { data: logsDeleted } = await svc.rpc("cleanup_old_activity_logs");
      const { data: jobsDeleted } = await svc.rpc("cleanup_old_scrape_jobs");
      console.log(`Cleanup: ${logsDeleted ?? 0} activity logs, ${jobsDeleted ?? 0} scrape jobs deleted`);
      return new Response(
        JSON.stringify({ message: "Cleanup complete", logsDeleted, jobsDeleted }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- WORK MODE: claim and process jobs ---
    const BATCH_SIZE = 3; // Process up to 3 creators in parallel
    const { data: jobs, error: claimErr } = await svc.rpc("claim_scrape_jobs", {
      worker_id: workerId,
      batch_size: BATCH_SIZE,
    });

    if (claimErr) throw claimErr;
    if (!jobs || jobs.length === 0) {
      console.log("No pending jobs to process");
      return new Response(
        JSON.stringify({ message: "No jobs to process", workerId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Claimed ${jobs.length} jobs: ${jobs.map((j: any) => j.creator_id).join(", ")}`);

    // Process claimed jobs in parallel
    const results = await Promise.allSettled(
      jobs.map(async (job: any) => {
        try {
          // Get session link context
          const { data: link } = await svc.from("creator_session_links")
            .select("browserbase_context_id")
            .eq("id", job.session_link_id)
            .single();

          if (!link?.browserbase_context_id) {
            throw new Error("No context ID for session link");
          }

          // Get creator proxy settings
          const { data: creator } = await svc.from("creators")
            .select("proxy_country, proxy_state, proxy_city")
            .eq("id", job.creator_id).single();

          const proxies = proxyConf(creator);
          const result = await scrapeEarningsForCreator(
            BK, BP, link.browserbase_context_id, proxies, job.creator_id, svc
          );

          // Mark job complete
          await svc.rpc("complete_scrape_job", {
            job_id: job.id,
            job_result: { total: result.total, source: "scrape" },
          });

          return { jobId: job.id, creatorId: job.creator_id, ...result };
        } catch (err: any) {
          const msg = err.message || "Unknown error";
          console.error(`[${job.creator_id}] Job ${job.id} failed:`, msg);
          await svc.rpc("fail_scrape_job", { job_id: job.id, err_msg: msg });
          return { jobId: job.id, creatorId: job.creator_id, success: false, error: msg };
        }
      })
    );

    const processed = results.map(r => r.status === "fulfilled" ? r.value : { success: false, error: "Promise rejected" });
    const successCount = processed.filter((r: any) => r?.success && (r?.total || 0) > 0).length;

    console.log(`=== Worker ${workerId} Complete: ${successCount}/${processed.length} with data ===`);

    return new Response(
      JSON.stringify({ message: "Worker complete", workerId, processed: processed.length, withData: successCount, results: processed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Worker error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
