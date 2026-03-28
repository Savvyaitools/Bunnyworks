/**
 * Stagehand 2.0 REST API helpers for AI-driven browser automation.
 * Hybrid CDP+Stagehand: CDP-first for reliable DOM actions,
 * Stagehand for AI extraction when available.
 * 
 * KEY FIX: Stagehand requires session initialization via POST /sessions/start
 * before any act/extract/observe calls. The returned stagehand session ID
 * (different from Browserbase session ID) must be used for all subsequent calls.
 * 
 * Requires secrets: STAGEHAND_API_KEY, STAGEHAND_SERVER_URL
 * Also uses: BROWSERBASE_API_KEY via cdp-helpers, LOVABLE_API_KEY as model key
 */

import { executeCDPScript, navigateViaCDP } from "./cdp-helpers.ts";

// ========== Session Management ==========

/** Cache: browserbaseSessionId → stagehandSessionId */
const _sessionCache = new Map<string, string>();

/** Whether we've determined Stagehand is reachable this invocation */
let _stagehandAvailable: boolean | null = null;

/** Stagehand API mode resolved for this invocation */
let _stagehandMode: "legacy" | "runner" | null = null;

/** Resolved Stagehand API base URL for this invocation */
let _resolvedStagehandBaseUrl: string | null = null;

// ========== Configuration ==========

function getConfig() {
  const apiKey = Deno.env.get("STAGEHAND_API_KEY");
  const serverUrl = Deno.env.get("STAGEHAND_SERVER_URL");
  if (!apiKey || !serverUrl) {
    throw new Error("STAGEHAND_API_KEY and STAGEHAND_SERVER_URL must be configured");
  }
  return { apiKey, serverUrl: serverUrl.replace(/\/$/, "") };
}

function getStagehandBaseCandidates(serverUrl: string, preferred?: string | null): string[] {
  const normalized = serverUrl.replace(/\/$/, "");
  const candidates = [
    preferred || null,
    normalized,
    `${normalized}/v1`,
    `${normalized}/api/v1`,
    `${normalized}/api`,
  ].filter(Boolean) as string[];

  return Array.from(new Set(candidates.map((url) => url.replace(/\/$/, ""))));
}

function getStagehandHeaders(apiKey: string, modelApiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "x-bb-api-key": apiKey,
  };

  const projectId = Deno.env.get("BROWSERBASE_PROJECT_ID");
  if (projectId) headers["x-bb-project-id"] = projectId;
  if (modelApiKey) headers["x-model-api-key"] = modelApiKey;

  return headers;
}

function getRunnerHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  };
}

function getModelApiKey(): string {
  // Stagehand needs an LLM API key to power its AI vision.
  // Try STAGEHAND_API_KEY first (if it's an OpenAI key), then LOVABLE_API_KEY
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const stagehandKey = Deno.env.get("STAGEHAND_API_KEY");
  // If STAGEHAND_API_KEY looks like an OpenAI key, use it as model key too
  if (stagehandKey?.startsWith("sk-")) return stagehandKey;
  // Otherwise use Lovable AI key (works via gateway)
  return lovableKey || stagehandKey || "";
}

// ========== Stagehand Health Check ==========

