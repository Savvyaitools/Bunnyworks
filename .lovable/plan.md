

# Steel.dev Integration Test — Side-by-Side with Browserbase

## Summary

Create a standalone `steel-session` edge function that mirrors the core Browserbase workflows (create session, CDP connect, save/close) using the Steel.dev API. This runs **parallel** to the existing Browserbase infrastructure — no existing code is modified. You test Steel via a dedicated UI toggle, and if it works, we swap the backend later.

## Steel vs Browserbase API Mapping

```text
Browserbase                          Steel.dev
─────────────────────────────────────────────────────────────
POST /v1/sessions                    POST https://api.steel.dev/v1/sessions
  → { projectId, browserSettings }     → { useProxy, solveCaptcha, timeout, sessionContext }
  → returns { id, status }             → returns { id, sessionViewerUrl, status }

GET /v1/sessions/:id                 GET https://api.steel.dev/v1/sessions/:id
  → status: RUNNING                    → status: live

GET /v1/sessions/:id/debug           (not needed — sessionViewerUrl in create response)
  → debuggerFullscreenUrl

WSS connect.browserbase.com          WSS connect.steel.dev
  ?apiKey=...&sessionId=...            ?apiKey=...&sessionId=...

POST /v1/contexts                    POST https://api.steel.dev/v1/sessions (with sessionContext)
  → persistent context                 → Steel uses session contexts similarly

DELETE /v1/sessions/:id              DELETE https://api.steel.dev/v1/sessions/:id/release
```

Key differences:
- Steel returns `sessionViewerUrl` directly on create (no separate `/debug` call needed)
- Steel CDP WebSocket: `wss://connect.steel.dev?apiKey=...&sessionId=...`
- Steel uses `useProxy: true` instead of a `proxies` array with geolocation
- Steel has built-in CAPTCHA solving (`solveCaptcha: true`)
- Steel timeout is in **milliseconds** (Browserbase uses seconds)

## Implementation Plan

### Step 1 — Add `STEEL_API_KEY` secret
Use the secrets tool to request the Steel API key from the user.

### Step 2 — Create `supabase/functions/steel-session/index.ts`
A new edge function with these actions:
- **`create_session`** — Creates a Steel session with proxy + CAPTCHA solving, returns embed URL and session ID
- **`check_status`** — Gets session status (maps Steel's `live` → our `RUNNING`)
- **`cdp_navigate`** — Connects via `wss://connect.steel.dev` and navigates to a URL
- **`check_login`** — Reuses existing CDP login-check logic over Steel's WebSocket
- **`auto_login`** — Reuses existing CDP credential-typing logic over Steel's WebSocket
- **`release`** — Releases/stops the session

The function reuses `corsHeaders`, `json`, auth validation, and CDP message patterns from `cdp-helpers.ts` but swaps the API endpoints and WebSocket URL.

### Step 3 — Add a "Test Steel Session" button to the Browser Sessions page
Add a small card in the admin Live Sessions tab with:
- A "Launch Steel Test" button that calls `steel-session` → `create_session`
- Embeds the `sessionViewerUrl` in the existing `EmbeddedBrowserViewer`
- "Navigate to OnlyFans" button to test CDP navigation
- "Check Login" button to test CDP login detection
- "Release Session" button to clean up

This is a **debug/test panel only** — no database writes, no session links. Pure API validation.

### Step 4 — Validate CDP compatibility
The critical test is whether Steel's `wss://connect.steel.dev` WebSocket supports the same CDP protocol methods we use:
- `Target.getTargets`, `Target.attachToTarget`
- `Page.navigate`, `Page.enable`
- `Network.enable`, `Network.getResponseBody`
- `Runtime.evaluate`
- `Network.getCookies`

If these all work, Steel is a drop-in replacement at the WebSocket layer.

## What stays untouched
- All existing Browserbase code (`browserbase-session/index.ts`, `cdp-helpers.ts`)
- All existing hooks, components, database tables
- The production session flow

## Risks to validate
1. Does Steel support persistent contexts (cookie persistence across sessions)?
2. Does Steel's proxy cover US state-level geolocation?
3. Does the `sessionViewerUrl` work as an embeddable iframe (like Browserbase's debugger URL)?
4. CDP method compatibility over Steel's WebSocket

