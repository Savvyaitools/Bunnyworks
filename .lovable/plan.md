

# Fix Stagehand Chat Workflow — Hybrid CDP+Stagehand Approach

## Root Cause

Two critical failures identified from logs:

1. **Stagehand API 404s on all endpoint variants** — `Cannot POST /api/v1/sessions/{sessionId}/act`. Every URL pattern tried (base `/act`, `/sessions/{id}/act`, `/v1/sessions/{id}/act`, `/api/v1/sessions/{id}/act`) returns 404. Stagehand natural language commands are not executing at all.

2. **CDP fallback click targets wrong element** — The CDP script clicks the first `<a>` tag inside a conversation row, which is the profile link (avatar/username), not the conversation body.

Since Stagehand's REST API is unreachable, the entire workflow silently falls to CDP — where the click selector is wrong.

## Strategy: CDP-First for Actions, Stagehand for Extraction Only

Stop relying on Stagehand for clicking and typing (which requires a working `/act` endpoint). Use CDP directly for all DOM interactions — it's reliable and fast. Reserve Stagehand only for `extract` if/when the API comes online.

## Changes

### 1. `supabase/functions/_shared/stagehand-helpers.ts`

- Add `clickConversationViaCDP(apiKey, sessionId, fanName)` — a new exported helper that uses `executeCDPScript` to find a conversation row by fan name text match and clicks the **conversation body/preview area** (not the profile link `<a>`):
  ```
  // Find row containing fanName text, then click the message preview 
  // or the row itself — explicitly skip <a> tags wrapping avatar/username
  ```
- Add `injectChatReplyViaCDP(apiKey, sessionId, text)` — combines text injection + send via CDP (already exists as inline script in index.ts, extract to reusable helper)
- Keep all Stagehand functions but add `isStagehandAvailable()` — a quick health check (`GET /health` or similar) cached per invocation so we don't waste time on 404 loops

### 2. `supabase/functions/browserbase-session/index.ts`

- **batch_reply flow**: Replace `clickConversationViaStagehand` with `clickConversationViaCDP` — pass `BK` (Browserbase API key) and `bbSid` along with `conv.fanName`
- The CDP click script targets conversations by matching fan name text content, then clicks the row's message preview `<div>` or the parent `<li>` element — avoiding any `<a>` child that contains the username
- Keep Stagehand for `readChatContextViaStagehand` and `injectChatReplyViaStagehand` as optional tries, but always fall back to CDP
- Remove the multi-URL retry loop overhead that adds latency on every action

### 3. CDP Click Logic (the key fix)

```javascript
// Pseudocode for the conversation click
var rows = document.querySelectorAll('.b-chats__item, [class*="chat-list"] li');
for (var row of rows) {
  if (row.textContent.includes(fanName)) {
    // Click the row itself or message preview div — NOT the <a> tag
    var preview = row.querySelector('[class*="message"], [class*="preview"], [class*="text"]');
    (preview || row).click();
    break;
  }
}
```

This is the exact fix for the screenshot issue — clicking the row body opens the chat, clicking the `<a>` opens the profile.

## Files

| File | Action |
|------|--------|
| `supabase/functions/_shared/stagehand-helpers.ts` | Add CDP click/inject helpers, add Stagehand health check |
| `supabase/functions/browserbase-session/index.ts` | Switch batch_reply to CDP-first clicking, keep Stagehand as optional enrichment |

