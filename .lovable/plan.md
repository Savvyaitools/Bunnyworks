

# Cost Reduction, Multi-Chatter Session Management, and OnlyFans Account Safety

## Current Cost Analysis

Based on the data:
- **54 total sessions launched** (53 admin, 1 chatter)
- **Average admin session duration: 100 minutes** (billed as ~2 browser hours each)
- Every chatter click on "Launch Session" creates a **brand new Browserbase session** -- even if another chatter is already working on the same creator
- Browserbase bills per session with a **1-minute minimum**, and proxy data (residential) is billed per GB

At current rates (~$0.10-0.12/hr overage), 53 admin sessions averaging 100 min = **~90 browser hours consumed** just on admin auth sessions, most of which was idle time after login.

## Three Problem Areas

### Problem 1: Every Launch = New Session = New Cost
Right now, if 3 chatters work on the same creator, that's 3 separate Browserbase sessions running simultaneously -- triple the cost. Each session also appears as a separate "device" to OnlyFans, increasing account risk.

### Problem 2: Admin Auth Sessions Stay Open Too Long
Admin sessions are configured with a 1-hour timeout, but the only purpose is to log in (typically 2-5 minutes of actual work). The rest is wasted billing time.

### Problem 3: No Concurrent Access Control
Multiple chatters can launch sessions on the same creator simultaneously with no coordination. OnlyFans sees multiple simultaneous logins from different IPs (even with proxy pinning, each Browserbase session gets a different residential IP within the same state).

---

## Solution: Session Pooling + Shared Access

### Strategy 1: Shared Chatter Sessions (biggest cost saver)

Instead of each chatter getting their own Browserbase session, implement a **session pool** per creator:

- When the first chatter launches a session for a creator, a Browserbase session is created
- When a second chatter launches for the **same creator**, they get the **same embed URL** -- viewing the same browser
- The session only terminates when the **last chatter** disconnects
- Track active viewers in `active_browser_sessions` with a `viewer_count` field

This means 5 chatters working on "Addison Weems" = **1 Browserbase session** instead of 5.

**Tradeoff**: Chatters share control of the same browser -- one person's clicks affect everyone. This actually works well for the OnlyFans chatter workflow since chatters typically work different shifts, and when overlapping, they can see what the other is doing.

### Strategy 2: Shorter Admin Sessions

Reduce admin auth session timeout from 3600 seconds (1 hour) to **600 seconds (10 minutes)**. The admin only needs enough time to:
1. Load OnlyFans
2. Enter credentials + 2FA
3. Click "Save Login & Close"

Add an auto-save timer that triggers `save_and_close` after 10 minutes of inactivity, recovering the session cost.

### Strategy 3: Sequential Chatter Access (OnlyFans safety option)

For maximum OnlyFans account safety, offer a **queue mode** where only one chatter can have an active session per creator at a time. Other chatters see "In use by [name]" and can request access. When the current chatter closes, the next in queue gets the session.

This eliminates the risk of OnlyFans detecting "multiple simultaneous devices" entirely.

---

## Implementation Plan

### 1. Database Changes

New migration to support session pooling:

```text
-- Add viewer tracking to active_browser_sessions
ALTER TABLE active_browser_sessions ADD COLUMN viewer_count integer DEFAULT 1;
ALTER TABLE active_browser_sessions ADD COLUMN viewer_ids text[] DEFAULT '{}';

-- Add concurrency mode setting to agencies
ALTER TABLE agencies ADD COLUMN browser_session_mode text DEFAULT 'shared';
-- Values: 'shared' (multiple chatters share one session), 'exclusive' (one at a time)
```

### 2. Edge Function: Session Pooling Logic

Modify `launch_chatter_session` in `browserbase-session/index.ts`:

```text
Before creating a new Browserbase session:
1. Check active_browser_sessions for an existing RUNNING session for this creator
2. If found and agency mode = 'shared':
   - Verify the Browserbase session is still alive
   - Increment viewer_count, append chatter to viewer_ids
   - Return the SAME embed URL (no new Browserbase session created)
3. If found and agency mode = 'exclusive':
   - Return error: "Session in use by [chatter_name]. Please wait."
4. If no active session exists:
   - Create new Browserbase session as normal
```

Modify `terminate_session`:
```text
1. Decrement viewer_count for the session
2. If viewer_count reaches 0, THEN release the Browserbase session
3. If viewer_count > 0, just remove this chatter from viewer_ids
```

### 3. Edge Function: Admin Session Timeout Reduction

In `create_admin_session`:
- Change `timeout: 3600` to `timeout: 600` (10 minutes)
- This alone saves ~83% of admin session costs

### 4. Frontend: Active Viewer Indicator

Update `EmbeddedBrowserViewer.tsx`:
- Show "2 chatters viewing" badge when `viewer_count > 1`
- Show who else is in the session

Update `ChatterSessionLauncher.tsx`:
- Show "In use" indicator on creator cards when a session is already active
- In shared mode: show "Join Session (2 active)" instead of "Launch Session"
- In exclusive mode: show "In use by [name]" with a disabled button

### 5. Frontend: Agency Settings for Session Mode

Add a toggle in the Browser Sync page or Settings:
- **Shared Mode** (default): Multiple chatters share one browser session per creator. Lower cost, chatters can collaborate.
- **Exclusive Mode**: One chatter at a time per creator. Maximum OnlyFans safety, chatters queue up.

### 6. Session Idle Auto-Close for Chatters

Add a heartbeat mechanism:
- Chatter's browser sends a ping every 60 seconds while the embed iframe is visible
- If no ping received for 5 minutes, auto-decrement viewer_count
- Prevents "ghost" viewers from keeping sessions alive when chatters close their browser tab without clicking "Close"

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | Add viewer_count, viewer_ids, browser_session_mode |
| `supabase/functions/browserbase-session/index.ts` | Modify | Session pooling logic, shorter admin timeout, viewer tracking |
| `src/hooks/useBrowserSessions.ts` | Modify | Add joinSession, heartbeat, viewer-aware terminate |
| `src/components/browser/ChatterSessionLauncher.tsx` | Modify | Show active viewers, join vs launch, exclusive mode |
| `src/components/browser/EmbeddedBrowserViewer.tsx` | Modify | Active viewer count badge |
| `src/pages/BrowserSync.tsx` | Modify | Session mode toggle (shared/exclusive) |

---

## Cost Impact Estimate

| Scenario | Before (sessions) | After (sessions) | Savings |
|----------|-------------------|-------------------|---------|
| 3 chatters on 1 creator | 3 | 1 | 67% |
| Admin auth (100 min avg) | 100 min billed | 10 min billed | 90% |
| 5 creators, 3 chatters each | 15 sessions | 5 sessions | 67% |

## OnlyFans Safety Impact

| Risk | Before | After |
|------|--------|-------|
| Multiple simultaneous devices | Yes (each chatter = new device) | Shared: 1 device. Exclusive: 1 device |
| IP variation | Different IP per session | Same session = same IP |
| Login frequency | Every chatter launch = new login event | First chatter logs in, others join |

