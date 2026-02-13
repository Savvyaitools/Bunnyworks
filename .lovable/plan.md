

# Browserbase Integration for CreatorOS -- Complete Production Plan

## Overview

Replace the existing Hyperbeam-based browser session system with Browserbase to enable agency admins and chatters to launch, operate, and monitor real OnlyFans/Fanvue browser sessions directly inside CreatorOS. The existing database tables already contain Browserbase columns -- this plan builds the edge function backend and frontend components to make them functional.

## Current State

- Database tables `creator_session_links`, `active_browser_sessions`, `session_link_assignments`, and `session_access_logs` already exist with Browserbase-specific columns (`browserbase_context_id`, `browserbase_session_id`, `browserbase_live_url`)
- Secrets `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` are already configured
- The legacy `hyperbeam-session` edge function exists but references the Hyperbeam API -- it needs to be replaced with a Browserbase equivalent
- RLS policies are already in place for all session tables (agency-scoped)
- The `BrowserSync` page exists but only handles Chrome Extension sync and OnlyFans API connections -- it needs a new "Live Sessions" tab

## 1. System Architecture

```text
ADMIN FLOW:
  CreatorOS UI --> browserbase-session Edge Function (create_admin_session)
       --> Browserbase API: POST /v1/contexts (create persistent context)
       --> Browserbase API: POST /v1/sessions (start session with context)
       --> Browserbase API: GET /v1/sessions/{id}/debug (get live view URL)
       --> Store context_id + session_id + live_url in creator_session_links
       --> Return live_url to frontend --> Embed in iframe
       --> Admin logs into OnlyFans manually via live view
       --> Admin clicks "Save & Close" --> Edge Function saves context, terminates session

CHATTER FLOW:
  ChatterUI --> browserbase-session Edge Function (launch_chatter_session)
       --> Verify chatter assignment via session_link_assignments
       --> Browserbase API: POST /v1/sessions (with saved context_id, persist: true)
       --> Browserbase API: GET /v1/sessions/{id}/debug (live view URL)
       --> Store in active_browser_sessions
       --> Return live_url --> Embed in iframe (chatter operates OF normally)
       --> On close --> terminate session, log access

SCRAPING FLOW (future phase):
  pg_cron --> browserbase-scrape Edge Function
       --> Browserbase API: POST /v1/sessions (headless, with context)
       --> Connect via Playwright CDP
       --> Extract earnings, fans, messages
       --> Store in of_cache / creator_earnings tables
       --> Terminate session
```

## 2. Database Changes

The existing schema is nearly complete. Only one minor migration is needed:

- Add `browserbase_connect_url` column to `active_browser_sessions` for Playwright CDP connections (used by future scraping)
- Drop the now-unused Hyperbeam columns from `creator_session_links` (the old `encrypted_session`, `hyperbeam_session_id`, `hyperbeam_admin_token`, `hyperbeam_profile_id` columns -- but these don't exist in current schema, so no action needed)

The existing columns already cover the needs:
- `creator_session_links.browserbase_context_id` -- persistent login state
- `creator_session_links.browserbase_session_id` -- current active session
- `creator_session_links.browserbase_live_url` -- iframe embed URL
- `creator_session_links.session_status` -- pending/authenticating/authenticated/expired
- `active_browser_sessions.browserbase_session_id` -- active session tracking
- `active_browser_sessions.browserbase_live_url` -- live view for active session
- `session_link_assignments` -- chatter-to-session mapping

## 3. Edge Function: `browserbase-session`

Replace the existing `hyperbeam-session` edge function with a new `browserbase-session` function. The function handles 5 actions:

**Action: `create_admin_session`**
- Params: `creatorId`, `platform`, `agencyId`
- Creates a Browserbase Context (or reuses existing one from `creator_session_links.browserbase_context_id`)
- Starts a new Browserbase Session with that context + `persist: true`
- Gets the live view URL via the debug endpoint
- Updates `creator_session_links` with context_id, session_id, live_url, status = "authenticating"
- Inserts into `active_browser_sessions`
- Returns: `{ embedUrl, sessionId, contextId }`

**Action: `save_and_close`**
- Params: `sessionLinkId`, `browserbaseSessionId`
- The context is already being persisted (persist: true was set on creation)
- Terminates the Browserbase session (it auto-saves context on close)
- Updates `creator_session_links.session_status` = "authenticated"
- Marks `active_browser_sessions` as inactive
- Returns: `{ success: true }`

**Action: `launch_chatter_session`**
- Params: `sessionLinkId`, `chatterId`
- Verifies chatter assignment in `session_link_assignments`
- Checks session link is active, not expired, has a context_id
- Creates new Browserbase Session with saved context_id + `persist: true`
- Gets live view URL
- Inserts into `active_browser_sessions`
- Logs in `session_access_logs`
- Returns: `{ embedUrl, sessionId, platform }`

**Action: `terminate_session`**
- Params: `browserbaseSessionId`
- Calls Browserbase DELETE session API
- Updates `active_browser_sessions.is_active = false`

**Action: `get_session_status`**
- Params: `browserbaseSessionId`
- Calls Browserbase GET session API
- Returns status and metadata

**Browserbase API endpoints used:**
- `POST https://api.browserbase.com/v1/contexts` -- create context
- `POST https://api.browserbase.com/v1/sessions` -- create session
- `GET https://api.browserbase.com/v1/sessions/{id}/debug` -- get live view URLs
- `GET https://api.browserbase.com/v1/sessions/{id}` -- get session status
- `POST https://api.browserbase.com/v1/sessions/{id}/stop` or send appropriate close signal

All requests use header `X-BB-API-Key` for authentication.

## 4. Frontend Architecture

### New Components

**`src/components/browser/AdminSessionLauncher.tsx`**
- Dropdown to select creator + platform (OnlyFans / Fanvue)
- "Launch Admin Session" button
- Calls edge function with `create_admin_session`
- On success, shows the embedded browser viewer
- "Save Login & Close" button that calls `save_and_close`

**`src/components/browser/EmbeddedBrowserViewer.tsx`**
- Renders an iframe with the Browserbase live view URL
- Full-width/height with loading skeleton
- Status bar showing session info (creator name, platform, duration)
- "End Session" button
- Auto-detects if session drops and shows reconnect option

**`src/components/browser/BrowserSessionsDashboard.tsx`**
- Table showing all `creator_session_links` for the agency
- Columns: Creator, Platform, Status, Context Saved, Last Used, Actions
- Actions: Launch session, Assign chatters, Revoke, Delete
- Shows `active_browser_sessions` count per link

**`src/components/browser/ChatterSessionLauncher.tsx`**
- For employee/chatter portal
- Shows assigned creator accounts from `session_link_assignments`
- "Open [Creator] OnlyFans" button
- Launches chatter session and embeds the live view

**`src/components/browser/SessionStatusMonitor.tsx`**
- Small widget showing active sessions count
- Polls session status periodically
- Shows "Session expired" warnings

### Page Changes

**`src/pages/BrowserSync.tsx`** -- Add a third tab "Live Sessions" alongside the existing "OnlyFans API" and "Chrome Extension" tabs:
- Contains `AdminSessionLauncher` and `BrowserSessionsDashboard`
- When a session is active, shows `EmbeddedBrowserViewer` in a full-screen overlay or dedicated area

**Employee Portal** -- Add browser access in the employee OnlyFans page:
- `ChatterSessionLauncher` component for assigned accounts
- `EmbeddedBrowserViewer` for the active session

### New Hook

**`src/hooks/useBrowserSessions.ts`**
- Wraps all edge function calls (create, save, launch, terminate)
- Queries `creator_session_links` and `active_browser_sessions` for the agency
- Provides loading/error states
- Real-time subscription on `active_browser_sessions` for live status

## 5. Session Flows

### Admin Flow (detailed)
1. Admin navigates to Browser > Live Sessions tab
2. Selects a creator and platform from dropdown
3. Clicks "Launch Admin Session"
4. Edge function creates/reuses a Browserbase Context
5. Edge function starts a Session with that Context
6. Edge function retrieves live view URL
7. Frontend embeds the live view URL in an iframe
8. Admin sees OnlyFans login page, enters credentials manually
9. Admin completes login (including any 2FA)
10. Admin clicks "Save Login & Close" in CreatorOS UI
11. Edge function terminates the session (context auto-persists cookies)
12. Session link status updates to "authenticated"
13. Admin can now assign chatters to this session link

### Chatter Flow (detailed)
1. Chatter logs into Employee Portal
2. Navigates to their OnlyFans workspace
3. Sees assigned creator accounts with "Launch" buttons
4. Clicks "Launch" on a creator
5. Edge function verifies assignment, creates session with saved Context
6. Session starts with cookies already loaded -- OnlyFans opens logged in
7. Chatter operates normally (chat, respond, etc.) via the iframe
8. When done, clicks "End Session"
9. Edge function terminates session (context persists any new cookies)
10. Access is logged in `session_access_logs`

## 6. Scraping and Automation (Phase 3-4)

Future phase using Browserbase's Playwright CDP connection:
- A scheduled edge function connects to a headless Browserbase session via CDP
- Uses Playwright to navigate OnlyFans pages and extract structured data
- Targets: earnings stats, subscriber counts, message counts, recent activity
- Data flows into existing `of_cache`, `creator_earnings`, `of_fans`, `of_chats` tables
- Runs on pg_cron schedule (earnings every 4h, messages every 5min)
- Uses the same persistent Context so no re-authentication needed

## 7. Security Model

- No OnlyFans credentials are stored in CreatorOS -- admin types them directly into the Browserbase live view (which runs on Browserbase's infrastructure)
- Session ownership enforced via RLS: `creator_session_links.agency_id = get_user_agency_id()`
- Chatter access gated through `session_link_assignments` table
- Edge function validates auth token and checks user permissions before any action
- Session timeouts: absolute 8h for chatter sessions, 1h for admin setup sessions
- All access logged in `session_access_logs` with action, timestamp, chatter_id
- Browserbase Context IDs are server-side only -- never exposed to frontend
- Live view URLs are temporary and session-bound

## 8. Scaling Plan

- **Current**: Start with sequential sessions (1 at a time per creator)
- **50 sessions**: Browserbase handles this natively -- just create more sessions
- **100+ sessions**: Implement session pooling -- idle sessions auto-terminate after 30min
- **Cost control**: Track `active_browser_sessions` duration, alert when monthly usage exceeds thresholds
- **Context reuse**: One Context per creator-platform pair, reused indefinitely
- **Idle timeout**: Edge function sets Browserbase session timeout config (inactive: 1800s for chatters, 600s for admin)
- **Future hybrid**: Can add self-hosted browser option (Multilogin) alongside Browserbase for high-volume agencies

## 9. Implementation Order

### Phase 1: Core Session Flow (this implementation)
1. Create `browserbase-session` edge function with all 5 actions
2. Create `useBrowserSessions` hook
3. Build `EmbeddedBrowserViewer` component
4. Build `AdminSessionLauncher` component
5. Add "Live Sessions" tab to BrowserSync page
6. Build `BrowserSessionsDashboard` for managing sessions
7. Build `ChatterSessionLauncher` for employee portal
8. Register edge function in config.toml

### Phase 2: Polish and Monitoring
9. Add `SessionStatusMonitor` widget
10. Add real-time status updates via Supabase Realtime on `active_browser_sessions`
11. Add session duration tracking and cost estimation
12. Add chatter assignment UI on the sessions dashboard

### Phase 3: Automated Scraping
13. Build `browserbase-scrape` edge function using CDP/Playwright
14. Schedule via pg_cron
15. Feed data into existing analytics tables

### Phase 4: Full Automation
16. Integrate scraping data with Sentinel agent for proactive alerts
17. Add posting/content scheduling through browser automation

## New Files

```text
supabase/functions/browserbase-session/index.ts
src/hooks/useBrowserSessions.ts
src/components/browser/AdminSessionLauncher.tsx
src/components/browser/EmbeddedBrowserViewer.tsx
src/components/browser/BrowserSessionsDashboard.tsx
src/components/browser/ChatterSessionLauncher.tsx
src/components/browser/SessionStatusMonitor.tsx
```

## Modified Files

```text
src/pages/BrowserSync.tsx              -- Add "Live Sessions" tab
src/components/browser/index.ts        -- Export new components
supabase/config.toml                   -- Register browserbase-session function
src/pages/employee/EmployeeOnlyFans.tsx -- Add chatter session launcher
```