export async function isStagehandAvailable(): Promise<boolean> {
  if (_stagehandAvailable !== null) return _stagehandAvailable;

  try {
    const { serverUrl, apiKey } = getConfig();
    const candidates = getStagehandBaseCandidates(serverUrl, _resolvedStagehandBaseUrl);

    for (const baseUrl of candidates) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${baseUrl}/health`, {
          headers: getStagehandHeaders(apiKey),
          signal: controller.signal,
        });
        if (res.ok) {
          // Detect runner mode (POST /run) first; fallback to legacy sessions API mode.
          try {
            const probeRes = await fetch(`${baseUrl}/run`, {
              method: "POST",
              headers: getRunnerHeaders(apiKey),
              body: JSON.stringify({}),
              signal: controller.signal,
            });
            const probeText = await probeRes.text();
            if (probeRes.status === 400 && probeText.includes("sessionId and instruction required")) {
              _stagehandMode = "runner";
            } else {
              _stagehandMode = "legacy";
            }
          } catch {
            _stagehandMode = "legacy";
          }

          _resolvedStagehandBaseUrl = baseUrl;
          _stagehandAvailable = true;
          console.log(`🔌 Stagehand available via ${baseUrl} (mode=${_stagehandMode})`);
          return true;
        }
      } catch {
        // continue to next candidate
      } finally {
        clearTimeout(timer);
      }
    }
  } catch {
    // ignore and return false below
  }

  _stagehandAvailable = false;
  console.log("🔌 Stagehand unavailable (health checks failed)");
  return false;
}

// ========== Session Initialization (THE FIX) ==========

/**
 * Initialize a Stagehand session for a given Browserbase session.
 * This MUST be called before any act/extract/observe calls.
 * Returns the Stagehand session ID (different from Browserbase session ID).
 */
export async function initStagehandSession(
  browserbaseSessionId: string
): Promise<{ success: boolean; stagehandSessionId?: string; error?: string }> {
  // Check cache first
  const cached = _sessionCache.get(browserbaseSessionId);
  if (cached) {
    console.log(`✅ Reusing cached Stagehand session: ${cached.slice(0, 8)}...`);
    return { success: true, stagehandSessionId: cached };
  }

  const { apiKey, serverUrl } = getConfig();
  const modelApiKey = getModelApiKey();

  if (_stagehandAvailable === null) {
    await isStagehandAvailable();
  }

  if (_stagehandMode === "runner") {
    _sessionCache.set(browserbaseSessionId, browserbaseSessionId);
    _stagehandAvailable = true;
    console.log(`✅ Stagehand runner mode active, using Browserbase session directly: ${browserbaseSessionId.slice(0, 8)}...`);
    return { success: true, stagehandSessionId: browserbaseSessionId };
  }

  console.log(`🚀 Initializing Stagehand session for BB session ${browserbaseSessionId.slice(0, 8)}...`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const baseCandidates = getStagehandBaseCandidates(serverUrl, _resolvedStagehandBaseUrl);
    let lastErr = "Unknown session start error";

    for (const baseUrl of baseCandidates) {
      const startUrl = `${baseUrl}/sessions/start`;
      try {
        const res = await fetch(startUrl, {
          method: "POST",
          headers: getStagehandHeaders(apiKey, modelApiKey),
          body: JSON.stringify({
            browserbaseSessionID: browserbaseSessionId,
            browserbaseSessionId: browserbaseSessionId,
            modelApiKey,
          }),
          signal: controller.signal,
        });

        const text = await res.text();

        if (!res.ok) {
          lastErr = `Session start failed (${res.status}) via ${baseUrl}: ${text.slice(0, 300)}`;
          console.warn(`⚠️ Stagehand start miss @ ${baseUrl}: ${res.status}`);
          continue;
        }

        let data: any;
        try { data = JSON.parse(text); } catch { data = {}; }

        const stagehandSessionId = data.sessionId || data.id || data.session_id || data?.data?.sessionId;
        if (!stagehandSessionId) {
          lastErr = `No sessionId returned from ${baseUrl}`;
          continue;
        }

        _sessionCache.set(browserbaseSessionId, stagehandSessionId);
        _stagehandAvailable = true;
        _resolvedStagehandBaseUrl = baseUrl;
        console.log(`✅ Stagehand session initialized via ${baseUrl}: ${stagehandSessionId.slice(0, 8)}...`);
        return { success: true, stagehandSessionId };
      } catch (err: unknown) {
        lastErr = err instanceof Error ? err.message : String(err);
      }
    }

    _stagehandAvailable = false;
    return { success: false, error: lastErr };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes("abort");
    console.error(`❌ Stagehand session init ${isTimeout ? "timed out" : "failed"}: ${msg}`);
    _stagehandAvailable = false;
    return { success: false, error: isTimeout ? "Session start timed out" : msg };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * End a Stagehand session. Call when done with automation.
 */
export async function endStagehandSession(browserbaseSessionId: string): Promise<void> {
  const stagehandSessionId = _sessionCache.get(browserbaseSessionId);
  if (!stagehandSessionId) return;

  try {
    const { apiKey, serverUrl } = getConfig();
    const baseCandidates = getStagehandBaseCandidates(serverUrl, _resolvedStagehandBaseUrl);

    for (const baseUrl of baseCandidates) {
      const endRes = await fetch(`${baseUrl}/sessions/${stagehandSessionId}/end`, {
        method: "POST",
        headers: getStagehandHeaders(apiKey),
        body: JSON.stringify({}),
      });

      if (endRes.ok) {
        _resolvedStagehandBaseUrl = baseUrl;
        console.log(`🔚 Stagehand session ended via ${baseUrl}: ${stagehandSessionId.slice(0, 8)}...`);
        break;
      }
    }
  } catch (e) {
    console.warn("Failed to end Stagehand session:", e);
  } finally {
    _sessionCache.delete(browserbaseSessionId);
  }
}

/**
 * Get or create a Stagehand session for the given Browserbase session.
 * Returns null if Stagehand is unavailable.
 */
async function getStagehandSessionId(browserbaseSessionId: string): Promise<string | null> {
  const cached = _sessionCache.get(browserbaseSessionId);
  if (cached) return cached;

  const init = await initStagehandSession(browserbaseSessionId);
  return init.success ? init.stagehandSessionId! : null;
}

// ========== Types ==========

interface StagehandResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ObserveElement {
  selector: string;
  description: string;
  backendNodeId?: number;
  method?: string;
  arguments?: string[];
}

interface ExtractResult<T = Record<string, unknown>> {
  data: T;
}

// ========== Base Request (FIXED: uses proper session URLs) ==========

async function stagehandRequest<T = unknown>(
  stagehandSessionId: string,
  primitive: "act" | "observe" | "extract",
  body: Record<string, unknown>,
  timeoutMs = 30000
): Promise<StagehandResponse<T>> {
  const { apiKey, serverUrl } = getConfig();
  const baseCandidates = getStagehandBaseCandidates(serverUrl, _resolvedStagehandBaseUrl);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Stagehand runner mode: POST /run with instruction + sessionId.
    if (_stagehandMode === "runner") {
      const instruction = String(body.instruction ?? body.action ?? "").trim();
      if (!instruction) {
        return { success: false, error: `Missing instruction for ${primitive}` };
      }

      let lastErr = "Unknown Stagehand runner error";
      for (const baseUrl of baseCandidates) {
        try {
          const runnerBody: Record<string, unknown> = {
            sessionId: stagehandSessionId,
            browserbaseSessionID: stagehandSessionId,
            instruction,
            primitive,
          };

          if (primitive === "extract" && body.schema) runnerBody.schema = body.schema;
          if (primitive === "act" && body.variables) runnerBody.variables = body.variables;

          const res = await fetch(`${baseUrl}/run`, {
            method: "POST",
            headers: getRunnerHeaders(apiKey),
            body: JSON.stringify(runnerBody),
            signal: controller.signal,
          });

          const text = await res.text();
          if (!res.ok) {
            lastErr = `Stagehand runner ${primitive} error (${res.status}) via ${baseUrl}: ${text.slice(0, 220)}`;
            continue;
          }

          _resolvedStagehandBaseUrl = baseUrl;
          try {
            const data = JSON.parse(text) as T;
            return { success: true, data };
          } catch {
            return { success: true, data: text as unknown as T };
          }
        } catch (err: unknown) {
          lastErr = err instanceof Error ? err.message : String(err);
        }
      }

      return { success: false, error: lastErr };
    }

    let lastErr = "Unknown Stagehand request error";

    for (const baseUrl of baseCandidates) {
      const url = `${baseUrl}/sessions/${stagehandSessionId}/${primitive}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: getStagehandHeaders(apiKey),
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        const text = await res.text();

        if (!res.ok) {
          lastErr = `Stagehand ${primitive} error (${res.status}) via ${baseUrl}: ${text.slice(0, 200)}`;
          console.warn(`⚠️ Stagehand ${primitive} miss @ ${baseUrl}: ${res.status}`);
          continue;
        }

        _resolvedStagehandBaseUrl = baseUrl;

        try {
          const data = JSON.parse(text) as T;
          return { success: true, data };
        } catch {
          return { success: true, data: text as unknown as T };
        }
      } catch (err: unknown) {
        lastErr = err instanceof Error ? err.message : String(err);
      }
    }

    return { success: false, error: lastErr };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error = message.includes("abort")
      ? `Stagehand ${primitive} timed out after ${timeoutMs}ms`
      : message;
    console.error(`Stagehand ${primitive} error: ${error}`);
    return { success: false, error };
  } finally {
    clearTimeout(timer);
  }
}

