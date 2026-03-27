/**
 * Stagehand 2.0 REST API helpers for AI-driven browser automation.
 * Human-first approach: observe → understand → act slowly.
 * 
 * Requires secrets: STAGEHAND_API_KEY, STAGEHAND_SERVER_URL
 */

// ========== Humanized Delay Helpers ==========

/** Random delay between min and max ms */
function humanDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.floor(Math.random() * (maxMs - minMs));
  console.log(`⏳ Human pause: ${(delay / 1000).toFixed(1)}s`);
  return new Promise(r => setTimeout(r, delay));
}

/** Micro pause — like a blink or glance (1-3s) */
function microPause(): Promise<void> { return humanDelay(1000, 3000); }

/** Short pause — reading a button label (3-6s) */
function shortPause(): Promise<void> { return humanDelay(3000, 6000); }

/** Medium pause — scanning a page section (8-15s) */
function mediumPause(): Promise<void> { return humanDelay(8000, 15000); }

/** Long pause — reading content carefully (15-30s) */
function longPause(): Promise<void> { return humanDelay(15000, 30000); }

/** Extra long pause — between major actions (30-60s) */
function extraLongPause(): Promise<void> { return humanDelay(30000, 60000); }

/** Reading pause — scales with content length (~300ms per word) */
function readingPause(text: string): Promise<void> {
  const wordCount = text.split(/\s+/).length;
  const baseMs = Math.max(3000, wordCount * 300);
  const jitter = Math.floor(Math.random() * 3000);
  console.log(`📖 Reading ${wordCount} words (~${((baseMs + jitter) / 1000).toFixed(1)}s)`);
  return new Promise(r => setTimeout(r, baseMs + jitter));
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
 * Observe the current page — "look around" to understand UI layout.
 * Always call this BEFORE acting to let the AI adapt to the current UI.
 */
export async function stagehandObserve(
  sessionId: string,
  instruction: string
): Promise<StagehandResponse<ObserveElement[]>> {
  console.log(`👀 Observe: "${instruction}"`);
  await microPause(); // human glance before looking
  return stagehandRequest<ObserveElement[]>("/observe", {
    sessionId,
    instruction,
  }, 25000);
}

/**
 * Extract structured data from the current page using AI.
 */
export async function stagehandExtract<T = Record<string, unknown>>(
  sessionId: string,
  instruction: string,
  schema?: Record<string, unknown>
): Promise<StagehandResponse<ExtractResult<T>>> {
  console.log(`📊 Extract: "${instruction}"`);
  await microPause();
  return stagehandRequest<ExtractResult<T>>("/extract", {
    sessionId,
    instruction,
    ...(schema ? { schema } : {}),
  }, 30000);
}

/**
 * Execute an action via natural language — with human-like hesitation.
 */
export async function stagehandAct(
  sessionId: string,
  instruction: string,
  variables?: Record<string, string>
): Promise<StagehandResponse> {
  await shortPause(); // hesitation before acting
  console.log(`🖱️ Act: "${instruction}"`);
  const result = await stagehandRequest("/act", {
    sessionId,
    action: instruction,
    ...(variables ? { variables } : {}),
  }, 30000);
  await shortPause(); // watch the result
  return result;
}

/**
 * Navigate by clicking through UI elements like a human would.
 * First observes the page to find nav elements, then clicks.
 * Falls back to act-based URL navigation if UI click fails.
 */
export async function stagehandNavigate(
  sessionId: string,
  url: string
): Promise<StagehandResponse> {
  console.log(`🧭 Navigate to: ${url}`);

  // If navigating to chats, try clicking through UI first
  if (url.includes("/my/chats") || url.includes("/chats")) {
    console.log("🧭 Trying UI navigation — looking for Messages/Chat icon...");
    await microPause();

    // Observe nav to find the right element
    const navObserve = await stagehandObserve(
      sessionId,
      "Find the Messages, Chat, or Inbox icon/link in the navigation bar or sidebar menu"
    );

    if (navObserve.success && navObserve.data?.length) {
      console.log(`🧭 Found ${navObserve.data.length} nav elements, clicking...`);
      const clickResult = await stagehandAct(
        sessionId,
        "Click the Messages or Chat icon/link in the navigation to go to the chats/inbox page"
      );
      if (clickResult.success) {
        await longPause(); // wait for page transition like a human
        return clickResult;
      }
      console.warn("🧭 UI nav click failed, falling back to URL navigation");
    }
  }

  // Fallback: use act() to navigate via URL
  const result = await stagehandRequest("/act", {
    sessionId,
    action: `Navigate to the URL: ${url}`,
    variables: { url }
  }, 30000);
  await longPause(); // wait for full page load
  return result;
}

/**
 * Scroll the page like a human scanning content.
 */
export async function stagehandScroll(
  sessionId: string,
  direction: "down" | "up" = "down",
  context?: string
): Promise<StagehandResponse> {
  const desc = context || "the page";
  console.log(`📜 Scrolling ${direction} through ${desc}...`);
  await microPause();
  return stagehandAct(
    sessionId,
    `Scroll ${direction} slowly through ${desc} to see more content`
  );
}

/**
 * Type text character-by-character with human-like rhythm.
 * Breaks text into small chunks and types with pauses.
 */
export async function stagehandHumanType(
  sessionId: string,
  text: string,
  fieldDescription: string
): Promise<StagehandResponse> {
  console.log(`⌨️ Human typing ${text.length} chars into "${fieldDescription}"`);

  // First click/focus the field
  await stagehandAct(sessionId, `Click on ${fieldDescription} to focus it`);
  await microPause();

  // For short texts (< 30 chars), type in one go but with delay
  if (text.length < 30) {
    await humanDelay(500, 1500); // small pre-type pause
    const result = await stagehandAct(
      sessionId,
      `Type "${text}" into the currently focused ${fieldDescription}`
    );
    await shortPause(); // review what was typed
    return result;
  }

  // For longer texts, type in chunks of 15-40 chars (at word boundaries)
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    const chunkSize = Math.min(
      15 + Math.floor(Math.random() * 25), // 15-40 chars
      remaining.length
    );
    // Find nearest word boundary
    let end = chunkSize;
    if (end < remaining.length) {
      const spaceIdx = remaining.lastIndexOf(' ', end);
      if (spaceIdx > end * 0.5) end = spaceIdx + 1; // include the space
    }
    chunks.push(remaining.slice(0, end));
    remaining = remaining.slice(end);
  }

  console.log(`⌨️ Typing in ${chunks.length} chunks...`);
  let lastResult: StagehandResponse = { success: true };

  for (let i = 0; i < chunks.length; i++) {
    // Typing rhythm: 50-150ms per character equivalent
    const typingDelay = chunks[i].length * (50 + Math.floor(Math.random() * 100));
    await new Promise(r => setTimeout(r, typingDelay));

    lastResult = await stagehandRequest("/act", {
      sessionId,
      action: `Type "${chunks[i]}" continuing from where the cursor is in the input field (append, do not clear)`,
    }, 15000);

    if (!lastResult.success) {
      console.error(`⌨️ Typing chunk ${i + 1}/${chunks.length} failed`);
      return lastResult;
    }

    // Occasional longer pauses (like thinking mid-sentence)
    if (i < chunks.length - 1 && Math.random() < 0.3) {
      await humanDelay(1500, 4000);
    }
  }

  // Review what was typed
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

    // Step 2: Observe the page layout first
    console.log("🔍 Observing page layout...");
    await stagehandObserve(sessionId, "What is visible on this page? Is it a login form, a dashboard, a landing page, or something else?");
    await mediumPause();

    // Step 3: Check if already logged in
    const pageState = await stagehandExtract<{ isLoggedIn: boolean; hasLoginForm: boolean }>(
      sessionId,
      "Check if the user is logged into OnlyFans. Look for signs of a logged-in dashboard (home feed, notifications, profile menu) versus a login form with email/password fields.",
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

    // Step 4: Type username with human typing
    await stagehandHumanType(sessionId, username, "the email or username input field on the login form");
    await mediumPause(); // pause between fields like a human

    // Step 5: Type password with human typing
    await stagehandHumanType(sessionId, password, "the password input field on the login form");
    await mediumPause();

    // Step 6: Click login button
    await stagehandObserve(sessionId, "Find the Log In or Sign In submit button on the form");
    await shortPause();
    const clickLogin = await stagehandAct(sessionId, "Click the Log In or Sign In button to submit the login form");
    if (!clickLogin.success) {
      return { success: false, method: "stagehand", step: "click_login", error: clickLogin.error };
    }

    // Wait for login processing
    await longPause();

    // Step 7: Verify login
    const verifyLogin = await stagehandExtract<{ isLoggedIn: boolean }>(
      sessionId,
      "Check if the user is now logged into OnlyFans. Look for dashboard elements, home feed, profile menu, or notifications.",
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
      step: "login_complete",
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
 * Navigate to chats page using UI-first approach, then scan and extract conversations.
 */
export async function scrapeChatListViaStagehand(
  sessionId: string
): Promise<StagehandResponse<{ conversations: ChatConversation[] }>> {
  // Step 1: Navigate to chats via UI
  const nav = await stagehandNavigate(sessionId, "https://onlyfans.com/my/chats");
  if (!nav.success) return { success: false, error: nav.error };

  // Step 2: Observe the chat page layout
  console.log("👀 Scanning chat page layout...");
  const pageLayout = await stagehandObserve(
    sessionId,
    "What elements are visible on this chat/messages page? Look for a list of conversations, unread badges, fan names, and message previews."
  );
  console.log(`👀 Found ${pageLayout.data?.length || 0} interactive elements on chat page`);
  await mediumPause(); // human scanning the page

  // Step 3: Scroll through chat list to see more conversations
  await stagehandScroll(sessionId, "down", "the chat conversation list");
  await shortPause();
  await stagehandScroll(sessionId, "up", "back to the top of the chat list");
  await mediumPause();

  // Step 4: Extract conversations
  return stagehandExtract<{ conversations: ChatConversation[] }>(
    sessionId,
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
 * Click into a specific conversation — observe first, then click with human timing.
 */
export async function clickConversationViaStagehand(
  sessionId: string,
  fanName: string
): Promise<StagehandResponse> {
  // Observe the conversation in the list first
  console.log(`👀 Looking for "${fanName}" in chat list...`);
  const findFan = await stagehandObserve(
    sessionId,
    `Find the chat conversation with "${fanName}" in the chat list. Look for their name, profile picture, or message preview.`
  );

  if (!findFan.success || !findFan.data?.length) {
    // Maybe need to scroll to find them
    console.log(`📜 "${fanName}" not visible, scrolling to find...`);
    await stagehandScroll(sessionId, "down", "the chat list");
    await shortPause();
  }

  await microPause(); // human hovering over the name
  return stagehandAct(
    sessionId,
    `Click on the chat conversation with the fan named "${fanName}" in the chat list to open it`
  );
}

/**
 * Read the current chat conversation — observe layout, scroll to read, then extract.
 */
export async function readChatContextViaStagehand(
  sessionId: string
): Promise<StagehandResponse<ChatContext>> {
  // Step 1: Observe the chat layout
  console.log("👀 Observing open conversation layout...");
  await stagehandObserve(
    sessionId,
    "What is visible in this open chat conversation? Look for the fan's name in the header, message bubbles, the message input field, and any media or tips."
  );
  await shortPause();

  // Step 2: Scroll up to see older messages, then back down
  console.log("📜 Scrolling through message history...");
  await stagehandScroll(sessionId, "up", "the message history to see older messages");
  await mediumPause(); // reading older messages
  await stagehandScroll(sessionId, "down", "back to the latest messages");
  await shortPause();

  // Step 3: Extract the conversation
  const result = await stagehandExtract<ChatContext>(
    sessionId,
    "Extract the chat conversation. Get the fan's name from the header, the last 10 messages in order, and identify who sent each (creator/model or fan). Also get the most recent fan message.",
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

  // Simulate reading the fan's last message
  if (result.success && result.data?.data?.lastFanMessage) {
    await readingPause(result.data.data.lastFanMessage);
  }

  return result;
}

/**
 * Type a reply into the chat and send it — full human-like workflow:
 * 1. Observe the input area
 * 2. Click to focus
 * 3. Type character-by-character with pauses
 * 4. Re-read the typed message
 * 5. Verify text is in input
 * 6. Click send (with Enter fallback)
 * 7. Verify message appeared in chat
 */
export async function injectChatReplyViaStagehand(
  sessionId: string,
  replyText: string
): Promise<StagehandResponse<{ autoSent: boolean }>> {
  console.log(`💬 Injecting reply (${replyText.length} chars)...`);

  // Step 1: Observe the input area first
  const inputObserve = await stagehandObserve(
    sessionId,
    "Find the message input field, textarea, or text box at the bottom of the chat where you can type a new message. Also look for the Send button."
  );
  console.log(`👀 Found ${inputObserve.data?.length || 0} input-related elements`);
  await shortPause();

  // Step 2: Type with human rhythm
  const typeResult = await stagehandHumanType(
    sessionId,
    replyText,
    "the message input field or textarea at the bottom of the chat"
  );
  if (!typeResult.success) {
    console.error("❌ Failed to type reply:", typeResult.error);
    return { success: false, error: `Could not type reply: ${typeResult.error}` };
  }

  // Step 3: Re-read / review the typed message (like a human would)
  console.log("📖 Re-reading typed message before sending...");
  await readingPause(replyText);

  // Step 4: Verify text is actually in the input
  const verifyText = await stagehandExtract<{ hasText: boolean; inputText: string }>(
    sessionId,
    "Check the message input field at the bottom of the chat. Is there text typed into it? What text is currently in the input?",
    {
      type: "object",
      properties: {
        hasText: { type: "boolean", description: "true if there is text in the input" },
        inputText: { type: "string", description: "The text currently in the input field" },
      },
      required: ["hasText", "inputText"],
    }
  );

  if (verifyText.success && !verifyText.data?.data?.hasText) {
    console.warn("⚠️ Text not detected in input, retrying type...");
    await stagehandAct(sessionId, "Click on the message input field to focus it");
    await microPause();
    await stagehandAct(sessionId, `Type "${replyText}" into the message input field`);
    await shortPause();
  }

  // Step 5: Find and click the send button
  console.log("🔍 Looking for Send button...");
  await stagehandObserve(sessionId, "Find the Send button — it may be a paper plane icon, an arrow icon, or labeled 'Send'");
  await microPause();

  const sendResult = await stagehandAct(
    sessionId,
    "Click the Send button (paper plane icon or 'Send' label) to submit the typed chat message"
  );

  if (!sendResult.success) {
    console.warn("⚠️ Send button click failed, trying Enter key...");
    const enterResult = await stagehandAct(
      sessionId,
      "Press the Enter key to send the message in the chat input"
    );
    if (!enterResult.success) {
      return { success: false, error: `Could not send: ${sendResult.error}` };
    }
  }

  // Step 6: Watch the message appear (human would watch)
  await mediumPause();

  // Step 7: Verify message was sent
  const verifySent = await stagehandExtract<{ inputEmpty: boolean; messageSent: boolean }>(
    sessionId,
    "Check if the message was sent. The input should be empty now, and the message should appear as the latest message in the chat from the creator/model side.",
    {
      type: "object",
      properties: {
        inputEmpty: { type: "boolean", description: "true if input is now empty" },
        messageSent: { type: "boolean", description: "true if message appears as sent in chat" },
      },
      required: ["inputEmpty", "messageSent"],
    }
  );

  const wasSent = verifySent.success && (verifySent.data?.data?.messageSent || verifySent.data?.data?.inputEmpty);
  console.log(`💬 Message send result: ${wasSent ? '✅ sent' : '❓ uncertain'}`);

  // Final human pause — watching the sent message
  await shortPause();

  return {
    success: true,
    data: { autoSent: wasSent === true },
  };
}
