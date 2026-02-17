

# Browserbase Security Hardening and Fixed US Residential Proxies

## Root Cause Analysis

Three critical issues are causing OnlyFans login warnings and session persistence failures:

### Issue 1: No Proxy Configured for Any Creator
All 7 creators in the database have `proxy_country: NULL` and `proxy_state: NULL`. This means sessions launch with Browserbase's default datacenter IPs -- which OnlyFans flags as suspicious, triggering "multiple login attempts" alerts.

### Issue 2: Sessions Stuck at "Authenticating"
Two session links (`Addison Weems` and `suni`) show `session_status: authenticating` even though they have `last_saved_at` timestamps. This happens because:
- The admin closes the browser window, which triggers `handleClose` -> `saveAndClose`
- But if the Browserbase session has already timed out (15-min idle or 1-hour max), the `REQUEST_RELEASE` call fails silently
- The context may not be fully persisted by Browserbase if the session was already dead
- Result: status stays "authenticating" and next launch creates a NEW context instead of reusing the saved one, triggering another "new device" login on OnlyFans

### Issue 3: Rotating vs Fixed Proxies
The current `proxyConf()` function uses `type: "browserbase"` which gives a different residential IP each session. OnlyFans sees each session as a login from a new location, triggering security alerts even with US proxies set.

---

## Solution

### 1. Default All Creators to US Residential Proxy

**Database Migration**: Set `proxy_country = 'US'` for all existing creators and make it the default for new ones.

```text
UPDATE creators SET proxy_country = 'US' WHERE proxy_country IS NULL;
ALTER TABLE creators ALTER COLUMN proxy_country SET DEFAULT 'US';
```

This ensures every browser session routes through a US residential IP automatically, without requiring manual configuration per creator.

### 2. Add Proxy Geo Settings to Browser Page

**File**: `src/pages/BrowserSync.tsx`

Re-add the `ProxyGeoSettings` component as a section within the Live Sessions tab (below the launcher). This was previously removed from the UI but the component still exists. Agency owners need easy access to override the default US proxy per creator (e.g., for UK-based creators).

### 3. Fix Session Status Persistence

**File**: `supabase/functions/browserbase-session/index.ts`

In the `save_and_close` action:
- Before sending `REQUEST_RELEASE`, check the session status via the Browserbase API first
- If the session is already dead/completed, still update the database status to `authenticated` (the context was auto-persisted by Browserbase on session end)
- Add explicit error handling so the status update never silently fails

In the `create_admin_session` action:
- Before creating a new context, check if the existing session link already has a valid context and status is "authenticating" with a `last_saved_at` -- this means the previous save partially succeeded
- Reuse the existing context instead of creating a new one
- This prevents OnlyFans from seeing a "new device" login

### 4. Auto-Save on Session Timeout

**File**: `supabase/functions/browserbase-session/index.ts`

Add a new `check_and_recover_sessions` action that:
- Queries all session links with `session_status = 'authenticating'` and `last_saved_at IS NOT NULL`
- For each, checks if the Browserbase session is still running
- If not running (timed out / completed), updates status to `authenticated` since Browserbase auto-persists context on session end when `persist: true` is set
- This recovers the two currently stuck sessions

### 5. Session Health Check Before Launch

**File**: `supabase/functions/browserbase-session/index.ts`

In both `create_admin_session` and `launch_chatter_session`:
- Before launching, verify the existing context is still valid by attempting a lightweight Browserbase API call
- If the context is invalid/expired, create a new one and warn the user they'll need to re-authenticate
- Log context reuse vs creation events for debugging

### 6. Proxy Pinning Strategy (IP Consistency)

**File**: `supabase/functions/browserbase-session/index.ts`

Update `proxyConf()` to request geolocation-pinned proxies with state-level specificity:
- Default: `{ type: "browserbase", geolocation: { country: "US", state: "california" } }`
- When a creator has `proxy_state` set, use that specific state
- When no state is set, default to `california` for consistency
- Store the last-used proxy state in `creator_session_links` so subsequent sessions request the same geolocation, reducing IP variation

### 7. Frontend Session Recovery

**File**: `src/components/browser/AdminSessionLauncher.tsx`

- On component mount, check for sessions stuck at "authenticating" with a `last_saved_at` older than 2 hours
- Auto-call the `check_and_recover_sessions` action to fix their status
- Display recovered sessions as "authenticated" immediately

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | Default proxy_country to 'US', backfill existing creators |
| `supabase/functions/browserbase-session/index.ts` | Modify | Fix save_and_close reliability, add session recovery, improve proxy config, add health checks |
| `src/pages/BrowserSync.tsx` | Modify | Re-add ProxyGeoSettings component to the UI |
| `src/components/browser/AdminSessionLauncher.tsx` | Modify | Auto-recover stuck sessions on mount |
| `src/hooks/useBrowserSessions.ts` | Modify | Add recoverSessions method |

---

## Security Strategy Summary

```text
BEFORE (current):
  No proxy -> Datacenter IP -> OnlyFans flags "suspicious login"
  Session timeout -> Status stuck "authenticating" -> New context created -> "New device" alert
  Rotating proxy -> Different IP each session -> "Multiple login locations" alert

AFTER (proposed):
  US proxy default -> Fixed geolocation -> Consistent residential IP region
  Auto-recovery -> Status always reflects reality -> Context reused -> Same device
  State-pinned proxy -> Same US state each session -> Minimal location variation
```

## Competitive Advantages

1. **Zero manual proxy setup** -- US residential proxy enabled by default for every creator, no configuration needed
2. **Self-healing sessions** -- Stuck sessions auto-recover, reducing admin support burden
3. **IP consistency** -- State-level proxy pinning means OnlyFans sees the same geographic origin every time
4. **Context persistence** -- Browserbase contexts with `persist: true` survive session timeouts, eliminating re-login requirements
5. **No credentials stored** -- Login state lives in the Browserbase context (browser cookies/storage), never in the database