// ========== CDP-First Action Helpers ==========

/**
 * Click a conversation row by fan name using CDP.
 * CRITICAL: Clicks the row body/preview — NOT the <a> profile link.
 */
export async function clickConversationViaCDP(
  apiKey: string,
  sessionId: string,
  fanName: string,
  conversationIndex?: number
): Promise<{ success: boolean; error?: string }> {
  console.log(`🖱️ CDP: Clicking conversation for "${fanName}"...`);
  const escapedName = fanName
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, " ")
    .replace(/\t/g, " ");
  const indexValue = Number.isFinite(conversationIndex as number) ? Number(conversationIndex) : -1;

  const clickScript = `(function() {
    var result = { success: false, clickedName: '', reason: '' };
    var querySets = [
      '.b-chats__item, .b-chat-list__item, [class*="chat-list"] li, .m-chats-list-item',
      '[class*="chats"] [class*="item"], .b-users-list__item',
      '.b-chat-list .b-list-item, [data-testid*="chat"] [data-testid*="item"]'
    ];

    var chatItems = [];
    for (var qi = 0; qi < querySets.length && !chatItems.length; qi++) {
      chatItems = Array.from(document.querySelectorAll(querySets[qi]));
    }

    if (!chatItems.length) {
      result.reason = 'No chat list items found on page';
      return JSON.stringify(result);
    }

    var normalize = function(v) {
      return (v || '').toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9@._\- ]/g, '').trim();
    };

    var wantedRaw = '${escapedName}';
    var wanted = normalize(wantedRaw);
    var wantedHandleMatch = wantedRaw.match(/@[\w._-]+/);
    var wantedHandle = wantedHandleMatch ? wantedHandleMatch[0].toLowerCase() : '';
    var wantedNameOnly = normalize(wantedRaw.replace(/@[\w._-]+/g, ''));

    var byIndex = ${indexValue};
    var target = null;

    if (byIndex >= 0 && byIndex < chatItems.length) {
      target = chatItems[byIndex];
      var idxNameEl = target.querySelector('.g-user-name, .b-username, [class*="user-name"], [class*="username"]');
      result.clickedName = idxNameEl ? idxNameEl.innerText.trim() : ('index_' + byIndex);
    }

    if (!target) {
      for (var i = 0; i < chatItems.length; i++) {
        var row = chatItems[i];
        var rowText = normalize(row.innerText || row.textContent || '');
        var nameEl = row.querySelector('.g-user-name, .b-username, [class*="user-name"], [class*="username"]');
        var nameText = normalize(nameEl ? nameEl.innerText : '');

        var handleMatch = false;
        if (wantedHandle) {
          var rawText = ((row.innerText || row.textContent || '') + ' ' + (nameEl ? nameEl.innerText : '')).toLowerCase();
          handleMatch = rawText.includes(wantedHandle);
        }

        var exactName = wanted && (nameText === wanted || rowText === wanted);
        var containsName = wantedNameOnly && (rowText.includes(wantedNameOnly) || nameText.includes(wantedNameOnly));

        if (handleMatch || exactName || containsName) {
          target = row;
          result.clickedName = (nameEl ? nameEl.innerText.trim() : rowText.slice(0, 80));
          break;
        }
      }
    }

    if (!target) {
      result.reason = 'Conversation not found for: ${escapedName}';
      return JSON.stringify(result);
    }

    var clickCandidates = [
      '.b-chats__item-text',
      '.b-chats__item__text',
      '.b-chats__item-content',
      '.b-chats__item-info',
      '[class*="preview"]',
      '[class*="last-message"]',
      '[class*="message-preview"]',
      '[class*="item__text"]',
      '[class*="body"]'
    ];

    var clickTarget = null;
    for (var ci = 0; ci < clickCandidates.length && !clickTarget; ci++) {
      var el = target.querySelector(clickCandidates[ci]);
      if (el && !el.closest('a')) clickTarget = el;
    }

    if (!clickTarget) {
      var descendants = Array.from(target.querySelectorAll('*'));
      clickTarget = descendants.find(function(el) {
        if (el.closest('a')) return false;
        var rect = el.getBoundingClientRect();
        var visible = rect.width > 8 && rect.height > 8;
        if (!visible) return false;
        var text = (el.innerText || el.textContent || '').trim();
        return text.length > 0;
      }) || target;
    }

    var dispatchClick = function(el) {
      try {
        var rect = el.getBoundingClientRect();
        var x = rect.left + Math.max(8, rect.width * 0.72);
        var y = rect.top + Math.min(Math.max(8, rect.height * 0.5), rect.height - 8);
        var pointed = document.elementFromPoint(x, y);
        var finalEl = pointed && pointed.closest ? (pointed.closest('a') ? el : pointed) : el;

        ['mousemove', 'mouseover', 'mousedown', 'mouseup', 'click'].forEach(function(type) {
          finalEl.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y }));
        });
        if (typeof finalEl.click === 'function') finalEl.click();
      } catch (_) {
        try { el.click(); } catch (_) {}
      }
    };

    dispatchClick(clickTarget);
    result.success = true;
    return JSON.stringify(result);
  })()`;

  const res = await executeCDPScript(apiKey, sessionId, clickScript, 12000);
  if (!res.success || !res.data?.success) {
    return { success: false, error: res.data?.reason || res.error || "CDP click failed" };
  }
  return { success: true };
}

