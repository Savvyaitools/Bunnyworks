

# Embedded Browser Sessions with Browserbase

## Overview
Replace the current Hyperbeam-based backend with Browserbase to launch cloud browser sessions directly inside your SaaS. You'll be able to open social platforms, log in, save the session profile (Context), and let employees work within the embedded browser -- all without leaving Creator OS.

## What You Already Have
- **Browserbase API key and Project ID** are already configured as secrets
- **Database tables** (`creator_session_links`, `active_browser_sessions`) already use `browserbase_*` column names -- perfect match
- **Hyperbeam edge function** exists but needs to be rewritten for Browserbase's API
- **`@hyperbeam/web` SDK** is installed but won't be needed -- Browserbase uses a simple iframe embed

## What Will Be Built

### 1. Rewrite the Backend Function
Replace the `hyperbeam-session` edge function with a new `browserbase-session` edge function that uses Browserbase's REST API:

- **Create admin session**: Creates a Browserbase session + Context for profile persistence, returns a live view URL for embedding
- **Save profile**: Closes the session with `persist: true` so cookies/auth are saved to the Context
- **Launch employee session**: Creates a new session loading the saved Context (employee gets a pre-authenticated browser)
- **Terminate session**: Ends the session via API
- **Get status**: Checks if a session is still running

### 2. Embedded Browser Component
A reusable `EmbeddedBrowser.tsx` component that renders the Browserbase live view inside an iframe. No SDK needed -- Browserbase provides a `debuggerFullscreenUrl` that works directly in an iframe with read/write interaction.

### 3. Admin Session Launcher
A modal accessible from the Creator detail page (Accounts tab) that:
- Lets the admin pick a platform (OnlyFans, Fansly)
- Opens an embedded browser to log in
- "Save and Close" button persists the session profile

### 4. Browser Sessions Dashboard (`/browser-sessions`)
A new page showing:
- All creator accounts with saved browser profiles
- "Launch Browser" button per creator to open an embedded session
- Active session monitoring with terminate controls
- Session history and status indicators

### 5. Navigation and Routing
- Add "Browser Sessions" link to the sidebar under the "OnlyFans" section
- Register `/browser-sessions` as a protected route

## Session Flow

```text
Admin Login (one-time per creator account):
  1. Admin clicks "Launch Browser" on creator's account card
  2. Edge function creates Browserbase Context + Session
  3. Live view iframe appears in a modal
  4. Admin logs into the social platform
  5. Admin clicks "Save Profile" --> session closes, Context persisted
  6. Context ID stored in creator_session_links

Employee Working Session:
  1. Employee clicks "Open [Platform]" 
  2. Edge function creates session loading saved Context
  3. Embedded browser appears with platform already logged in
  4. Employee works directly on the platform
  5. Session terminates on close or timeout
```

## Technical Details

### Browserbase API Calls (edge function)

```text
Create Context:
  POST https://api.browserbase.com/v1/contexts
  Headers: X-BB-API-Key
  Body: { projectId: "..." }
  Returns: { id: "context-id" }

Create Session:
  POST https://api.browserbase.com/v1/sessions
  Headers: X-BB-API-Key
  Body: { projectId, browserSettings: { context: { id, persist: true } } }
  Returns: { id: "session-id", connectUrl, seleniumRemoteUrl }

Get Live View URL:
  GET https://api.browserbase.com/v1/sessions/{id}/debug
  Returns: { debuggerFullscreenUrl: "..." }

Terminate Session:
  POST https://api.browserbase.com/v1/sessions/{id}
  Body: { status: "REQUEST_RELEASE", projectId }
```

### Frontend Iframe Embed

```text
<iframe
  src="{debuggerFullscreenUrl}"
  sandbox="allow-same-origin allow-scripts"
  allow="clipboard-read; clipboard-write"
  class="w-full h-full rounded-lg"
/>
```

### New Files
```text
supabase/functions/browserbase-session/index.ts  -- New edge function
src/components/browser/EmbeddedBrowser.tsx        -- Iframe wrapper
src/components/browser/AdminSessionLauncher.tsx   -- Login modal
src/components/browser/SessionCard.tsx            -- Status card per creator
src/pages/BrowserSessions.tsx                     -- Dashboard page
```

### Modified Files
```text
src/components/layout/AppSidebar.tsx              -- Add sidebar link
src/App.tsx                                       -- Add route
supabase/config.toml                              -- Register new function
```

### Database
No migration needed -- the existing `creator_session_links` table already has `browserbase_context_id`, `browserbase_session_id`, and `browserbase_live_url` columns that match perfectly.

## Security
- Only agency admins can create admin sessions (auth verified server-side)
- Employees can only access sessions they are assigned to via `session_link_assignments`
- All session access is logged to `session_access_logs`
- Browserbase Contexts store credentials in encrypted storage -- credentials never pass through your app
- Sessions have configurable timeouts

