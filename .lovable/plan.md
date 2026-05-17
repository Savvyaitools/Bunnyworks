
# Pre-Launch Integration & Repurposing Plan

## 1. BunnyChat Arcade (rename + reorganize)

- Rename `Messages Pro` → **BunnyChat Arcade** everywhere it appears:
  - `src/components/layout/AppSidebar.tsx` (label + icon → `Gamepad2`)
  - `src/components/layout/MobileBottomNav.tsx`
  - `src/components/layout/CommandPalette.tsx`
  - `src/pages/MessagesPro.tsx` page title + meta tags
  - Top bar component header (`MessagesProTopBar.tsx`)
- Move from "main nav" into the **Operations** collapsible section as the **first** item (above Platform Access, Shift Roster, Team Chat).
- Keep the route path `/messages-pro` (so deep links don't break) but add a redirect alias `/bunnychat` → `/messages-pro` in `routes/AppRoutes.tsx`.
- Apply the existing arcade-orange accent (already scoped via `--mp-accent`) more prominently in the top bar.

## 2. OnlyFansAPI integration — full wiring

Backend (already deployed): `of-connect-account`, `of-list-chats`, `of-list-messages`, `of-send-message`, `of-creator-search`, `of-webhook`, plus shared `_shared/of-api-client.ts`.

New / updated edge functions to add:
- `of-sync-account` — single function that hydrates `of_chats`, `of_fans`, `of_subscribers`, `of_earnings`, `of_posts` for one `of_account_id`. Called by:
  - the connect flow (initial seeding)
  - a new cron (every 5 min)
  - manual "Refresh" buttons in UI
- `of-mass-message` — sends DM/PPV to a list of fan IDs with rate-limit pacing.
- `of-vault-upload` — uploads media from `content-vault` bucket to OF via API for PPV.
- `of-post-publish` — schedules / publishes feed posts (wired to Calendar + Content Plans).

Frontend wiring:

| Section | Current state | Wire to OF API |
|---|---|---|
| **BunnyChat Arcade** | Reads from `of_chats`/`of_messages` ✓ | Add: typing indicator polling, mark-as-read on open, mass-message dialog, PPV composer with vault picker, fan tip history pulled live. |
| **Creator → Platform Accounts** | Has `OFConnectDialog` ✓ | Add status pill (last sync, reconnect button, disconnect). Show subscriber count from API. |
| **Creator → Earnings** | Browserbase scrape | Replace with `of-sync-account` earnings pull. Drop the manual "Scrape now" button, replace with "Refresh from OF". |
| **Fan Analytics** | Mostly scraped data | Source from `of_fans` + `of_subscribers` tables hydrated by OF API. |
| **Calendar / Content Plans** | Local-only | Add "Publish to OF" action → `of-post-publish`. |
| **Dashboard** | Mix of scraped + manual | Live MRR, new-subs-today, PPV revenue widgets fed from OF API tables. |
| **Notifications** | Internal only | New `of-webhook` events → notifications row (new tip, new PPV unlock, new subscriber). |

AI agents wired to OF API tools (via `_shared/of-api-client.ts`):
- **Izzy** (chat suggest) — already context-aware; add tool calls: `get_fan_history`, `get_open_ppv`, `suggest_upsell`.
- **Marylin** (auto-reply / chatter) — gains `of-send-message` as a tool.
- **Felix** (analytics Q&A) — query `of_earnings`, `of_subscribers` directly.
- **Flick** (content manager) — `of-post-publish` + content plan sync.
- **Tatum** (social references) — unchanged.

## 3. Repurpose Browserbase → AI Virtual Assistant runtime

Strip OF browser automation, keep the Browserbase infrastructure as a generic **AI VA browser sandbox**:

- Delete: `cron-scrape-earnings`, `upload-browserbase-extension`, `_shared/stagehand-helpers.ts` OF-specific flows, `useBrowserSessions` OF code paths, `ChatterSessionLauncher`, `EmployeeBrowserSessions` page (OF login flow), OF entries in `creator_session_links`.
- Rebuild `browserbase-session` edge function as a thin **agent task runner**:
  - Actions: `start_va_task`, `stop_va_task`, `va_status`, `va_screenshot`.
  - Tasks are JSON: `{ goal: string, url?: string, max_steps: number }` executed via Stagehand NL instructions.
- New table `va_tasks` (agency-scoped): id, agency_id, created_by, goal, status, log, result, started_at, finished_at, browserbase_session_id.
- New page `/operations/va-agents` ("VA Agents") with:
  - Task composer (goal + optional starting URL)
  - Live session viewer (existing `EmbeddedBrowserViewer`, repurposed)
  - History of past runs
- Use cases shipped on day 1: outreach DMs on Instagram/X, posting tweets, lead enrichment lookups, captcha-aware account warming.
- Sidebar: rename "Platform Access" → **VA Agents** under Operations.

## 4. Self-healing automation AI agent

New edge function `ai-ops-medic`:
- Triggered every 5 min by pg_cron + on-demand from a "Run diagnostic" button.
- Inspects: `scrape_jobs` failures, `va_tasks` errors, `of_connection_status='error'` accounts, recent edge function error logs (via `supabase_functions` logs view).
- Calls Lovable AI (`google/gemini-3-flash-preview`) with a tool set:
  - `retry_va_task(id)`
  - `reconnect_of_account(of_account_id)`
  - `reset_stale_scrape_lock(job_id)`
  - `notify_owner(agency_id, message)` — only escalates when auto-fix exhausts retries.
- Writes outcomes to new `ops_medic_log` table; surfaced in Settings → System Health.
- Hard-cap: 3 auto-retries per resource per 24h to prevent loops.

## 5. Error handling pass (global)

- Adopt the existing `src/core/errors.ts` `AppError` + `withRetry` in every hook that currently swallows errors (e.g. `useOfAccounts`, `useOfChats`, `useOfMessages`, `useBrowserSessions`).
- Add a `<RouteErrorBoundary>` wrapper inside `routeConfig.tsx` so a thrown render error in one page doesn't blank the shell.
- Standardise edge function returns to `{ ok: boolean, data?, error?: { code, message, hint? } }` and have the frontend `withRetry` understand 429/5xx vs 4xx.
- Toast policy: 4xx = single toast with hint; 5xx = retry silently 2x, then toast; network = offline banner.

## 6. Redundant code purge (launch hardening)

Files to delete:
- `src/lib/browserbase.ts` (replaced by `va-agent.ts` helper)
- `src/hooks/useBrowserFeatures.ts` (OF-specific warmups)
- `src/hooks/useSessionHeartbeat.ts` (move heartbeat inside VA hook)
- `supabase/functions/cron-scrape-earnings/`
- `supabase/functions/upload-browserbase-extension/`
- `chrome-extension/` and `chrome-extension-permissions/` (no longer needed — OF API replaces it)
- `src/components/browser/CaptchaAlertsFeed.tsx` (Browserbase only)
- Any unused shadcn primitives flagged earlier (carousel, drawer, menubar, breadcrumb) **only if** still uncalled after refactor.

Migrations:
- Drop columns `browserbase_context_id`, `browserbase_session_id`, `browserbase_live_url` from `creator_session_links` once VA refactor lands. Keep table for VA tasks linking.
- Drop `cron-scrape-earnings` schedule from `cron.job`.

## 7. Technical details

```text
ROUTING
  /messages-pro  → BunnyChat Arcade (canonical)
  /bunnychat     → redirect to /messages-pro
  /operations/va-agents → new VA runner page

SIDEBAR ORDER (Operations group)
  1. BunnyChat Arcade
  2. VA Agents          (was Platform Access)
  3. Shift Roster
  4. Team Chat

NEW EDGE FUNCTIONS
  of-sync-account, of-mass-message, of-vault-upload,
  of-post-publish, ai-ops-medic
  (all verify_jwt=true except ai-ops-medic which uses cron + service role)

NEW TABLES
  va_tasks      (agency_id, goal, status, log jsonb, result jsonb, bb_session_id)
  ops_medic_log (agency_id, target_type, target_id, action, outcome, ai_reasoning)

CRON
  */5 * * * *  of-sync-account (per connected account, batched)
  */5 * * * *  ai-ops-medic

REUSED SHARED MODULES
  _shared/of-api-client.ts    — OF REST + retry
  _shared/ai-client.ts        — Lovable AI gateway wrapper
  _shared/stagehand-helpers.ts — kept, used by VA runner only
```

## Execution order (when you say go)

1. Rename + sidebar move (low risk, quick win)
2. Add `of-sync-account` + wire Earnings/Dashboard/Fan Analytics
3. BunnyChat Arcade upgrades (mass message, PPV composer, mark-read)
4. Browserbase refactor → VA Agents
5. `ai-ops-medic` + error-handling pass
6. Dead-code purge + final lint/build

Estimated 6 phases; each ships independently and is safe to verify in preview before the next.
