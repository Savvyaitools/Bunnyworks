/**
 * Stagehand 2.0 REST API helpers for AI-driven browser automation.
 * Replaces fragile CDP/CSS selector logic with natural language instructions.
 * 
 * Requires secrets: STAGEHAND_API_KEY, STAGEHAND_SERVER_URL
 */

// ========== Humanized Delay Helpers ==========

/** Random delay between min and max ms to mimic human behavior */
function humanDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.floor(Math.random() * (maxMs - minMs));
  console.log(`Stagehand: humanized wait ${delay}ms`);
  return new Promise(r => setTimeout(r, delay));
}

/** Short pause (like reading / thinking) */
function shortPause(): Promise<void> { return humanDelay(800, 2000); }

/** Medium pause (like a person processing a page) */
function mediumPause(): Promise<void> { return humanDelay(2000, 4500); }

/** Long pause (like page load + reading) */
function longPause(): Promise<void> { return humanDelay(4000, 7000); }

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

// ========== Configuration ==========

function getConfig() {
  const apiKey = Deno.env.get("STAGEHAND_API_KEY");
  const serverUrl = Deno.env.get("STAGEHAND_SERVER_URL");
  if (!apiKey || !serverUrl) {
    throw new Error("STAGEHAND_API_KEY and STAGEHAND_SERVER_URL must be configured");
  }
  return { apiKey, serverUrl: serverUrl.replace(/\/$/, "") };
}

// ========== Base Request ==========