/**
 * Inject chat reply text and send via CDP.
 */
export async function injectChatReplyViaCDP(
  apiKey: string,
  sessionId: string,
  replyText: string
): Promise<{ success: boolean; autoSent: boolean; reason?: string }> {
  console.log("💬 CDP: Injecting reply (" + replyText.length + " chars)...");
  const escapedReply = replyText.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");

  const injectScript = "(function() {" +
    "var text = '" + escapedReply + "';" +
    "var result = { success: false, autoSent: false, reason: '', inputMode: '', sendStrategy: '' };" +
    "var textareaSelectors = ['textarea[id=\"new_post_text_input\"]','.b-chat__input textarea','.b-chat-message-input textarea','.b-make-post__wrapper textarea','.b-make-post__textarea textarea','[class*=\"chat-input\"] textarea'];" +
    "var editableSelectors = ['.b-chat__input [contenteditable=\"true\"]','[contenteditable=\"true\"][class*=\"chat\"]','[data-testid*=\"chat\"] [contenteditable=\"true\"]','[role=\"textbox\"][contenteditable=\"true\"]','.ProseMirror[contenteditable=\"true\"]'];" +
    "var pickFirst = function(selectors) { for (var i = 0; i < selectors.length; i++) { var el = document.querySelector(selectors[i]); if (el) return el; } return null; };" +
    "var input = pickFirst(textareaSelectors) || pickFirst(editableSelectors);" +
    "if (!input) { result.reason = 'Chat input not found'; return JSON.stringify(result); }" +
    "var dispatchInputEvents = function(el) { try { el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text })); } catch (_) { el.dispatchEvent(new Event('input', { bubbles: true })); } el.dispatchEvent(new Event('change', { bubbles: true })); };" +
    "if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {" +
    "  var proto = input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;" +
    "  var nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');" +
    "  if (nativeSetter && nativeSetter.set) nativeSetter.set.call(input, text); else input.value = text;" +
    "  result.inputMode = 'text_input';" +
    "} else {" +
    "  input.focus();" +
    "  if (typeof input.textContent === 'string') input.textContent = text;" +
    "  if (typeof input.innerText === 'string') input.innerText = text;" +
    "  result.inputMode = 'contenteditable';" +
    "}" +
    "dispatchInputEvents(input); input.focus();" +
    "var isVisible = function(el) { if (!el) return false; var style = window.getComputedStyle(el); if (style.display === 'none' || style.visibility === 'hidden') return false; var rect = el.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; };" +
    "var clickButton = function(btn) { try { btn.removeAttribute('disabled'); } catch (_) {} try { btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window })); } catch (_) {} try { btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window })); } catch (_) {} try { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); } catch (_) {} try { btn.click(); } catch (_) {} };" +
    "var findSendButton = function() {" +
    "  var selectors = ['.b-chat__btn-submit','button.b-btn-send-message','button[data-testid*=\"send\"]','button[aria-label*=\"Send\"]','button[aria-label*=\"send\"]','.b-chat-message-input button[type=\"submit\"]','.b-chat__input button[type=\"submit\"]','form button[type=\"submit\"]','button[class*=\"send\"]','button[class*=\"submit\"]','[aria-label*=\"paper plane\"]','[title*=\"Send\"]'];" +
    "  for (var i = 0; i < selectors.length; i++) { var nodes = document.querySelectorAll(selectors[i]); for (var j = 0; j < nodes.length; j++) { if (isVisible(nodes[j])) return nodes[j]; } } return null;" +
    "};" +
    "var sendBtn = findSendButton();" +
    "if (sendBtn) { clickButton(sendBtn); result.success = true; result.autoSent = true; result.sendStrategy = 'button_click'; return JSON.stringify(result); }" +
    "var form = input.closest ? input.closest('form') : null;" +
    "if (form && typeof form.requestSubmit === 'function') { try { form.requestSubmit(); result.success = true; result.autoSent = true; result.sendStrategy = 'form_submit'; return JSON.stringify(result); } catch (_) {} }" +
    "try { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true })); input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true })); } catch (_) {}" +
    "result.success = true; result.autoSent = false; result.sendStrategy = 'enter_fallback'; result.reason = 'Send button not found, only text injection confirmed';" +
    "return JSON.stringify(result);" +
    "})()";

  const res = await executeCDPScript(apiKey, sessionId, injectScript, 12000);
  if (!res.success) {
    return { success: false, autoSent: false, reason: res.error || "CDP injection failed" };
  }
  return {
    success: Boolean(res.data?.success),
    autoSent: Boolean(res.data?.autoSent),
    reason: res.data?.reason || undefined,
  };
}

