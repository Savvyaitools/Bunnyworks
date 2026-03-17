/**
 * Shared CDP (Chrome DevTools Protocol) helpers for browser edge functions.
 * Eliminates code duplication across browser-session-launcher, browser-session-monitor,
 * browser-session-scraper, and browser-warmup functions.
 */

const BB_API = "https://api.browserbase.com/v1";
const ENABLE_ADVANCED_STEALTH = Deno.env.get("BROWSERBASE_ADVANCED_STEALTH") === "true";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const bbH = (k: string) => ({
  "x-bb-api-key": k,
  "Content-Type": "application/json",
});

export async function bb(
  k: string,
  p: string,
  o: RequestInit = {}
) {
  const r = await fetch(`${BB_API}${p}`, {
    ...o,
    headers: { ...bbH(k), ...(o.headers || {}) },
  });
  if (!r.ok) {
    const t = await r.text();
    if (r.status === 402)
      throw new Error("BILLING: Browserbase free plan minutes used up.");
    throw new Error(`Browserbase API error (${r.status}): ${t}`);
  }
  const data = await r.json();
  if (!data) {
    console.error(`Browserbase API returned null/empty for ${p}`);
    throw new Error(`Browserbase API returned empty response for ${p}`);
  }
  return data;
}

export async function isSessionAlive(
  k: string,
  sessionId: string
): Promise<boolean> {
  try {
    const d = await bb(k, `/sessions/${sessionId}`);
    return d.status === "RUNNING";
  } catch {
    return false;
  }
}

export async function waitForSessionReady(
  apiKey: string,
  sessionId: string,
  maxWaitMs = 15000
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const d = await bb(apiKey, `/sessions/${sessionId}`);
      if (d.status === "RUNNING") return true;
      if (d.status === "ERROR" || d.status === "TIMED_OUT") return false;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

export const PLATFORM_URLS: Record<string, string> = {
  onlyfans: "https://onlyfans.com",
  fanvue: "https://fanvue.com",
  fansly: "https://fansly.com",
};

// ========== CDP Navigation ==========
export async function navigateViaCDP(
  apiKey: string,
  sessionId: string,
  url: string,
  options?: { evaluate?: string; timeout?: number }
): Promise<{
  success: boolean;
  timedOut?: boolean;
  result?: unknown;
  error?: string;
}> {
  const timeout = options?.timeout ?? 20000;
  const wsUrl = `wss://connect.browserbase.com?apiKey=${apiKey}&sessionId=${sessionId}`;
  console.log(`CDP: Connecting for navigation to ${url}`);

  return new Promise((resolve) => {
    let msgId = 1;
    let resolved = false;
    const ws = new WebSocket(wsUrl);

    const cleanup = (result: {
      success: boolean;
      timedOut?: boolean;
      result?: unknown;
      error?: string;
    }) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {}
      resolve(result);
    };

    const timer = setTimeout(() => {
      console.warn(`CDP: Navigation timeout after ${timeout}ms (non-fatal)`);
      cleanup({ success: true, timedOut: true, result: null });
    }, timeout);

    const send = (
      method: string,
      params: Record<string, unknown> = {},
      sid?: string
    ) => {
      const id = msgId++;
      const msg: any = { id, method, params };
      if (sid) msg.sessionId = sid;
      ws.send(JSON.stringify(msg));
      return id;
    };

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
            console.log(
              `CDP: Found page target ${pageTarget.targetId}, attaching`
            );
            attachId = send("Target.attachToTarget", {
              targetId: pageTarget.targetId,
              flatten: true,
            });
          } else {
            console.error("CDP: No page target found");
            cleanup({ success: false, error: "No page target found" });
          }
          return;
        }

        if (msg.id === attachId) {
          sessionId_cdp = msg.result?.sessionId;
          console.log(
            `CDP: Attached to target, sessionId: ${sessionId_cdp}`
          );
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
            console.log(
              "CDP: Page.navigate OK, frameId:",
              msg.result?.frameId
            );
          }
          return;
        }

        if (
          msg.method === "Page.loadEventFired" ||
          msg.params?.method === "Page.loadEventFired"
        ) {
          console.log("CDP: Page load event fired");
          if (options?.evaluate && sessionId_cdp) {
            evaluateId = send(
              "Runtime.evaluate",
              { expression: options.evaluate, returnByValue: true },
              sessionId_cdp
            );
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
      cleanup({
        success: false,
        error: "WebSocket closed before completion",
      });
    };
  });
}

