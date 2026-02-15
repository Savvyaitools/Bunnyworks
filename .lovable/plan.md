

# Streamlined Employee Portal with Permission-Based Browser Restrictions

## Overview

Simplify the employee portal by removing redundant pages (since employees now work directly via browser sessions) while enforcing role-based access restrictions inside browser sessions using a Chrome extension that blocks specific OnlyFans pages based on each employee's permissions.

---

## What Changes

### 1. Employee Portal Cleanup

**Remove these pages** (redundant with browser session access):
- `/employee/onlyfans` (EmployeeOnlyFans) -- API-based chats/fans/earnings, replaced by browser
- `/employee/creator-messages` (EmployeeCreatorMessages) -- in-app creator messaging, not needed

**Keep these pages:**
- `/employee` (Dashboard) -- home with clock-in, quick actions
- `/employee/team-chat` (Team Chat) -- internal team messaging
- `/employee/browser` (Browser Sessions) -- the primary work interface
- `/employee/performance` (Stats) -- performance metrics
- `/employee/shifts` (Shifts) -- shift schedule
- `/employee/time-logs` (Time Logs) -- clock in/out history

**Updated navigation** (bottom nav, 5 items):
- Home | Team Chat | Browser | Stats | Shifts

### 2. Dashboard Simplification

Update the EmployeeDashboard quick actions to remove OnlyFans references and make "Browser Sessions" the primary action button.

### 3. Permission-Based URL Blocking in Browser Sessions

This is the most significant part. When a chatter launches a browser session, their `employee_of_permissions` flags determine which OnlyFans pages they can access.

**How it works:**

```text
+------------------+     +-----------------------+     +---------------------+
| Employee clicks  | --> | Edge function reads   | --> | Browserbase session |
| "Open" on a      |     | permissions from DB,  |     | launched with       |
| creator session   |     | encodes as JSON,      |     | extension injected  |
|                   |     | injects via extension |     | that blocks URLs    |
+------------------+     +-----------------------+     +---------------------+
```

**Permission-to-URL mapping:**

| Permission Flag | Allowed OF Pages | Blocked If False |
|---|---|---|
| `can_view_chats` / `can_send_messages` | `/my/chats/*` | Chat/DM pages |
| `can_view_fans` | `/my/subscribers/*`, `/my/fans/*` | Subscriber lists |
| `can_view_earnings` | `/my/banking/*`, `/my/statistics/*`, `/my/statements/*` | Earnings/stats |
| `can_view_posts` / `can_create_posts` | `/my/posts/*`, `/my/vault/*` | Content pages |
| `can_view_vault` | `/my/vault/*` | Vault/media library |

---

## Technical Details

### Step 1: Create Permission-Enforcing Extension

Create a new Chrome extension (`chrome-extension-permissions/`) that:
- Reads permission rules from `window.__CREATOROS_PERMISSIONS__` (injected via Browserbase extension config or a startup script)
- Monitors `window.location` changes and blocks navigation to disallowed OnlyFans paths
- Shows a styled overlay ("Access Restricted -- You don't have permission to view this section") instead of the blocked page

### Step 2: Update Edge Function (`browserbase-session`)

Modify the `launch_chatter_session` action to:
- Read the full `employee_of_permissions` row (not just check existence)
- Pass the permission flags as `userMetadata` on the Browserbase session
- Inject a startup script that sets `window.__CREATOROS_PERMISSIONS__` with the employee's flags before the page loads

### Step 3: Update `ChatterSessionLauncher` Component

- Pass the employee's permissions alongside the session launch
- Show permission badges on each creator card (e.g., "Chat Only", "Full Access")
- After launch, display a small permission summary banner in the `EmbeddedBrowserViewer`

### Step 4: Update `EmbeddedBrowserViewer`

- Accept an optional `permissions` prop
- Show a toolbar badge summarizing what the employee can do (e.g., "Chats + Fans" or "Chat Only")

### Step 5: Remove Redundant Pages and Routes

- Delete `/employee/onlyfans` and `/employee/creator-messages` routes from `App.tsx`
- Update `EmployeeLayout.tsx` bottom nav to 5 items
- Update `EmployeeDashboard.tsx` quick actions
- Update `src/pages/employee/index.ts` exports
- Clean up unused imports

### Step 6: Database Addition

Add a `browser_permission_rules` column or use the existing `employee_of_permissions` flags (no schema change needed -- the existing boolean columns are sufficient).

---

## Files to Create
- `chrome-extension-permissions/manifest.json` -- extension manifest
- `chrome-extension-permissions/content.js` -- URL blocking logic
- `chrome-extension-permissions/blocked.html` -- styled blocked-page overlay

## Files to Modify
- `supabase/functions/browserbase-session/index.ts` -- inject permissions into chatter sessions
- `src/components/browser/ChatterSessionLauncher.tsx` -- show permission badges, pass permissions
- `src/components/browser/EmbeddedBrowserViewer.tsx` -- show permission summary banner
- `src/components/employee/EmployeeLayout.tsx` -- remove nav items
- `src/pages/employee/EmployeeDashboard.tsx` -- update quick actions
- `src/pages/employee/index.ts` -- remove exports
- `src/App.tsx` -- remove routes

## Files to Delete
- `src/pages/employee/EmployeeOnlyFans.tsx`
- `src/pages/employee/EmployeeCreatorMessages.tsx`
- `src/pages/employee/EmployeeMessages.tsx`