// ========== Humanized Delay Helpers ==========

function humanDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.floor(Math.random() * (maxMs - minMs));
  console.log(`⏳ Human pause: ${(delay / 1000).toFixed(1)}s`);
  return new Promise(r => setTimeout(r, delay));
}

function microPause(): Promise<void> { return humanDelay(250, 700); }
function shortPause(): Promise<void> { return humanDelay(700, 1600); }
function mediumPause(): Promise<void> { return humanDelay(1600, 3200); }
function longPause(): Promise<void> { return humanDelay(2800, 5200); }
function extraLongPause(): Promise<void> { return humanDelay(6000, 11000); }

function readingPause(text: string): Promise<void> {
  const wordCount = text.split(/\s+/).length;
  const baseMs = Math.max(900, wordCount * 140);
  const jitter = Math.floor(Math.random() * 1200);
  console.log(`📖 Reading ${wordCount} words (~${((baseMs + jitter) / 1000).toFixed(1)}s)`);
  return new Promise(r => setTimeout(r, baseMs + jitter));
}

// ========== Core API Wrappers (FIXED: proper session routing) ==========

/**
 * Observe the current page. Requires an initialized Stagehand session.
 * browserbaseSessionId is mapped to the internal Stagehand session automatically.
 */
export async function stagehandObserve(
  browserbaseSessionId: string,
  instruction: string
): Promise<StagehandResponse<ObserveElement[]>> {
  const ssid = await getStagehandSessionId(browserbaseSessionId);
  if (!ssid) return { success: false, error: "Stagehand session not available" };

  console.log(`👀 Observe: "${instruction}"`);
  await microPause();
  const result = await stagehandRequest<ObserveElement[] | { data?: ObserveElement[]; actions?: ObserveElement[]; elements?: ObserveElement[] }>(
    ssid, "observe", { instruction }, 25000
  );

  if (!result.success) return result as StagehandResponse<ObserveElement[]>;

  const payload = result.data;
  const normalized = Array.isArray(payload)
    ? payload
    : payload?.data ?? payload?.actions ?? payload?.elements ?? [];

  return { success: true, data: normalized };
}

/**
 * Extract structured data from the current page using AI.
 */
export async function stagehandExtract<T = Record<string, unknown>>(
  browserbaseSessionId: string,
  instruction: string,
  schema?: Record<string, unknown>
): Promise<StagehandResponse<ExtractResult<T>>> {
  const ssid = await getStagehandSessionId(browserbaseSessionId);
  if (!ssid) return { success: false, error: "Stagehand session not available" };

  console.log(`📊 Extract: "${instruction}"`);
  await microPause();
  const result = await stagehandRequest<ExtractResult<T> | T>(
    ssid, "extract", { instruction, ...(schema ? { schema } : {}) }, 30000
  );

  if (!result.success) return result as StagehandResponse<ExtractResult<T>>;

  const payload = result.data as ExtractResult<T> | T;
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return { success: true, data: payload as ExtractResult<T> };
  }
  return { success: true, data: { data: payload as T } };
}

/**
 * Execute an action via natural language.
 */
export async function stagehandAct(
  browserbaseSessionId: string,
  instruction: string,
  variables?: Record<string, string>
): Promise<StagehandResponse> {
  const ssid = await getStagehandSessionId(browserbaseSessionId);
  if (!ssid) return { success: false, error: "Stagehand session not available" };

  await shortPause();
  console.log(`🖱️ Act: "${instruction}"`);
  const result = await stagehandRequest(
    ssid, "act",
    { action: instruction, ...(variables ? { variables } : {}) },
    30000
  );

  if (result.success && result.data && typeof result.data === "object") {
    const payload = result.data as Record<string, unknown>;
    if (payload.success === false) {
      return {
        success: false,
        error: typeof payload.error === "string" ? payload.error : "Stagehand action failed",
      };
    }
  }

  await shortPause();
  return result;
}