async function stagehandRequest<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>,
  timeoutMs = 30000
): Promise<StagehandResponse<T>> {
  const { apiKey, serverUrl } = getConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${serverUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`Stagehand ${endpoint} failed (${res.status}):`, text);
      return { success: false, error: `Stagehand API error (${res.status}): ${text}` };
    }

    try {
      const data = JSON.parse(text) as T;
      return { success: true, data };
    } catch {
      return { success: true, data: text as unknown as T };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("abort")) {
      return { success: false, error: `Stagehand ${endpoint} timed out after ${timeoutMs}ms` };
    }
    return { success: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

// ========== Core API Wrappers ==========

/**
 * Navigate the browser to a URL.
 */
export async function stagehandNavigate(
  sessionId: string,
  url: string
): Promise<StagehandResponse> {
  console.log(`Stagehand: navigate to ${url}`);
  const result = await stagehandRequest("/navigate", { sessionId, url }, 20000);
  await mediumPause(); // Wait for page to settle like a human would
  return result;
}

/**
 * Execute an action via natural language instruction.
 * Examples: "Click the Login button", "Type 'hello' into the email field"
 */
export async function stagehandAct(
  sessionId: string,
  instruction: string,
  variables?: Record<string, string>
): Promise<StagehandResponse> {
  await shortPause(); // Brief human-like hesitation before acting
  console.log(`Stagehand: act "${instruction}"`);
  const result = await stagehandRequest("/act", {
    sessionId,
    action: instruction,
    ...(variables ? { variables } : {}),
  }, 30000);
  await shortPause(); // Pause after action like a person watching the result
  return result;
}

/**
 * Observe the current page to find interactive elements.
 * Returns a list of elements matching the instruction.
 */
export async function stagehandObserve(
  sessionId: string,
  instruction: string
): Promise<StagehandResponse<ObserveElement[]>> {
  console.log(`Stagehand: observe "${instruction}"`);
  return stagehandRequest<ObserveElement[]>("/observe", {
    sessionId,
    instruction,
  }, 20000);
}

/**
 * Extract structured data from the current page using AI.
 * Provide a natural language instruction and optional JSON schema.
 */
export async function stagehandExtract<T = Record<string, unknown>>(
  sessionId: string,
  instruction: string,
  schema?: Record<string, unknown>
): Promise<StagehandResponse<ExtractResult<T>>> {
  console.log(`Stagehand: extract "${instruction}"`);
  return stagehandRequest<ExtractResult<T>>("/extract", {
    sessionId,
    instruction,
    ...(schema ? { schema } : {}),
  }, 30000);
}

// ========== High-Level: Auto-Login via Stagehand ==========

export interface StagehandLoginResult {
  success: boolean;
  method: "stagehand";
  step: string;
  error?: string;
  isLoggedIn?: boolean;
}

/**
 * Perform auto-login to OnlyFans using Stagehand's AI-driven actions.
 * Replaces the 220-line CDP auto-login with ~30 lines of natural language.
 */
export async function autoLoginViaStagehand(
  sessionId: string,
  username: string,
  password: string
): Promise<StagehandLoginResult> {
  try {
    // Step 1: Navigate to OnlyFans
    const nav = await stagehandNavigate(sessionId, "https://onlyfans.com");
    if (!nav.success) {
      return { success: false, method: "stagehand", step: "navigate", error: nav.error };
    }

    // Wait for page to settle (humanized)
    await longPause();

    // Step 2: Check if already logged in
    const pageState = await stagehandExtract<{ isLoggedIn: boolean; hasLoginForm: boolean }>(
      sessionId,
      "Check if the user is logged into OnlyFans. Look for signs of a logged-in dashboard (like a home feed, notifications icon, or profile menu) versus a login form with email/password fields.",
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
      console.log("Stagehand: Already logged in, skipping login flow");
      return { success: true, method: "stagehand", step: "already_logged_in", isLoggedIn: true };
    }

    // Step 3: Type username into email field
    const typeEmail = await stagehandAct(
      sessionId,
      `Type '${username}' into the email or username input field on the login form`
    );
    if (!typeEmail.success) {
      return { success: false, method: "stagehand", step: "type_email", error: typeEmail.error };
    }

    // Human-like pause between fields

    // Step 4: Type password
    const typePass = await stagehandAct(
      sessionId,
      `Type '${password}' into the password input field on the login form`
    );
    if (!typePass.success) {
      return { success: false, method: "stagehand", step: "type_password", error: typePass.error };
    }

    // stagehandAct already includes humanized delays

    // Step 5: Click login button
    const clickLogin = await stagehandAct(
      sessionId,
      "Click the Log In or Sign In button to submit the login form"
    );
    if (!clickLogin.success) {
      return { success: false, method: "stagehand", step: "click_login", error: clickLogin.error };
    }

    // Step 6: Wait and verify login
    await new Promise(r => setTimeout(r, 5000));

    const verifyLogin = await stagehandExtract<{ isLoggedIn: boolean }>(
      sessionId,
      "Check if the user is now logged into OnlyFans. Look for dashboard elements, home feed, profile menu, or notifications icon that indicate a successful login.",
      {
        type: "object",
        properties: {
          isLoggedIn: { type: "boolean", description: "true if login was successful" },
        },
        required: ["isLoggedIn"],
      }
    );

    const loggedIn = verifyLogin.success && verifyLogin.data?.data?.isLoggedIn === true;

    return {
      success: true,
      method: "stagehand",
      step: "login_clicked",
      isLoggedIn: loggedIn,
    };
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
 * Scrape the OnlyFans chat list using Stagehand AI extraction.
 */
export async function scrapeChatListViaStagehand(
  sessionId: string
): Promise<StagehandResponse<{ conversations: ChatConversation[] }>> {
  // Navigate to chats
  const nav = await stagehandNavigate(sessionId, "https://onlyfans.com/my/chats");
  if (!nav.success) return { success: false, error: nav.error };

  await new Promise(r => setTimeout(r, 4000));

  return stagehandExtract<{ conversations: ChatConversation[] }>(
    sessionId,
    "Extract the list of chat conversations visible on this OnlyFans chats page. For each conversation, get the fan's display name, their last message preview text, whether it has an unread indicator/badge, and the unread count if visible. Return up to 20 conversations.",
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
 * Click into a specific conversation by fan name using Stagehand.
 */
export async function clickConversationViaStagehand(
  sessionId: string,
  fanName: string
): Promise<StagehandResponse> {
  return stagehandAct(
    sessionId,
    `Click on the chat conversation with the fan named "${fanName}" in the chat list`
  );
}

/**
 * Read the current chat conversation context using Stagehand.
 */
export async function readChatContextViaStagehand(
  sessionId: string
): Promise<StagehandResponse<ChatContext>> {
  return stagehandExtract<ChatContext>(
    sessionId,
    "Extract the chat conversation currently open. Get the fan's name from the chat header, and the last 10 messages in order. For each message, determine if it was sent by the creator (owner/model) or the fan. Also identify the last message that was sent by the fan.",
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
        lastFanMessage: { type: "string", description: "The text of the most recent message sent by the fan" },
      },
      required: ["fanName", "messages", "lastFanMessage"],
    }
  );
}

/**
 * Type a reply into the chat input and click send using Stagehand.
 */
export async function injectChatReplyViaStagehand(
  sessionId: string,
  replyText: string
): Promise<StagehandResponse<{ autoSent: boolean }>> {
  // Type the reply
  const typeResult = await stagehandAct(
    sessionId,
    `Type the following message into the chat input/textarea field: "${replyText}"`
  );
  if (!typeResult.success) return { success: false, error: typeResult.error };

  await new Promise(r => setTimeout(r, 800));

  // Click send
  const sendResult = await stagehandAct(
    sessionId,
    "Click the Send button to submit the typed chat message"
  );

  return {
    success: sendResult.success,
    data: { autoSent: sendResult.success },
    error: sendResult.error,
  };
}
