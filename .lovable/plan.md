
# Earnings Scraper v3 — XHR Interception + DOM Fallback

## Status: ✅ Deployed & All 9 Tests Passing

## Architecture (Feb 25, 2026)

### Primary: CDP Network XHR Interception
Instead of just reading `document.body.innerText`, the scraper now:
1. Opens a single CDP WebSocket connection
2. Enables `Network` domain to intercept all XHR responses
3. Navigates to `onlyfans.com/my/statistics/statements/earnings`
4. Captures any response matching OF's internal API patterns (`/api2/v2/earnings`, `/api2/v2/statistics`, etc.)
5. Parses the structured JSON response directly — no DOM parsing needed

OF's internal API returns data like:
```json
{ "data": { "total": { "total": 8180.89, "gross": 10226.11 }, "subscribes": {...}, "tips": {...}, "messages": {...} }}
```

### Fallback: DOM Text Polling
If no XHR response is captured (e.g., API pattern changed), DOM polling runs in parallel:
- 8 attempts at 1.5s intervals (~12s)
- Detects `$` amounts and category keywords
- Parses newline-separated label/amount pairs (OF's typical innerText format)
- Final fallback: finds largest `$` amount on the page

### Dual-Source Parsing
Result processing handles both cases:
- `_source: "xhr"` → uses pre-parsed JSON values directly
- Otherwise → DOM regex parsing with newline + inline + fallback patterns

## Test Coverage
9 tests covering: XHR JSON parsing, newline-separated DOM, inline colon format, spacing variations, fallback amounts, empty pages, realistic OF DOM variants.

## To Verify End-to-End
1. Log in to the app in the preview
2. Go to Browser → Live Sessions
3. Launch admin session for Addison Weems
4. Click "Save Login & Close"
5. Check edge function logs for `CDP: Captured earnings API response` (XHR success) or `Earnings DOM poll` (fallback)
6. Verify `creator_earnings` table updates