/**
 * Navigate to a URL. Tries UI-first for chats, falls back to act-based nav.
 */
export async function stagehandNavigate(
  browserbaseSessionId: string,
  url: string
): Promise<StagehandResponse> {
  console.log(`🧭 Navigate to: ${url}`);

  // For chats, try clicking the nav icon first
  if (url.includes("/my/chats") || url.includes("/chats")) {
    console.log("🧭 Trying UI navigation — looking for Messages/Chat icon...");
    await microPause();

    const navObserve = await stagehandObserve(
      browserbaseSessionId,
      "Find the Messages, Chat, or Inbox icon/link in the navigation bar or sidebar menu"
    );

    if (navObserve.success && navObserve.data?.length) {
      console.log(`🧭 Found ${navObserve.data.length} nav elements, clicking...`);
      const clickResult = await stagehandAct(
        browserbaseSessionId,
        "Click the Messages or Chat icon/link in the navigation to go to the chats/inbox page"
      );
      if (clickResult.success) {
        await mediumPause();
        return clickResult;
      }
      console.warn("🧭 UI nav click failed, falling back to URL navigation");
    }
  }

  // Fallback: use act to navigate
  const result = await stagehandAct(
    browserbaseSessionId,
    `Navigate to the URL: ${url}`
  );
  await mediumPause();
  return result;
}

/**
 * Scroll the page like a human scanning content.
 */
export async function stagehandScroll(
  browserbaseSessionId: string,
  direction: "down" | "up" = "down",
  context?: string
): Promise<StagehandResponse> {
  const desc = context || "the page";
  console.log(`📜 Scrolling ${direction} through ${desc}...`);
  await microPause();
  return stagehandAct(
    browserbaseSessionId,
    `Scroll ${direction} slowly through ${desc} to see more content`
  );
}

/**
 * Type text with human-like rhythm.
 */
export async function stagehandHumanType(
  browserbaseSessionId: string,
  text: string,
  fieldDescription: string
): Promise<StagehandResponse> {
  console.log(`⌨️ Human typing ${text.length} chars into "${fieldDescription}"`);

  await stagehandAct(browserbaseSessionId, `Click on ${fieldDescription} to focus it`);
  await microPause();

  if (text.length < 30) {
    await humanDelay(120, 400);
    const result = await stagehandAct(
      browserbaseSessionId,
      `Type "${text}" into the currently focused ${fieldDescription}`
    );
    await shortPause();
    return result;
  }

  // Chunk longer texts
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    const chunkSize = Math.min(20 + Math.floor(Math.random() * 35), remaining.length);
    let end = chunkSize;
    if (end < remaining.length) {
      const spaceIdx = remaining.lastIndexOf(' ', end);
      if (spaceIdx > end * 0.5) end = spaceIdx + 1;
    }
    chunks.push(remaining.slice(0, end));
    remaining = remaining.slice(end);
  }

  console.log(`⌨️ Typing in ${chunks.length} chunks...`);
  let lastResult: StagehandResponse = { success: true };

  for (let i = 0; i < chunks.length; i++) {
    const typingDelay = chunks[i].length * (22 + Math.floor(Math.random() * 28));
    await new Promise(r => setTimeout(r, typingDelay));

    const ssid = await getStagehandSessionId(browserbaseSessionId);
    if (!ssid) return { success: false, error: "Stagehand session lost" };

    lastResult = await stagehandRequest(ssid, "act", {
      action: `Type "${chunks[i]}" continuing from where the cursor is in the input field (append, do not clear)`,
    }, 15000);

    if (!lastResult.success) {
      console.error(`⌨️ Typing chunk ${i + 1}/${chunks.length} failed`);
      return lastResult;
    }

    if (i < chunks.length - 1 && Math.random() < 0.3) {
      await humanDelay(300, 1200);
    }
  }

  await shortPause();
  return lastResult;
}

// ========== High-Level: Auto-Login ==========

export interface StagehandLoginResult {
  success: boolean;
  method: "stagehand";
  step: string;
  error?: string;
  isLoggedIn?: boolean;
}