// ========== CDP Login Check (2-phase: CSS + AI fallback) ==========
export async function checkLoginViaCDP(
  apiKey: string,
  sessionId: string,
  opts?: { timeout?: number; label?: string }
): Promise<{
  isLoggedIn: boolean;
  checkResult: string;
  domText: string;
  pageUrl: string;
}> {
  const label = opts?.label || "Login check";
  const timeout = opts?.timeout ?? 8000;

  const loginCheckData = await new Promise<{
    checkResult: string;
    domText: string;
    pageUrl: string;
  }>((resolve) => {
    const ws = new WebSocket(
      `wss://connect.browserbase.com?apiKey=${apiKey}&sessionId=${sessionId}`
    );
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        try {
          ws.close();
        } catch {}
        resolve({ checkResult: "unknown", domText: "", pageUrl: "" });
      }
    }, timeout);
    let mid = 1;
    let getTargetsId: number | null = null;
    let attachId: number | null = null;
    let evalId: number | null = null;

    const send = (
      method: string,
      params: Record<string, unknown> = {},
      sid?: string
    ) => {
      const id = mid++;
      const msg: any = { id, method, params };
      if (sid) msg.sessionId = sid;
      ws.send(JSON.stringify(msg));
      return id;
    };

    ws.onopen = () => {
      getTargetsId = send("Target.getTargets");
    };
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.id === getTargetsId) {
          const page = (msg.result?.targetInfos || []).find(
            (t: any) => t.type === "page"
          );
          if (page) {
            attachId = send("Target.attachToTarget", {
              targetId: page.targetId,
              flatten: true,
            });
          } else {
            done = true;
            clearTimeout(timer);
            try {
              ws.close();
            } catch {}
            resolve({ checkResult: "unknown", domText: "", pageUrl: "" });
          }
          return;
        }
        if (msg.id === attachId) {
          const sid = msg.result?.sessionId;
          if (sid) {
            evalId = send(
              "Runtime.evaluate",
              {
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
              },
              sid
            );
          }
          return;
        }
        if (msg.id === evalId) {
          const val =
            msg.result?.result?.value ||
            '{"cssResult":"unknown","domText":"","pageUrl":""}';
          try {
            const parsed = JSON.parse(val);
            done = true;
            clearTimeout(timer);
            try {
              ws.close();
            } catch {}
            resolve({
              checkResult: parsed.cssResult || "unknown",
              domText: parsed.domText || "",
              pageUrl: parsed.pageUrl || "",
            });
          } catch {
            done = true;
            clearTimeout(timer);
            try {
              ws.close();
            } catch {}
            resolve({ checkResult: "unknown", domText: "", pageUrl: "" });
          }
          return;
        }
      } catch {}
    };
    ws.onerror = () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve({ checkResult: "unknown", domText: "", pageUrl: "" });
      }
    };
    ws.onclose = () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve({ checkResult: "unknown", domText: "", pageUrl: "" });
      }
    };
  });

  const { checkResult, domText, pageUrl } = loginCheckData;
  console.log(`${label}: CSS pre-check=${checkResult} (url: ${pageUrl})`);

  let isLoggedIn: boolean;
  if (!domText && !pageUrl) {
    isLoggedIn = true;
    console.log(
      `${label}: CDP returned empty DOM & URL — fail-open, preserving cookies`
    );
  } else if (checkResult === "logged_in") {
    isLoggedIn = true;
  } else if (checkResult === "not_logged_in") {
    isLoggedIn = false;
  } else {
    // AI fallback for ambiguous/unknown cases
    console.log(`${label}: Ambiguous, invoking AI detection...`);
    const aiResult = await aiDetectLoginState(domText, pageUrl);
    if (
      aiResult &&
      (aiResult.confidence === "high" || aiResult.confidence === "medium")
    ) {
      isLoggedIn = aiResult.logged_in;
      console.log(
        `${label} AI: logged_in=${aiResult.logged_in}, confidence=${aiResult.confidence}, reason=${aiResult.reason}`
      );
    } else {
      isLoggedIn = true;
      console.log(
        `${label} AI inconclusive (${aiResult?.confidence || "no result"}), defaulting to persist`
      );
    }
  }

  return { isLoggedIn, checkResult, domText, pageUrl };
}

