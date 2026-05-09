
# Migrate OnlyFans operations to OnlyFansAPI.com

## Goal

Stop using Browserbase + Stagehand to drive OnlyFans. Use OnlyFansAPI.com's 300+ REST endpoints + webhooks for everything OF-related: account connect, chats, messages, mass DMs, PPV, fans, earnings, vault, posts, transactions. Browserbase stays — but it's repurposed to Instagram, TikTok, X, Threads, and any other social automation that has no clean API.

## Why this is a net win

- No more captcha bypass, fingerprints, proxy rotation, headless restarts, or "session expired" tickets for OF.
- One API key per agency → instant onboarding ("connect account in under 2 minutes").
- Realtime via webhooks instead of XHR interception + cron polling.
- Costs collapse: 25-profile Browserbase concurrency cap stops being a wall.
- Browserbase budget redirects to social channels where it actually creates leverage.

## Scope of the swap (from the codebase audit)

OnlyFans-specific flows that move to OnlyFansAPI:

```text
- Account connect / login              -> POST /api/authenticate (email_password | raw_data | mobile_app)
- Chat list, send, mass DM, PPV         -> /chats, /chat-messages, /mass-messaging
- Earnings + transactions + payouts     -> /payouts/* (replaces cron-scrape-earnings + earnings-parser)
- Fans (active/expired/latest/spend)    -> /fans/* (replaces FanAnalytics scraper)
- Vault + media upload/download         -> /media-vault, /media (used by content-vault sync)
- Posts, queue, stories, promotions     -> dedicated endpoints
- Realtime events                       -> webhooks: messages.received, subscriptions.new/renewed, messages.ppv.unlocked, tips, etc.
- Creator search (3.5M public profiles) -> replaces of-creator-search edge function
```

Browserbase-only flows that stay (renamed mentally to "social automation"):

```text
- Instagram / TikTok / X / Threads sessions (Stagehand)
- Account warming + rehab workflows
- Apify-driven scraping where APIs don't exist
- Social stats sync (sync-social-stats)
```

## Data model changes

New table `of_api_accounts` (one row per connected OF account, scoped by `agency_id` + `creator_id`):

- `of_account_id` (string from OnlyFansAPI), `name`, `auth_type`, `status` (`pending`, `active`, `2fa_required`, `disconnected`), `last_synced_at`, `metadata jsonb`.
- RLS: agency-scoped via `get_user_agency_id()`.

Existing `creator_session_links` keeps its OF rows for backward read-compat for ~2 weeks, then is repurposed to social platforms only (filter `platform != 'onlyfans'`).

New table `of_webhook_events` (raw event log, agency-scoped, 30-day retention via existing maintenance cron):

- `event_type`, `of_account_id`, `payload jsonb`, `processed_at`, `error`.

Optional: extend `creators_earnings`, `fans`, `messages`, `transactions` tables to store `of_account_id` + `source = 'api'` so analytics can compare scraped vs API-sourced rows during the cutover.

## Edge functions

New (replace Browserbase functions one-for-one):

```text
of-connect-account            POST -> /api/authenticate, returns deeplink/2fa state, persists of_api_accounts row
of-list-chats                 proxy with agency-scoped auth
of-send-message               proxy, validates creator ownership + agency
of-mass-message               proxy + audit log
of-sync-earnings              pulls /payouts/earning-statistics + transactions, upserts into earnings tables (replaces cron-scrape-earnings on a schedule)
of-sync-fans                  upserts fan tables (replaces fan-analytics scraper)
of-vault-upload               wraps media upload + post-create
of-search-creators            replaces of-creator-search
of-webhook                    PUBLIC verify_jwt=false, HMAC-verified handler that fans events to of_webhook_events + realtime channels + push notifications
```

Shared lib `_shared/of-api-client.ts`:

- One typed wrapper: `ofFetch(agencyId, ofAccountId, path, init)`.
- Loads `ONLYFANSAPI_KEY` (per-agency in DB if multi-tenant keys, else single platform key from secrets).
- Adds `Authorization: Bearer`, retries with `withRetry`, throws `AppError`.
- Mirrors the Stagehand-helpers convention (one shared lib, all functions import it).