export async function autoLoginViaStagehand(
  browserbaseSessionId: string,
  username: string,
  password: string
): Promise<StagehandLoginResult> {
  try {
    // Initialize Stagehand session first
    const init = await initStagehandSession(browserbaseSessionId);
    if (!init.success) {
      return { success: false, method: "stagehand", step: "init", error: init.error };
    }

    // Navigate to OnlyFans
    const nav = await stagehandNavigate(browserbaseSessionId, "https://onlyfans.com");
    if (!nav.success) {
      return { success: false, method: "stagehand", step: "navigate", error: nav.error };
    }

    // Observe page
    console.log("🔍 Observing page layout...");
    await stagehandObserve(browserbaseSessionId, "What is visible on this page? Is it a login form, a dashboard, or something else?");
    await mediumPause();

    // Check if already logged in
    const pageState = await stagehandExtract<{ isLoggedIn: boolean; hasLoginForm: boolean }>(
      browserbaseSessionId,
      "Check if the user is logged into OnlyFans. Look for dashboard elements versus login form fields.",
      {
        type: "object",
        properties: {
          isLoggedIn: { type: "boolean", description: "true if user appears logged in" },
          hasLoginForm: { type: "boolean", description: "true if a login form is visible" },
        },
        required: ["isLoggedIn", "hasLoginForm"],
      }
    );

    if (pageState.success && pageState.data?.data?.isLoggedIn) {
      console.log("✅ Already logged in");
      return { success: true, method: "stagehand", step: "already_logged_in", isLoggedIn: true };
    }

    // Type credentials
    await stagehandHumanType(browserbaseSessionId, username, "the email or username input field on the login form");
    await mediumPause();
    await stagehandHumanType(browserbaseSessionId, password, "the password input field on the login form");
    await mediumPause();

    // Click login
    await stagehandObserve(browserbaseSessionId, "Find the Log In or Sign In submit button on the form");
    await shortPause();
    const clickLogin = await stagehandAct(browserbaseSessionId, "Click the Log In or Sign In button to submit the login form");
    if (!clickLogin.success) {
      return { success: false, method: "stagehand", step: "click_login", error: clickLogin.error };
    }

    await longPause();

    // Verify login
    const verifyLogin = await stagehandExtract<{ isLoggedIn: boolean }>(
      browserbaseSessionId,
      "Check if the user is now logged into OnlyFans. Look for dashboard elements.",
      {
        type: "object",
        properties: {
          isLoggedIn: { type: "boolean", description: "true if login was successful" },
        },
        required: ["isLoggedIn"],
      }
    );

    const loggedIn = verifyLogin.success && verifyLogin.data?.data?.isLoggedIn === true;
    return { success: true, method: "stagehand", step: "login_complete", isLoggedIn: loggedIn };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stagehand autoLogin error:", message);
    return { success: false, method: "stagehand", step: "exception", error: message };
  }
}

// ========== MARILYN: Chat Workflow Helpers ==========

interface ChatConversation {
  index: number;
  fanName: string;
  lastMessage: string;
  isUnread: boolean;
  unreadCount: number;
}

interface ChatMessage {
  role: "creator" | "fan";
  text: string;
}

interface ChatContext {
  fanName: string;
  messages: ChatMessage[];
  lastFanMessage: string;
}

/**
 * Navigate to chats page and extract conversations.
 * Requires Stagehand session to be initialized first.
 */
export async function scrapeChatListViaStagehand(
  browserbaseSessionId: string
): Promise<StagehandResponse<ExtractResult<{ conversations: ChatConversation[] }>>> {
  // Ensure session is initialized
  const init = await initStagehandSession(browserbaseSessionId);
  if (!init.success) return { success: false, error: `Session init failed: ${init.error}` };

  // Navigate
  const nav = await stagehandNavigate(browserbaseSessionId, "https://onlyfans.com/my/chats");
  if (!nav.success) return { success: false, error: nav.error };

  // Observe layout
  console.log("👀 Scanning chat page layout...");
  const pageLayout = await stagehandObserve(
    browserbaseSessionId,
    "What elements are visible on this chat/messages page? Look for a list of conversations, unread badges, fan names, and message previews."
  );
  console.log(`👀 Found ${pageLayout.data?.length || 0} interactive elements on chat page`);
  await mediumPause();

  // Scroll to load more
  await stagehandScroll(browserbaseSessionId, "down", "the chat conversation list");
  await shortPause();
  await stagehandScroll(browserbaseSessionId, "up", "back to the top of the chat list");
  await mediumPause();

  // Extract conversations
  return stagehandExtract<{ conversations: ChatConversation[] }>(
    browserbaseSessionId,
    "Extract the list of chat conversations visible on this page. For each conversation, get the fan's display name, their last message preview, whether it has an unread indicator/badge, and the unread count. Return up to 20 conversations.",
    {
      type: "object",
      properties: {
        conversations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              index: { type: "number", description: "Position in the list, starting at 0" },
              fanName: { type: "string", description: "The fan's display name" },
              lastMessage: { type: "string", description: "Preview of the last message" },
              isUnread: { type: "boolean", description: "Whether this conversation has unread messages" },
              unreadCount: { type: "number", description: "Number of unread messages, 0 if none" },
            },
            required: ["index", "fanName", "lastMessage", "isUnread", "unreadCount"],
          },
        },
      },
      required: ["conversations"],
    }
  );
}

/**
 * Click into a conversation using Stagehand observe+act.
 */
export async function clickConversationViaStagehand(
  browserbaseSessionId: string,
  fanName: string
): Promise<StagehandResponse> {
  console.log(`👀 Looking for "${fanName}" in chat list...`);
  const findFan = await stagehandObserve(
    browserbaseSessionId,
    `Find the chat conversation row for "${fanName}" in the chat list. Look for their name and message preview area.`
  );

  if (!findFan.success || !findFan.data?.length) {
    console.log(`📜 "${fanName}" not visible, scrolling...`);
    await stagehandScroll(browserbaseSessionId, "down", "the chat list");
    await shortPause();
  }

  await microPause();
  // CRITICAL: Specific instruction to avoid profile link
  return stagehandAct(
    browserbaseSessionId,
    `Click on the message preview text or the right side of the conversation row for "${fanName}" in the chat list. Do NOT click on their profile picture or their username/display name link — those open the profile page. Click on the message preview snippet or the timestamp area to open the conversation.`
  );
}

