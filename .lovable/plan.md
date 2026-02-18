

# Browser Profile Warmup System

## Overview
Build a "Profile Builder" feature that warms up each creator's Browserbase context by running automated browsing sessions through common websites. This builds realistic cookies, browsing history, and fingerprint credibility so that when OnlyFans (or other platforms) see the browser, it looks like a real person's device rather than a freshly created automation profile.

With 25 concurrent sessions on your plan, you can warm up all creators in parallel.

## How It Works

1. **New "Profile Warmup" tab** on the Browser page lets you see each creator's profile health and trigger warmups
2. Clicking "Warm Up" (or "Warm Up All") launches a headless-style session per creator that:
   - Reuses their existing Browserbase context (cookies persist)
   - Visits a curated list of popular sites (Google, YouTube, Reddit, Twitter, Instagram, Amazon, Wikipedia, etc.)
   - Spends 5-10 seconds per site (scrolling/clicking) to generate realistic cookies and history
   - Auto-closes after the warmup run (~2-3 minutes per profile)
3. Profile warmup status is tracked in a new database table so you can see last warmup date and run count

## Warmup Site List (built-in)
- google.com (search something random)
- youtube.com
- reddit.com
- twitter.com/x.com
- instagram.com
- amazon.com
- wikipedia.org
- espn.com
- weather.com
- netflix.com

These sites build diverse, realistic cookies that make the browser profile indistinguishable from a regular user's browser.

## Changes Required

### 1. Database: New `creator_profile_warmups` Table
Tracks warmup history per creator context:
- `id`, `creator_id`, `agency_id`
- `browserbase_context_id`
- `status` (pending, running, completed, failed)
- `sites_visited` (integer count)
- `started_at`, `completed_at`
- `error_message` (nullable)
- `created_at`

### 2. Edge Function: New `warmup_profiles` Action
Added to the existing `browserbase-session` edge function:
- Accepts `creatorIds` (array) or runs for all creators in the agency
- For each creator:
  - Creates a short-lived session (5-min timeout) using their existing context with `persist: true`
  - Uses CDP (WebSocket) to navigate through the warmup URLs sequentially
  - Waits 5-8 seconds per site for cookies to set
  - Sends `REQUEST_RELEASE` when done to persist everything back to context
  - Updates the `creator_profile_warmups` table with results
- Processes creators sequentially (to stay within rate limits) but can be called for batches

### 3. Frontend: New "Profile Builder" Tab
Added to the Browser Sync page (`/browser-sync`):
- Shows a card per creator with:
  - Profile health indicator (never warmed / last warmed X ago / healthy)
  - Context ID badge
  - "Warm Up" button per creator
  - "Warm Up All" bulk action button
- Progress indicators during warmup (sites visited / total)
- History of past warmup runs

### 4. Files to Create/Modify
- **New**: Migration for `creator_profile_warmups` table
- **Modified**: `supabase/functions/browserbase-session/index.ts` -- add `warmup_profiles` and `warmup_single_profile` actions
- **New**: `src/components/browser/ProfileWarmupManager.tsx` -- the UI component
- **New**: `src/hooks/useProfileWarmups.ts` -- data fetching hook
- **Modified**: `src/pages/BrowserSync.tsx` -- add the new tab

## Technical Details

### Warmup CDP Flow (per creator)
```text
1. Create session with creator's context (persist: true, timeout: 300s)
2. Connect via WebSocket (CDP)
3. For each warmup URL:
   a. Page.navigate(url)
   b. Wait 5-8 seconds
   c. Optional: Runtime.evaluate("window.scrollTo(0, 500)") for scroll activity
4. REQUEST_RELEASE session (persists cookies back to context)
5. Update warmup record status = "completed"
```

### Proxy Configuration
Warmup sessions use the same proxy settings as the creator's regular sessions (same geo/IP) to ensure cookie consistency.

### Concurrency
The edge function processes one creator at a time per invocation to avoid overwhelming the Browserbase API. The frontend can fire multiple invocations in parallel (up to 25 concurrent) for bulk warmup.