// ========== CDP Cookie Verification ==========
export async function verifyCookiesRestored(
  apiKey: string,
  sessionId: string,
  domain: string
): Promise<{ cookieCount: number; verified: boolean }> {
  return new Promise((resolve) => {
    const ws = new WebSocket(
      `wss://connect.browserbase.com?apiKey=${apiKey}&sessionId=${sessionId}`
    );
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        try {
          ws.close();
        } catch {}
        resolve({ cookieCount: -1, verified: false });
      }
    }, 6000);
    let mid = 1;
    let getTargetsId: number | null = null;
    let attachId: number | null = null;
    let getCookiesId: number | null = null;

    const send = (
      method: string,
      params: Record<string, unknown> = {},
      sid?: string
    ) => {
      const id = mid++;
      const msg: any = { id, method, params };
      if (sid) msg.sessionId = sid;
      try {
        ws.send(JSON.stringify(msg));
      } catch {}
      return id;
    };

    ws.onopen = () => {
      getTargetsId = send("Target.getTargets");
    };
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.id === getTargetsId) {
          const page = (msg.result?.targetInfos || []).find(
            (t: any) => t.type === "page"
          );
          if (page) {
            attachId = send("Target.attachToTarget", {
              targetId: page.targetId,
              flatten: true,
            });
          } else {
            done = true;
            clearTimeout(timer);
            try {
              ws.close();
            } catch {}
            resolve({ cookieCount: -1, verified: false });
          }
          return;
        }
        if (msg.id === attachId) {
          const sid = msg.result?.sessionId;
          if (sid) {
            getCookiesId = send(
              "Network.getCookies",
              { urls: [`https://${domain}`] },
              sid
            );
          }
          return;
        }
        if (msg.id === getCookiesId) {
          const cookies = msg.result?.cookies || [];
          const count = cookies.length;
          console.log(
            `Cookie verification: ${count} cookies found for ${domain}`
          );
          done = true;
          clearTimeout(timer);
          try {
            ws.close();
          } catch {}
          resolve({ cookieCount: count, verified: count > 0 });
          return;
        }
      } catch {}
    };
    ws.onerror = () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve({ cookieCount: -1, verified: false });
      }
    };
    ws.onclose = () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve({ cookieCount: -1, verified: false });
      }
    };
  });
}

// ========== CDP Script Execution Helper ==========
export async function executeCDPScript(
  apiKey: string,
  sessionId: string,
  script: string,
  timeout = 10000
): Promise<{ success: boolean; data?: any; error?: string }> {
  return new Promise((resolve) => {
    let mid = 1;
    let resolved = false;
    const ws = new WebSocket(
      `wss://connect.browserbase.com?apiKey=${apiKey}&sessionId=${sessionId}`
    );
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          ws.close();
        } catch {}
        resolve({ success: false, error: "Timeout" });
      }
    }, timeout);

    const send = (
      method: string,
      params: Record<string, unknown> = {},
      sid?: string
    ) => {
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
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string);
        if (msg.id === getTargetsId && msg.result?.targetInfos) {
          const page = msg.result.targetInfos.find(
            (t: any) => t.type === "page"
          );
          if (page) {
            attachId = send("Target.attachToTarget", {
              targetId: page.targetId,
              flatten: true,
            });
          } else {
            resolved = true;
            clearTimeout(timer);
            ws.close();
            resolve({ success: false, error: "No page target" });
          }
        } else if (msg.id === attachId && msg.result?.sessionId) {
          evalId = send(
            "Runtime.evaluate",
            { expression: script, returnByValue: true },
            msg.result.sessionId
          );
        } else if (msg.id === evalId) {
          const val = msg.result?.result?.value;
          let data = {};
          try {
            data = JSON.parse(val);
          } catch {}
          resolved = true;
          clearTimeout(timer);
          ws.close();
          resolve({ success: true, data });
        }
      } catch {}
    };
    ws.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ success: false, error: "WebSocket error" });
      }
    };
  });
}

