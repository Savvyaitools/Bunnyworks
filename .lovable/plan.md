

# AI-Powered Earnings Scraping and Login Detection

## Problem
Stagehand (the Browserbase AI automation framework) requires Playwright or Puppeteer, which depend on Node.js and cannot run in the Deno edge runtime used by this project's backend functions. Direct integration is not possible.

## Solution: "Stagehand-equivalent" using Lovable AI + CDP
Instead of importing Stagehand as a library, we build the same AI-powered intelligence by combining the existing CDP infrastructure with Lovable AI (Gemini) calls. This gives us:
- AI-powered structured data extraction (like Stagehand's `extract()`)
- AI-powered login detection (like Stagehand's `observe()`)
- No Node.js dependency -- runs entirely in Deno edge functions

## Architecture

```text
+---------------------------+       +-------------------+
| browserbase-session (Deno)|       | Lovable AI Gateway|
|                           |       | (Gemini Flash)    |
|  CDP WebSocket            |       |                   |
|    |                      |       |                   |
|    +-> Get DOM text ------+------>| "Extract earnings"|
|    +-> Get page URL       |       | Returns JSON      |
|    +-> Check elements ----|------>| "Is user logged   |
|                           |<------+  in?"             |
+---------------------------+       +-------------------+
```

## Changes

### 1. Create helper: AI extraction via Lovable AI
Add two async functions inside `browserbase-session/index.ts`:

**`aiExtractEarnings(domText: string)`**
- Sends the raw DOM text (up to 8000 chars) to Lovable AI Gateway (`google/gemini-2.5-flash`)
- System prompt instructs the model to extract structured earnings data
- Uses tool calling to return a typed JSON object: `{ total, tips, subscriptions, messages, referrals, posts }`
- Falls back gracefully to 0 values if AI can't parse

**`aiDetectLoginState(domText: string, currentUrl: string)`**
- Sends DOM text + URL to Lovable AI
- System prompt asks: "Is this user logged into OnlyFans?"
- Uses tool calling to return: `{ logged_in: boolean, confidence: "high" | "medium" | "low", reason: string }`
- Only trusts "high" or "medium" confidence results

### 2. Refactor earnings scraper in `save_and_close`
Current flow: CDP Network interception (XHR) -> DOM text polling -> regex parsing

New flow:
1. CDP Network interception (XHR) -- kept as primary, fastest path
2. If XHR fails, get DOM text via CDP (existing)
3. **New**: Send DOM text to `aiExtractEarnings()` instead of regex parsing
4. Regex parsing kept as final fallback if AI call fails

This replaces ~70 lines of brittle regex parsing with a single AI call.

### 3. Refactor login detection in `save_and_close`
Current flow: CDP evaluate checks for specific CSS selectors (`.b-sidebar`, `.l-header__menu`, `form.b-loginreg`)

New flow:
1. Get DOM text + current URL via CDP (existing evaluate)
2. **New**: Send to `aiDetectLoginState()` for AI-powered determination
3. CSS selector check kept as fast pre-check; AI used for ambiguous cases

This makes login detection resilient to OnlyFans UI changes that break CSS selectors.

### 4. Configuration
- Uses the already-configured `LOVABLE_API_KEY` secret (auto-provisioned)
- Model: `google/gemini-2.5-flash` (fast, cheap, good for structured extraction)
- No new secrets or dependencies needed

## Technical Details

### AI Extraction Function
```
POST https://ai.gateway.lovable.dev/v1/chat/completions
Authorization: Bearer $LOVABLE_API_KEY

{
  model: "google/gemini-2.5-flash",
  messages: [
    { role: "system", content: "Extract OnlyFans earnings..." },
    { role: "user", content: domText }
  ],
  tools: [{
    type: "function",
    function: {
      name: "report_earnings",
      parameters: {
        type: "object",
        properties: {
          total: { type: "number" },
          tips: { type: "number" },
          subscriptions: { type: "number" },
          messages: { type: "number" },
          referrals: { type: "number" },
          posts: { type: "number" }
        }
      }
    }
  }],
  tool_choice: { type: "function", function: { name: "report_earnings" } }
}
```

### Login Detection Function
Same pattern but with a `detect_login_state` tool returning `{ logged_in, confidence, reason }`.

### Error Handling
- AI calls wrapped in try/catch with 10-second timeout
- If AI gateway returns 429 (rate limit) or 402 (credits), falls back to regex/CSS selector logic
- AI failures are non-fatal -- the existing parsing code runs as fallback

### Cost Impact
- ~2 AI calls per session close (extraction + login check)
- Using `gemini-2.5-flash` (cheapest capable model)
- Estimated cost: negligible per session

## Files Modified
- `supabase/functions/browserbase-session/index.ts` -- Add AI helper functions, refactor earnings parsing and login detection

## What This Does NOT Change
- CDP WebSocket infrastructure (unchanged)
- Network XHR interception (kept as primary strategy)
- Session lifecycle (create, launch, terminate)
- Database schema (no migrations needed)
- Frontend code (no UI changes)

