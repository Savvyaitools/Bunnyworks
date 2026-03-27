

## Build Stagehand Helpers Module + Migrate Auto-Login

### Overview

Create a shared `stagehand-helpers.ts` module that wraps Stagehand 2.0's REST API (`act`, `observe`, `extract`), then replace the 220-line `autoLoginViaCDP` function with a ~30-line Stagehand equivalent that uses natural language instructions.

### What Changes

**1. New file: `supabase/functions/_shared/stagehand-helpers.ts`**

Core wrapper module with:
- `stagehandRequest(endpoint, body)` — base HTTP caller using `STAGEHAND_API_KEY` and `STAGEHAND_SERVER_URL`
- `stagehandAct(sessionId, instruction, variables?)` — execute an action (click, type, scroll) via natural language
- `stagehandObserve(sessionId, instruction)` — find elements on page, returns list of interactive elements
- `stagehandExtract(sessionId, instruction, schema?)` — extract structured data from current page
- `stagehandNavigate(sessionId, url)` — navigate to a URL
- `autoLoginViaStagehand(apiKey, sessionId, username, password)` — complete login flow using act/observe

The auto-login via Stagehand would be roughly:
```
1. navigate(sessionId, "https://onlyfans.com")
2. observe(sessionId, "Is there a login form or a logged-in dashboard?")
3. If logged in → return success
4. act(sessionId, "Type '{username}' into the email field")
5. act(sessionId, "Type '{password}' into the password field")  
6. act(sessionId, "Click the Log In button")
7. Wait 5s, then observe to verify login success
```

**2. Update: `supabase/functions/_shared/cdp-helpers.ts`**

- Keep `autoLoginViaCDP` as-is (fallback)
- Export a new `autoLoginViaStagehand` that imports from stagehand-helpers

**3. Update: `supabase/functions/browserbase-session/index.ts`**

- In the `auto_login` action handler (~line 1046), add a try-first pattern:
  - Try `autoLoginViaStagehand` first
  - If Stagehand fails (API down, key missing), fall back to `autoLoginViaCDP`
- Log which method was used for debugging

### Technical Details

- **Secrets**: `STAGEHAND_API_KEY` and `STAGEHAND_SERVER_URL` are already configured
- **API pattern**: Stagehand REST endpoints expect a `sessionId` (Browserbase session) — the existing session creation flow stays identical
- **Fallback**: CDP auto-login remains as backup, so nothing breaks if Stagehand is down
- **No frontend changes** — this is entirely backend edge function work
- **The current 220-line CDP auto-login** uses fragile selectors like `input[name="email"]`, `button[type="submit"]`, `button.g-btn.m-rounded.m-block` — Stagehand replaces all of this with `act("Type email into the email field")`

### Files

| File | Action |
|------|--------|
| `supabase/functions/_shared/stagehand-helpers.ts` | Create |
| `supabase/functions/browserbase-session/index.ts` | Edit auto_login action |

