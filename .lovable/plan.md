

# Fix: Remove Stagehand, Restore Browserbase Edge Function with CDP

## Problem

The `browserbase-session` edge function crashes on boot because `npm:@browserbasehq/stagehand` transitively imports `@google/genai`, which uses Node.js CommonJS `require()` -- incompatible with the Deno edge runtime. This is NOT configurable: even when using OpenAI as the model provider, Stagehand still loads the Google module at import time. Every action (create session, save, terminate, warmup, heartbeat) is broken.

## Solution

Remove Stagehand entirely and replace all usages with direct Browserbase REST API calls + Chrome DevTools Protocol (CDP) over WebSocket. This is the battle-tested approach that was working before Stagehand was added.

## What Changes

### 1. Remove imports and helpers (top of file)

- Delete `import { Stagehand }` and `import { z } from "npm:zod"`
- Delete `createStagehandSession()` helper function (lines 22-35)
- Delete all Zod schemas (lines 37-89): `searchResultsSchema`, `articleIntelligenceSchema`, `ofEarningsSchema`, `ofSubscriberSchema`, `ofPostsSchema`, `loginStateSchema`, `redditPostsSchema`

### 2. Add CDP navigation helper

New function `navigateViaCDP()` that:
1. Fetches the session's debug WebSocket URL from `GET /sessions/{id}/debug`
2. Opens a WebSocket connection to the CDP endpoint
3. Enables `Page.enable` domain
4. Sends `Page.navigate` command with the target URL
5. Waits for `Page.loadEventFired` (with timeout)
6. Optionally executes `Runtime.evaluate` for DOM queries or scroll actions
7. Closes the WebSocket

```text
async function navigateViaCDP(apiKey, sessionId, url, options?) {
  // 1. GET /sessions/{sessionId}/debug -> get wsUrl
  // 2. new WebSocket(wsUrl)
  // 3. Send Page.navigate
  // 4. Wait for load event
  // 5. Optionally run Runtime.evaluate (scroll, DOM check, text extract)
  // 6. Close WebSocket
}
```

### 3. Fix admin session navigation (lines 202-213)

**Before:** `createStagehandSession()` + `page.goto()` + `act("wait for page to load")`

**After:** `navigateViaCDP(BK, sess.id, startUrl)` -- single call, no AI needed

### 4. Fix chatter session launch + login verification (lines 487-528)

**Before:** Stagehand `page.goto()` + `extract()` to check login state with AI

**After:**
- `navigateViaCDP()` for navigation
- `Runtime.evaluate` to check for login indicators via simple DOM queries:
  - Logged in: presence of `.b-tabs` navigation, `.l-header__menu` profile menu
  - Not logged in: presence of `form.b-loginreg` login form, `/login` in URL
- Same database updates (flag session as `pending` if not logged in, create `login_expired` event)

### 5. Simplify save_and_close (lines 243-311)

**Before:** Stagehand navigates to 3 OnlyFans pages and uses `extract()` with Zod schemas to scrape earnings, subscribers, and posts. This entire AI-powered scraping block runs before the session is released.

**After:** Remove the Stagehand analytics scraping entirely. The `save_and_close` action focuses on its core job:
1. Update the database (mark session as authenticated, record last_saved_at)
2. Close active browser sessions
3. Release the Browserbase session

Analytics data continues to be populated by:
- The existing `sync-onlyfans-earnings` edge function
- The Chrome extension analytics scraper (already deployed to sessions)
- Manual API-based sync via `onlyfans-api` edge function

### 6. Rewrite warmup system (lines 653-893)

**Before:** Stagehand `act()` for human-like browsing and `extract()` for structured intelligence

**After:**
- **Generic warmup**: CDP `Page.navigate` to each site + `Runtime.evaluate("window.scrollTo(0, document.body.scrollHeight)")` for scrolling. Less human-like but functional and reliable.
- **Research phase**: CDP `Page.navigate` to Google search URLs + `Runtime.evaluate("document.body.innerText.substring(0, 3000)")` for raw text extraction. Stored as-is in `warmup_intelligence` table (same columns, just unstructured text instead of AI-parsed takeaways).
- **Reddit/Twitter**: Same approach -- navigate + extract raw text. No structured post-level data but still captures the content for Tatum to analyze.

### 7. No database migration needed

The `warmup_intelligence` table columns (`key_takeaways`, `statistics`, `engagement_metrics`, `content_type`) remain in place. The CDP approach will:
- Set `content_type` to appropriate values
- Leave `key_takeaways` and `statistics` as null (can be populated later by Tatum's AI processing)
- Store raw engagement text in `extracted_text` instead of structured `engagement_metrics`

## What You Temporarily Lose

| Feature | Stagehand | CDP Replacement |
|---------|-----------|-----------------|
| Navigation | AI-adaptive, self-healing | Standard URL navigation (works fine) |
| Login check | AI vision analysis | DOM selector check (reliable for OnlyFans) |
| Analytics scrape | AI extracts structured data | Deferred to existing sync functions |
| Warmup browsing | Human-like interactions | Navigate + scroll (less natural) |
| Research extraction | Structured takeaways | Raw text (Tatum can process later) |

## Future Path to AI Automation

Once Stagehand publishes a Deno-compatible ESM build (removing the `@google/genai` transitive dependency), the integration can be re-added. Alternatively, a separate Node.js microservice could host Stagehand and be called via HTTP from this edge function -- this would fully decouple the Deno runtime limitation.

## File Changes

| File | Change |
|------|--------|
| `supabase/functions/browserbase-session/index.ts` | Remove Stagehand/Zod imports, add CDP helper, replace all Stagehand usage in 4 action handlers |

## Implementation Sequence

1. Remove Stagehand and Zod imports + all schemas + createStagehandSession helper
2. Add `navigateViaCDP()` helper using WebSocket + CDP protocol
3. Update `create_admin_session` to use CDP navigation
4. Simplify `save_and_close` to remove analytics scraping
5. Update `launch_chatter_session` to use CDP navigation + DOM-based login check
6. Rewrite `warmup_single_profile` to use CDP navigation + evaluate for scrolling and text extraction
7. Deploy and verify the function boots successfully

