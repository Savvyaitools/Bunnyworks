

# SaaS Review: Critical Issues, Bugs, and Bright Data Assessment

---

## Part 1: Critical Issues and Bugs Found

### 1. Security: `refresh_all_contexts` Bypasses Authentication (CRITICAL)
**File:** `supabase/functions/browserbase-session/index.ts` (lines 397-434)

The `refresh_all_contexts` action runs BEFORE the auth check on line 436. Anyone can call this endpoint with any `agencyId` and reset all browser contexts for that agency -- wiping cookies and locking out all active sessions.

**Fix:** Move the action handler below the auth check, or add explicit authorization (e.g., verify the caller is an agency owner for the given `agencyId`).

---

### 2. Security: `verify_jwt = false` on ALL Edge Functions
**File:** `supabase/config.toml`

Every single edge function has `verify_jwt = false`. While the `browserbase-session` function does manual auth checks, several functions like `ingest-browser-sync`, `onlyfans-webhook`, `auto-retry-imports` are wide open. This is intentional for some (webhooks), but should be audited per-function to ensure no sensitive operations are exposed without auth.

---

### 3. Console Warnings: `forwardRef` Issues on Landing Page
**Components:** `ScrollReveal`, `GradientDivider` in `Landing.tsx`

Function components are being passed refs without `React.forwardRef()`. This causes React warnings on every landing page load -- the first impression for users. Not a crash but looks unprofessional in dev tools and may cause animation failures.

---

### 4. Edge Function: Monolithic 1,164-Line File
**File:** `supabase/functions/browserbase-session/index.ts`

This single file handles 15+ actions (create session, terminate, heartbeat, warmup, extensions, CAPTCHA check, etc.). This creates:
- Risk of Deno edge function timeout (long-running warmup operations)
- Difficult debugging and maintenance
- Single point of failure for all browser features

---

### 5. Structural: No Error Boundary on Employee/Portal Routes
The `ErrorBoundary` wraps the entire `App`, but individual route groups (employee portal, creator portal) don't have scoped error boundaries. A crash in one component takes down the entire app.

---

### 6. Data Race: Auth State + Profile Fetch
**File:** `src/hooks/useAuth.tsx` (lines 48-78)

The `onAuthStateChange` listener and `getSession()` call both trigger `fetchProfile()` independently. On fast connections, this can result in duplicate profile fetches or a race where the profile from `getSession` is overwritten by the listener's deferred `setTimeout` call.

---

## Part 2: Bright Data vs Browserbase Analysis

### Your Use Case Requirements
| Requirement | Browserbase | Bright Data Scraping Browser |
|---|---|---|
| Live iframe embed (dashboard viewer) | Native `connectUrl` | NOT supported -- no embed URL |
| Persistent login contexts (cookies) | Native contexts API | Requires manual cookie management |
| Residential proxy rotation | Built-in (limited pool) | Best-in-class (72M+ IPs) |
| CAPTCHA solving | Built-in (`solveCaptchas`) | Built-in (superior) |
| Anti-detect fingerprinting | `advancedStealth` (decent) | Superior randomization |
| Session pooling (multi-viewer) | Supported via debug URL | NOT supported |
| Cost (est. 20 sessions/day) | ~$150-300/mo | ~$90-200/mo (per-request) |

### Verdict: Bright Data is NOT a Drop-In Replacement

Bright Data's "Scraping Browser" is designed for **headless data extraction**, not for **interactive live browser sessions** that your chatters need. It does NOT provide:
1. A live embed URL to display in your dashboard iframe
2. A debug/viewer URL for session pooling
3. Persistent context IDs for cookie reuse across sessions

Switching to Bright Data would require building a **VPS relay server** with noVNC/WebRTC streaming -- a 2-4 week project with ongoing infrastructure costs.

### Recommended Strategy: Hybrid Approach

Instead of replacing Browserbase, **use Bright Data's proxy network WITH Browserbase**:

```text
Current:  Browserbase (browser) + Browserbase proxies (flagged)
Proposed: Browserbase (browser) + Bright Data proxies (premium)
```

Browserbase supports **external proxy configuration** in their session API. You can pass Bright Data residential proxies instead of using Browserbase's built-in ones. This gives you:
- Browserbase's native embed URLs, context persistence, and session pooling (unchanged)
- Bright Data's 72M+ residential IP pool with better geo-targeting and less flagging
- No architecture changes -- just swap the proxy config in the edge function

### Implementation Steps (Hybrid)

1. **Get Bright Data credentials** -- Sign up for their Residential Proxy plan (~$10/GB or flat rate)
2. **Store credentials** -- Add `BRIGHT_DATA_HOST`, `BRIGHT_DATA_USERNAME`, `BRIGHT_DATA_PASSWORD` as secrets
3. **Update proxy config** -- Modify the `proxyConf()` function in `browserbase-session/index.ts` to use Bright Data's proxy format instead of Browserbase's built-in proxies:
   - Change proxy type from `"browserbase"` to `"external"` with Bright Data's `host:port` and auth credentials
   - Keep all other Browserbase features (contexts, stealth, embed URLs) unchanged
4. **Test** -- Create an admin session and verify OnlyFans login succeeds with the premium proxies

### Cost Estimate (Hybrid)
- Browserbase: ~$50-100/mo (session minutes only, no proxy charges)
- Bright Data Residential: ~$50-100/mo (based on ~5-10GB bandwidth)
- Total: ~$100-200/mo with significantly better login success rates

---

## Part 3: Priority Fix List

| Priority | Issue | Effort |
|---|---|---|
| P0 | Fix `refresh_all_contexts` auth bypass | 15 min |
| P0 | Implement hybrid Bright Data proxies | 1-2 hours |
| P1 | Fix `ScrollReveal`/`GradientDivider` forwardRef warnings | 30 min |
| P1 | Add scoped error boundaries for portal routes | 30 min |
| P2 | Fix auth state race condition | 30 min |
| P2 | Split monolithic edge function into separate functions | 2-3 hours |

