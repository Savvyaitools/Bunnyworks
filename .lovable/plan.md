

# Session Pooling: Fix the "3 Chatters = 3 Sessions" Problem

## The Problem (Recap)

```text
Current: 3 chatters on 1 creator
  Chatter A clicks Launch --> new Browserbase session ($$$, IP: 1.2.3.4)
  Chatter B clicks Launch --> new Browserbase session ($$$, IP: 5.6.7.8)
  Chatter C clicks Launch --> new Browserbase session ($$$, IP: 9.10.11.12)
  
  Result: 3x cost, 3 different IPs, OnlyFans sees 3 devices = risk

Fixed: 3 chatters on 1 creator
  Chatter A clicks Launch --> new Browserbase session (IP: 1.2.3.4)
  Chatter B clicks Launch --> joins SAME session (no new cost, same IP)
  Chatter C clicks Launch --> joins SAME session (no new cost, same IP)
  
  Result: 1x cost, 1 IP, OnlyFans sees 1 device = safe
```

## What Changes

### 1. Database: Track Viewers Per Session

Add `viewer_count` and `viewer_ids` columns to `active_browser_sessions` so we know how many chatters are in a session. Add `browser_session_mode` to `agencies` so each agency can choose shared vs exclusive mode.

### 2. Edge Function: Pool Sessions Instead of Creating New Ones

When a chatter clicks "Launch Session":
- **Check first**: Is there already a running Browserbase session for this creator?
- **If yes (shared mode)**: Return the same embed URL, increment viewer count -- no new Browserbase session created
- **If yes (exclusive mode)**: Block with "In use by [name]" message
- **If no**: Create a new session as normal

When a chatter clicks "Close":
- Decrement viewer count
- Only release the Browserbase session when the last viewer leaves (viewer_count = 0)

### 3. Shorter Admin Auth Sessions

Reduce admin session timeout from **60 minutes to 10 minutes**. Admins only need 2-5 minutes to log in and save cookies. This alone saves ~83% of admin session costs.

### 4. Heartbeat: Auto-Cleanup Ghost Viewers

Add a 60-second ping from the browser while the session iframe is open. If no ping for 5 minutes (tab closed, browser crashed), automatically remove that viewer. Prevents "phantom" viewers from keeping sessions alive forever.

### 5. UI Updates

**Chatter Portal** (`ChatterSessionLauncher.tsx`):
- Show "Join Session (2 active)" instead of "Launch Session" when a session already exists
- In exclusive mode, show "In use by [name]" with a disabled button

**Browser Viewer** (`EmbeddedBrowserViewer.tsx`):
- Show viewer count badge: "3 viewing"
- Heartbeat runs automatically in the background

**Admin Browser Sync** (`BrowserSync.tsx`):
- Add session mode toggle (Shared / Exclusive) in the UI

## Technical Details

### Database Migration

```text
active_browser_sessions:
  + viewer_count (integer, default 1)
  + viewer_ids (text array, default empty)
  + last_heartbeat_at (timestamptz)

agencies:
  + browser_session_mode (text, default 'shared')
    -- 'shared': multiple chatters share one browser session
    -- 'exclusive': one chatter at a time per creator
```

### Edge Function Changes (`browserbase-session/index.ts`)

**`launch_chatter_session` action** -- new pooling logic added before session creation:

```text
1. Query active_browser_sessions for this creator where is_active = true
2. If found:
   a. Verify Browserbase session is still RUNNING
   b. If agency mode = 'shared':
      - Increment viewer_count, append chatter to viewer_ids
      - Return existing embed_url (NO new Browserbase session)
   c. If agency mode = 'exclusive':
      - Return error: "Session in use by [chatter_name]"
3. If not found:
   - Create new Browserbase session as normal (existing code)
```

**`terminate_session` action** -- viewer-aware teardown:

```text
1. Find session by browserbaseSessionId
2. Decrement viewer_count, remove chatter from viewer_ids
3. If viewer_count <= 0:
   - Release Browserbase session (existing code)
   - Mark as inactive
4. If viewer_count > 0:
   - Keep session alive, just update viewer tracking
```

**New `session_heartbeat` action**:

```text
1. Update last_heartbeat_at for the chatter's session
2. Background: mark sessions with no heartbeat for 5+ min as stale
   and auto-decrement their viewer_count
```

**`create_admin_session`**: Change `timeout: 3600` to `timeout: 600`

### Frontend Changes

**`src/hooks/useBrowserSessions.ts`**:
- Add `joinSession()` method (calls updated launch action)
- Add `sendHeartbeat()` method
- Update `terminateSession()` to handle viewer-aware close

**`src/components/browser/EmbeddedBrowserViewer.tsx`**:
- Add `viewerCount` prop and display badge
- Start heartbeat interval on mount, clear on unmount

**`src/components/browser/ChatterSessionLauncher.tsx`**:
- Query active sessions for each creator
- Show "Join Session (N active)" vs "Launch Session"
- Show "In use by [name]" in exclusive mode

**`src/pages/BrowserSync.tsx`**:
- Add session mode toggle (Shared/Exclusive)

### New Hook: `src/hooks/useSessionHeartbeat.ts`

Sends a heartbeat ping every 60 seconds while a session is active. Cleans up on component unmount.

## Files Summary

| File | Action |
|------|--------|
| Database migration | Create |
| `supabase/functions/browserbase-session/index.ts` | Modify (pooling, heartbeat, shorter timeout) |
| `src/hooks/useBrowserSessions.ts` | Modify (join, heartbeat, viewer-aware close) |
| `src/hooks/useSessionHeartbeat.ts` | Create |
| `src/components/browser/EmbeddedBrowserViewer.tsx` | Modify (viewer badge, heartbeat) |
| `src/components/browser/ChatterSessionLauncher.tsx` | Modify (join vs launch, exclusive mode) |
| `src/pages/BrowserSync.tsx` | Modify (session mode toggle) |

## Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| 3 chatters, 1 creator | 3 sessions billed | 1 session billed (67% savings) |
| Admin auth session | ~100 min billed | ~10 min billed (90% savings) |
| OnlyFans device fingerprints | 1 per chatter | 1 per creator (safe) |
| IP consistency | Different IP per session | Same IP for all viewers |