Deprecate (mark, don't delete in v1):

```text
browserbase-session/* (OF code paths only; keep social paths)
cron-scrape-earnings      -> replaced by of-sync-earnings cron
ai-chatter OF send paths  -> route through of-send-message
upload-browserbase-extension (only if extension is purely OF)
```

## Frontend changes

- `OnboardingOFConnectStep` → call `of-connect-account`, show 3 tabs (Email+Password, Cookies, Mobile App QR/deeplink). Drop the embedded browser viewer for OF.
- `EmbeddedBrowserViewer`, `ChatterSessionLauncher`, `BrowserSessionPanel`, `ActiveSessionBanner` → keep code, gate visibility to `platform !== 'onlyfans'`. The "session" concept disappears for OF.
- `CreatorMessages`, `CreatorEarnings`, `FanAnalytics`, `CreatorContentVault`, content plans → swap data hooks to call new edge functions / read from refreshed tables.
- `CreatorPlatformAccounts` → new "OnlyFans (API)" status pill (Connected / 2FA needed / Disconnected) with a one-click reconnect.
- `BrowserSessionsDashboard` → rename to "Social Sessions"; remove OF rows.
- Command palette + nav copy: "OnlyFans" actions stop opening browser sessions; they hit the API directly.

## Webhook pipeline

1. Configure one webhook URL per environment in OnlyFansAPI dashboard: `https://<project>.functions.supabase.co/of-webhook`.
2. Subscribe to: `messages.received`, `messages.sent`, `messages.ppv.unlocked`, `subscriptions.new`, `subscriptions.renewed`, `subscriptions.expired`, `tips.received`, `posts.published`, `payouts.completed`.
3. `of-webhook` verifies HMAC, writes to `of_webhook_events`, then:
   - upserts message/fan/transaction rows,
   - emits Supabase Realtime payload on `of:agency:<id>` channel,
   - triggers `send-push-notification` for high-priority events (PPV unlock, tip).

## Secrets

Required:

- `ONLYFANSAPI_KEY` (platform key) — add via secrets tool.
- `ONLYFANSAPI_WEBHOOK_SECRET` — add via secrets tool.

If we need per-agency billing isolation later, store agency-level keys in a new `agency_integrations` table (encrypted column) and have `ofFetch` resolve them per `agencyId`.

## Cutover plan (4 phases, can ship phase-by-phase)

1. **Foundations** — secrets, `of_api_accounts` table, `_shared/of-api-client.ts`, `of-connect-account`, new onboarding UI. No reads break; old Browserbase OF paths still work.
2. **Reads** — `of-sync-earnings`, `of-sync-fans`, `of-list-chats`. Switch dashboards/analytics to new sources behind a feature flag (`use_of_api`) per agency. Backfill for existing creators.
3. **Writes + realtime** — `of-send-message`, `of-mass-message`, `of-vault-upload`, `of-webhook`. Cut chatter UI to API. Disable OF cron scrape jobs.
4. **Decommission** — remove OF code from Browserbase functions and frontend session components, drop unused tables/cron, update memory + docs. Browserbase reframed in nav as "Social Automation".

## Risks / open questions

- **Per-agency vs platform key.** Single platform key is cheapest and simplest; per-agency keys are needed only if billing must be passed through to each agency.
- **Existing connected creators.** The `mobile_app` deeplink is the smoothest reconnect; we'll send creators a one-tap link from their portal during phase 1.
- **Mass-DM rate limits.** Need to honor OnlyFansAPI's per-account caps; `of-mass-message` should enqueue to `scrape_jobs`-style queue (rename to `of_jobs`) instead of fire-and-forget.
- **AI chatter integration.** `ai-chatter` currently composes replies + sends via browser. After the swap, the send path becomes a function call; the AI prompt stays the same.
- **Backfill cost.** First sync per creator pulls full history; do it in chunks via the queue.

## Out of scope (this plan)

- Building OnlyFansAPI billing UI for agency owners (handled later if we adopt per-agency keys).
- Replacing the AI assistant prompts.
- Touching the social/Instagram/TikTok automation surface beyond renaming.