/**
 * Read the current open chat conversation.
 */
export async function readChatContextViaStagehand(
  browserbaseSessionId: string
): Promise<StagehandResponse<ExtractResult<ChatContext>>> {
  console.log("👀 Observing open conversation layout...");
  await stagehandObserve(
    browserbaseSessionId,
    "What is visible in this open chat conversation? Look for the fan's name, message bubbles, and the input field."
  );
  await shortPause();

  console.log("📜 Scrolling through message history...");
  await stagehandScroll(browserbaseSessionId, "up", "the message history");
  await mediumPause();
  await stagehandScroll(browserbaseSessionId, "down", "back to the latest messages");
  await shortPause();

  const result = await stagehandExtract<ChatContext>(
    browserbaseSessionId,
    "Extract the chat conversation. Get the fan's name from the header, the last 10 messages, and identify who sent each (creator or fan). Also get the most recent fan message.",
    {
      type: "object",
      properties: {
        fanName: { type: "string", description: "The fan's display name from the chat header" },
        messages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string", enum: ["creator", "fan"], description: "Who sent this message" },
              text: { type: "string", description: "The message text content" },
            },
            required: ["role", "text"],
          },
        },
        lastFanMessage: { type: "string", description: "The most recent message sent by the fan" },
      },
      required: ["fanName", "messages", "lastFanMessage"],
    }
  );

  if (result.success && result.data?.data?.lastFanMessage) {
    await readingPause(result.data.data.lastFanMessage);
  }

  return result;
}

/**
 * Type a reply and send it via Stagehand.
 */
export async function injectChatReplyViaStagehand(
  browserbaseSessionId: string,
  replyText: string
): Promise<StagehandResponse<{ autoSent: boolean }>> {
  console.log(`💬 Injecting reply (${replyText.length} chars)...`);

  const inputObserve = await stagehandObserve(
    browserbaseSessionId,
    "Find the message input field at the bottom of the chat and the Send button."
  );
  console.log(`👀 Found ${inputObserve.data?.length || 0} input-related elements`);
  await shortPause();

  const typeResult = await stagehandHumanType(
    browserbaseSessionId, replyText,
    "the message input field or textarea at the bottom of the chat"
  );
  if (!typeResult.success) {
    console.error("❌ Failed to type reply:", typeResult.error);
    return { success: false, error: `Could not type reply: ${typeResult.error}` };
  }

  console.log("📖 Re-reading typed message before sending...");
  await readingPause(replyText);

  // Verify text in input
  const verifyText = await stagehandExtract<{ hasText: boolean; inputText: string }>(
    browserbaseSessionId,
    "Check the message input field. Is there text typed into it?",
    {
      type: "object",
      properties: {
        hasText: { type: "boolean", description: "true if there is text in the input" },
        inputText: { type: "string", description: "Text currently in the input field" },
      },
      required: ["hasText", "inputText"],
    }
  );

  if (verifyText.success && !verifyText.data?.data?.hasText) {
    console.warn("⚠️ Text not detected, retrying type...");
    await stagehandAct(browserbaseSessionId, "Click on the message input field to focus it");
    await microPause();
    await stagehandAct(browserbaseSessionId, `Type "${replyText}" into the message input field`);
    await shortPause();
  }

  // Send
  console.log("🔍 Looking for Send button...");
  await stagehandObserve(browserbaseSessionId, "Find the Send button — paper plane icon, arrow icon, or 'Send' label");
  await microPause();

  let sendResult = await stagehandAct(
    browserbaseSessionId,
    "Click the Send button (paper plane icon or 'Send' label) to submit the typed chat message"
  );

  if (!sendResult.success) {
    console.warn("⚠️ Send button click failed, trying Enter key...");
    sendResult = await stagehandAct(browserbaseSessionId, "Press the Enter key to send the message");
    if (!sendResult.success) {
      sendResult = await stagehandAct(browserbaseSessionId, "Find the chat composer send icon and click it");
    }
    if (!sendResult.success) {
      return { success: false, error: `Could not send: ${sendResult.error}` };
    }
  }

  // Verify send
  let wasSent = false;
  for (let attempt = 0; attempt < 2 && !wasSent; attempt++) {
    await shortPause();
    const verifySent = await stagehandExtract<{ inputEmpty: boolean; messageSent: boolean }>(
      browserbaseSessionId,
      "Check if the drafted message was sent. The input should be empty and the message should appear as the newest outgoing message.",
      {
        type: "object",
        properties: {
          inputEmpty: { type: "boolean", description: "true if input is now empty" },
          messageSent: { type: "boolean", description: "true if message appears as sent in chat" },
        },
        required: ["inputEmpty", "messageSent"],
      }
    );
    wasSent = Boolean(verifySent.success && (verifySent.data?.data?.messageSent || verifySent.data?.data?.inputEmpty));
    if (!wasSent && attempt === 0) {
      await stagehandAct(browserbaseSessionId, "Click Send once more if the drafted message is still in the input field");
    }
  }
  console.log(`💬 Message send result: ${wasSent ? '✅ sent' : '❓ uncertain'}`);

  await shortPause();
  return { success: true, data: { autoSent: wasSent === true } };
}