// ========== AI-Powered Detection ==========
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function aiDetectLoginState(
  domText: string,
  currentUrl: string
): Promise<{
  logged_in: boolean;
  confidence: string;
  reason: string;
} | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.warn("AI login detection: LOVABLE_API_KEY not set");
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an OnlyFans login state detector. Given raw page text and the current URL, determine if the user is logged into OnlyFans. Look for indicators like: navigation menus, profile elements, earnings data, chat lists (logged in) vs login forms, signup prompts, 'Enter your email' fields (not logged in). The URL being just 'https://onlyfans.com/' or containing '/login' usually means not logged in.",
          },
          {
            role: "user",
            content: `URL: ${currentUrl}\n\nPage text:\n${domText.substring(0, 6000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "detect_login_state",
              description:
                "Report whether the user is logged into OnlyFans",
              parameters: {
                type: "object",
                properties: {
                  logged_in: {
                    type: "boolean",
                    description:
                      "Whether the user appears to be logged in",
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description:
                      "Confidence level of the determination",
                  },
                  reason: {
                    type: "string",
                    description:
                      "Brief explanation of why this determination was made",
                  },
                },
                required: ["logged_in", "confidence", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "detect_login_state" },
        },
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

export async function aiExtractEarnings(
  domText: string
): Promise<{
  total: number;
  tips: number;
  subscriptions: number;
  messages: number;
  referrals: number;
  posts: number;
} | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.warn("AI extraction: LOVABLE_API_KEY not set");
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an OnlyFans earnings data extractor. Given raw page text from an OnlyFans earnings/statements page, extract the financial data. All values should be numbers (USD). If a value is not found, return 0. The 'total' should be the overall net earnings amount.",
          },
          { role: "user", content: domText.substring(0, 8000) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_earnings",
              description: "Report extracted OnlyFans earnings data",
              parameters: {
                type: "object",
                properties: {
                  total: {
                    type: "number",
                    description: "Total/net earnings in USD",
                  },
                  tips: {
                    type: "number",
                    description: "Tips earnings in USD",
                  },
                  subscriptions: {
                    type: "number",
                    description: "Subscription earnings in USD",
                  },
                  messages: {
                    type: "number",
                    description: "Messages/chat earnings in USD",
                  },
                  referrals: {
                    type: "number",
                    description: "Referral earnings in USD",
                  },
                  posts: {
                    type: "number",
                    description: "Posts earnings in USD",
                  },
                },
                required: [
                  "total",
                  "tips",
                  "subscriptions",
                  "messages",
                  "referrals",
                  "posts",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "report_earnings" },
        },
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

// ========== Session & Proxy Helpers ==========

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
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY",
};

const PROXY_ROTATION_STATES = [
  "TX", "FL", "NY", "IL", "OH", "GA", "NC", "MI", "NJ", "VA",
  "WA", "AZ", "MA", "TN", "IN", "MO", "MD", "WI", "CO", "MN",
];

export const STATE_TIMEZONES: Record<string, string> = {
  TX: "America/Chicago", FL: "America/New_York", NY: "America/New_York",
  IL: "America/Chicago", OH: "America/New_York", GA: "America/New_York",
  NC: "America/New_York", MI: "America/Detroit", NJ: "America/New_York",
  VA: "America/New_York", WA: "America/Los_Angeles", AZ: "America/Phoenix",
  MA: "America/New_York", TN: "America/Chicago",
  IN: "America/Indiana/Indianapolis", MO: "America/Chicago",
  MD: "America/New_York", WI: "America/Chicago", CO: "America/Denver",
  MN: "America/Chicago", CA: "America/Los_Angeles", PA: "America/New_York",
};

export function proxyConf(c: any) {
  const country = c?.proxy_country || "US";
  const rawState = c?.proxy_state;
  const rawCity = c?.proxy_city;
  let state: string;
  if (rawState && rawState !== "CA") {
    state =
      rawState.length > 2
        ? STATE_ABBREV[rawState.toLowerCase()] || "TX"
        : rawState.toUpperCase();
  } else {
    const idx = Math.floor(Math.random() * PROXY_ROTATION_STATES.length);
    state = PROXY_ROTATION_STATES[idx];
  }
  const geo: Record<string, string> = { country, state };
  if (rawCity) geo.city = rawCity;
  console.log(`Proxy: ${country}/${state}${rawCity ? `/${rawCity}` : ""}`);
  return [{ type: "browserbase", geolocation: geo }];
}

export function sessionBody(
  projectId: string,
  contextId: string,
  proxies: any[],
  opts: {
    timeout?: number;
    keepAlive?: boolean;
    userMetadata?: Record<string, unknown>;
    extensionId?: string;
  } = {}
) {
  const body: any = {
    projectId,
    browserSettings: {
      context: { id: contextId, persist: true },
      ...(ENABLE_ADVANCED_STEALTH ? { advancedStealth: true, os: "windows" } : {}),
    },
    proxies,
    keepAlive: opts.keepAlive ?? true,
    timeout: opts.timeout ?? 1800,
    userMetadata: opts.userMetadata || {},
  };
  if (opts.extensionId) body.extensionId = opts.extensionId;
  return body;
}

export async function resolveContext(
  sb: any,
  bbKey: string,
  projectId: string,
  creatorId: string,
  platform: string,
  agencyId?: string,
  userId?: string
): Promise<string> {
  const { data: ex } = await sb
    .from("creator_session_links")
    .select("browserbase_context_id")
    .eq("creator_id", creatorId)
    .eq("platform", platform)
    .not("browserbase_context_id", "is", null)
    .maybeSingle();
  if (ex?.browserbase_context_id) {
    console.log(
      `Reusing existing context ${ex.browserbase_context_id} for creator ${creatorId}`
    );
    return ex.browserbase_context_id;
  }
  console.log(`Creating new context for creator ${creatorId}`);
  const ctx = await bb(bbKey, "/contexts", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
  if (!ctx?.id)
    throw new Error("Failed to create Browserbase context — no ID returned");
  if (agencyId) {
    await sb.from("creator_session_links").upsert(
      {
        creator_id: creatorId,
        agency_id: agencyId,
        platform,
        created_by: userId || null,
        encrypted_session: "browserbase",
        browserbase_context_id: ctx.id,
        session_status: "pending",
        is_active: false,
        expires_at: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      { onConflict: "creator_id,platform" }
    );
  }
  return ctx.id;
}

export async function preLoginSetup(
  apiKey: string,
  sessionId: string,
  proxyState: string
): Promise<void> {
  const tz = STATE_TIMEZONES[proxyState] || "America/New_York";
  const wsUrl = `wss://connect.browserbase.com?apiKey=${apiKey}&sessionId=${sessionId}`;
  console.log(
    `Setup: Setting timezone=${tz}, locale=en-US for state=${proxyState}`
  );

  await new Promise<void>((resolve) => {
    let msgId = 1;
    let resolved = false;
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          ws.close();
        } catch {}
        resolve();
      }
    }, 10000);

    const send = (
      method: string,
      params: Record<string, unknown> = {},
      sid?: string
    ) => {
      const id = msgId++;
      const msg: any = { id, method, params };
      if (sid) msg.sessionId = sid;
      try {
        ws.send(JSON.stringify(msg));
      } catch {}
      return id;
    };

    let getTargetsId: number | null = null;
    let attachId: number | null = null;

    ws.onopen = () => {
      getTargetsId = send("Target.getTargets");
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);

        if (msg.id === getTargetsId) {
          const page = (msg.result?.targetInfos || []).find(
            (t: any) => t.type === "page"
          );
          if (page) {
            attachId = send("Target.attachToTarget", {
              targetId: page.targetId,
              flatten: true,
            });
          } else {
            resolved = true;
            clearTimeout(timer);
            try {
              ws.close();
            } catch {}
            resolve();
          }
          return;
        }

        if (msg.id === attachId) {
          const cdpSession = msg.result?.sessionId;
          if (!cdpSession) {
            resolved = true;
            clearTimeout(timer);
            try {
              ws.close();
            } catch {}
            resolve();
            return;
          }
          send(
            "Emulation.setTimezoneOverride",
            { timezoneId: tz },
            cdpSession
          );
          send(
            "Emulation.setLocaleOverride",
            { locale: "en-US" },
            cdpSession
          );
          console.log("Setup: Timezone & locale set ✓");
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              try {
                ws.close();
              } catch {}
              resolve();
            }
          }, 500);
          return;
        }
      } catch {}
    };

    ws.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve();
      }
    };
    ws.onclose = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve();
      }
    };
  });
}

