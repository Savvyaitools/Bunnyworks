

# Optimization Review: Browser Session Workflow

## Current State Assessment

After reviewing the full 1,674-line `browserbase-session` edge function, the earnings scraper test suite, and related UI components, here are the findings and proposed optimizations:

---

## Issues Found

### 1. Earnings Scraper: CDP Message Routing is Fragile (Critical)
The CDP WebSocket message handler in the `save_and_close` earnings scrape (lines 635-744) uses hard-coded message IDs (`msg.id === 1` for getTargets) and loose conditions to detect state transitions. This is brittle:
- `msg.id === 1` assumes getTargets is always the first message sent -- if any race condition or extra message arrives, routing breaks silently.
- The `!networkEnabled && msg.result && !msg.result.sessionId && !navigated` check (line 656) is ambiguous and could match unrelated responses.

**Fix:** Track sent message IDs explicitly (like `navigateViaCDP` does) instead of relying on constants and negative checks.

### 2. Earnings Scraper: Double-Parsing Overhead (Medium)
When XHR interception succeeds (line 752-782), the data is serialized to JSON string with `_source: "xhr"` and then immediately parsed back from that string (lines 798-811). This serialize-then-deserialize round-trip is unnecessary.

**Fix:** Pass the parsed values directly to the upsert logic instead of stringifying and re-parsing.

### 3. DOM Poll Can Run Indefinitely After XHR Success (Medium)
When the XHR JSON is captured and `finish()` is called (line 708), the DOM polling `setTimeout` chains may still be in-flight. While `done` flag prevents duplicate resolution, the pending timers waste resources.

**Fix:** Add explicit `done` checks at the start of `startDomPoll`.

### 4. Network.loadingFinished Handler Race Condition (Low)
Line 692: `!pendingBodyRequests.size` check means if a body request is already pending, a second loadingFinished event for a different matching request is silently dropped.

**Fix:** Always request the body for captured responses regardless of pending state.

### 5. `navigateViaCDP` Timeout Resolves as Success (Design Concern)
Line 38-41: When CDP navigation times out, it resolves with `{ success: true, result: null }`. This masks actual failures. The warmup and chatter launch flows treat `success: true` as confirmation of navigation, but the page may never have loaded.

**Fix:** Resolve timeouts as `{ success: false, error: "timeout" }` or add a `timedOut: true` flag so callers can distinguish.

### 6. Edge Function Size: 1,674 Lines in a Single File (Maintainability)
The function handles 15+ distinct actions in one file. While Deno edge functions require single-file entry points, the code could benefit from extracting shared utilities (CDP helpers, parsing) into inline modules or at least clearer section organization.

**Fix:** Consolidate CDP helpers and add a function-level routing map for cleaner dispatch.

---

## Proposed Optimizations

### A. Fix Earnings Scraper CDP Routing (Critical)
Replace hard-coded `msg.id === 1` with tracked IDs:
```text
let getTargetsId: number, attachId: number, networkEnableId: number, ...
// on each send(), store the returned ID and match in onmessage
```

### B. Eliminate Double JSON Serialization
Instead of stringifying XHR results then parsing them again, pass the earnings object directly to the upsert block:
```text
// Before: statsResult = { success: true, result: JSON.stringify({_source: "xhr", ...}) }
// After:  earningsData = { total: bestTotal, tips, subs, messages, posts, referrals }
```
This removes ~30 lines of redundant parse logic.

### C. Fix navigateViaCDP Timeout Semantics
Change timeout resolution to include a `timedOut` flag so callers can handle it appropriately:
```text
resolve({ success: true, timedOut: true, result: null });
```

### D. Guard DOM Poll After XHR Capture
Add early return in `startDomPoll` when `earningsJson` is already captured.

### E. Fix Network.loadingFinished Race
Queue body requests for all matching responses instead of skipping when another is pending.

---

## Files to Modify
- `supabase/functions/browserbase-session/index.ts` -- All changes are in this single file

## Impact
- More reliable earnings extraction (fixes silent failures from CDP routing bugs)
- Cleaner code with ~30 fewer lines from removing double-parse
- Better observability: timeout vs success is distinguishable in logs
- No UI changes required