// ========== CDP Auto-Login (type credentials into OnlyFans login form) ==========
export async function autoLoginViaCDP(
  apiKey: string,
  sessionId: string,
  username: string,
  password: string,
  opts?: { timeout?: number }
): Promise<{ success: boolean; error?: string; step?: string }> {
  const timeout = opts?.timeout ?? 30000;

  return new Promise((resolve) => {
    let mid = 1;
    let resolved = false;
    const ws = new WebSocket(
      `wss://connect.browserbase.com?apiKey=${apiKey}&sessionId=${sessionId}`
    );

    const done = (result: { success: boolean; error?: string; step?: string }) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try { ws.close(); } catch {}
      resolve(result);
    };

    const timer = setTimeout(() => {
      done({ success: false, error: "Timeout waiting for login flow", step: "timeout" });
    }, timeout);

    const send = (method: string, params: Record<string, unknown> = {}, sid?: string) => {
      const id = mid++;
      const msg: any = { id, method, params };
      if (sid) msg.sessionId = sid;
      ws.send(JSON.stringify(msg));
      return id;
    };

    let getTargetsId: number | null = null;
    let attachId: number | null = null;
    let cdpSessionId: string | null = null;
    let stepIds: Record<string, number> = {};
    let currentStep = "init";

    const escapeForJS = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');

    const runStep = async (step: string, script: string) => {
      currentStep = step;
      console.log(`AutoLogin CDP: step=${step}`);
      stepIds[step] = send("Runtime.evaluate", {
        expression: script,
        returnByValue: true,
        awaitPromise: true,
      }, cdpSessionId!);
    };

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
            done({ success: false, error: "No page target found", step: "attach" });
          }
          return;
        }

        if (msg.id === attachId) {
          cdpSessionId = msg.result?.sessionId;
          if (!cdpSessionId) { done({ success: false, error: "No CDP session", step: "attach" }); return; }
          send("Page.enable", {}, cdpSessionId);
          send("Runtime.enable", {}, cdpSessionId);
          // Step 1: Check if we're on the login page, if not navigate there
          runStep("check_page", `(function() {
            var url = window.location.href;
            if (url.includes('onlyfans.com')) {
              // Check if login form exists
              var emailInput = document.querySelector('input[name="email"], input[type="email"], input[id="email-field"]');
              if (emailInput) return JSON.stringify({ onLoginPage: true });
              // Check if already logged in
              var sidebar = document.querySelector('.b-sidebar, [class*="sidebar"]');
              if (sidebar) return JSON.stringify({ alreadyLoggedIn: true });
              return JSON.stringify({ onLoginPage: false, needsNav: true });
            }
            return JSON.stringify({ onLoginPage: false, needsNav: true });
          })()`);
          return;
        }

        // Handle step results
        for (const [step, stepId] of Object.entries(stepIds)) {
          if (msg.id === stepId) {
            const raw = msg.result?.result?.value;
            let data: any = {};
            try { data = JSON.parse(raw); } catch {}

            if (step === "check_page") {
              if (data.alreadyLoggedIn) {
                done({ success: true, step: "already_logged_in" });
                return;
              }
              if (data.onLoginPage) {
                // Step 2: Type email
                runStep("type_email", `(function() {
                  return new Promise(function(resolve) {
                    var input = document.querySelector('input[name="email"], input[type="email"], input[id="email-field"]');
                    if (!input) { resolve(JSON.stringify({ success: false, error: 'Email input not found' })); return; }
                    input.focus();
                    input.value = '';
                    var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeSetter.call(input, '${escapeForJS(username)}');
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    setTimeout(function() { resolve(JSON.stringify({ success: true })); }, 500);
                  });
                })()`);
              } else {
                // Navigate to OnlyFans first
                runStep("navigate", `(function() {
                  window.location.href = 'https://onlyfans.com';
                  return JSON.stringify({ navigating: true });
                })()`);
                // After navigation, wait and retry
                setTimeout(() => {
                  runStep("wait_for_login_page", `(function() {
                    return new Promise(function(resolve) {
                      var attempts = 0;
                      var check = function() {
                        attempts++;
                        var emailInput = document.querySelector('input[name="email"], input[type="email"], input[id="email-field"]');
                        if (emailInput) { resolve(JSON.stringify({ found: true })); return; }
                        if (attempts > 15) { resolve(JSON.stringify({ found: false })); return; }
                        setTimeout(check, 1000);
                      };
                      setTimeout(check, 2000);
                    });
                  })()`);
                }, 3000);
              }
              return;
            }

            if (step === "wait_for_login_page") {
              if (data.found) {
                runStep("type_email", `(function() {
                  return new Promise(function(resolve) {
                    var input = document.querySelector('input[name="email"], input[type="email"], input[id="email-field"]');
                    if (!input) { resolve(JSON.stringify({ success: false, error: 'Email input not found after wait' })); return; }
                    input.focus();
                    var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeSetter.call(input, '${escapeForJS(username)}');
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    setTimeout(function() { resolve(JSON.stringify({ success: true })); }, 500);
                  });
                })()`);
              } else {
                done({ success: false, error: "Login form not found after navigation", step: "wait_for_login_page" });
              }
              return;
            }

            if (step === "type_email") {
              if (!data.success) { done({ success: false, error: data.error || "Failed to type email", step }); return; }
              // Step 3: Type password
              runStep("type_password", `(function() {
                return new Promise(function(resolve) {
                  var input = document.querySelector('input[name="password"], input[type="password"]');
                  if (!input) { resolve(JSON.stringify({ success: false, error: 'Password input not found' })); return; }
                  input.focus();
                  var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                  nativeSetter.call(input, '${escapeForJS(password)}');
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                  setTimeout(function() { resolve(JSON.stringify({ success: true })); }, 500);
                });
              })()`);
              return;
            }

            if (step === "type_password") {
              if (!data.success) { done({ success: false, error: data.error || "Failed to type password", step }); return; }
              // Step 4: Click login button
              runStep("click_login", `(function() {
                return new Promise(function(resolve) {
                  var btn = document.querySelector('button[type="submit"], button.g-btn.m-rounded.m-block, button[at-attr="login_btn"]');
                  if (!btn) {
                    var buttons = Array.from(document.querySelectorAll('button'));
                    btn = buttons.find(function(b) { return b.textContent.trim().toLowerCase() === 'log in' || b.textContent.trim().toLowerCase() === 'login'; });
                  }
                  if (!btn) { resolve(JSON.stringify({ success: false, error: 'Login button not found' })); return; }
                  btn.click();
                  setTimeout(function() { resolve(JSON.stringify({ success: true })); }, 2000);
                });
              })()`);
              return;
            }

            if (step === "click_login") {
              done({ success: data.success, error: data.error, step: "login_clicked" });
              return;
            }
          }
        }
      } catch (e) {
        console.error("AutoLogin CDP message error:", e);
      }
    };

    ws.onerror = (err) => {
      done({ success: false, error: "WebSocket error", step: currentStep });
    };
    ws.onclose = () => {
      done({ success: false, error: "WebSocket closed", step: currentStep });
    };
  });
}
