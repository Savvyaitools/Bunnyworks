
# Switch to OnlyFansAPI.com + ship an Infloww-style chat console

## Goal

Two parallel tracks, one product:

1. **Infrastructure swap** — every OnlyFans operation moves from Browserbase/Stagehand to OnlyFansAPI.com REST + webhooks. Browserbase is repurposed to Instagram/TikTok/X/Threads automation only.
2. **Chatting console** — a new "Messages Pro"-style 3-pane interface (creators ▸ chats ▸ conversation) modeled after Infloww, powered entirely by the API. Becomes the primary daily surface for chatters.

## Track 1 — OnlyFansAPI.com migration

### Surface map (what moves)

```text
Account connect            -> POST /api/authenticate (email_password | raw_data | mobile_app deeplink/QR)
Chat list / messages       -> /chats, /chat-messages
Send message + PPV + media -> /chat-messages/send (rate-limit aware)
Mass DM                    -> /mass-messaging
Earnings + transactions    -> /payouts/* (replaces cron-scrape-earnings)
Fans (active/expired/spend)-> /fans/* (replaces FanAnalytics scraper)
Vault + media upload       -> /media-vault, /media
Posts / queue / stories    -> dedicated endpoints
Realtime                   -> webhooks: messages.received/sent, ppv.unlocked, subs.new/renewed/expired, tips, posts, payouts
Public creator search      -> replaces of-creator-search
```

Stays on Browserbase: Instagram, TikTok, X, Threads, Apify-driven scraping, social stats sync, account warming.

### Data model

New tables (all RLS-scoped to `agency_id`):

- `of_api_accounts` — `creator_id`, `of_account_id`, `of_username`, `auth_type`, `status` (`pending|active|2fa_required|disconnected`), `last_synced_at`, `metadata jsonb`.
- `of_chats` — `of_account_id`, `fan_id` (string from API), `fan_username`, `fan_name`, `fan_avatar_url`, `last_message_at`, `last_message_preview`, `unread_count`, `lifetime_spend numeric`, `is_subscribed bool`, `subscribed_until`, `tags text[]`, `pinned bool`.
- `of_messages` — `chat_id`, `of_message_id` (unique), `direction` (`in|out`), `body`, `price numeric`, `is_ppv bool`, `is_unlocked bool`, `media jsonb`, `sent_by_user_id`, `created_at`, `read_at`.
- `of_fans` — durable fan profile per `of_account_id` + `fan_id`, includes spend, subscription state, source.
- `of_webhook_events` — raw event log, 30-day retention via existing maintenance cron.
- `of_quick_replies` — agency-scoped saved scripts/snippets with variables.
- `of_jobs` — outbound queue (mass DM, batch sync) using the same `FOR UPDATE SKIP LOCKED` pattern as `scrape_jobs`.

### Edge functions (new)

```text
of-connect-account     POST /api/authenticate; persists of_api_accounts; returns 2FA / mobile deeplink state
of-list-chats          paginated proxy + DB upsert into of_chats
of-list-messages       paginated proxy + DB upsert into of_messages
of-send-message        validates ownership, posts to API, optimistic insert into of_messages
of-mass-message        enqueues into of_jobs, processed by of-jobs-worker
of-jobs-worker         claim_jobs() pattern, respects per-account rate limits
of-sync-earnings       /payouts/* -> earnings tables (replaces cron-scrape-earnings)
of-sync-fans           /fans/* -> of_fans
of-vault-upload        wraps media upload + post create
of-search-creators     replaces of-creator-search
of-webhook             PUBLIC verify_jwt=false, HMAC-verified, fans events to DB + Realtime + push
```

Shared lib `_shared/of-api-client.ts` mirrors `stagehand-helpers.ts` convention: one typed `ofFetch(agencyId, ofAccountId, path, init)` wrapper using `withRetry` + `AppError`.

Deprecate (mark, don't delete in v1): OF code paths in `browserbase-session/*`, `cron-scrape-earnings`, OF send paths in `ai-chatter`, `upload-browserbase-extension` (if OF-only).

### Secrets

- `ONLYFANSAPI_KEY` — platform API key (single key v1).
- `ONLYFANSAPI_WEBHOOK_SECRET` — HMAC verification.

Per-agency keys later via an `agency_integrations` table if billing pass-through is needed.

### Cutover phases

1. Foundations: secrets, tables, shared client, `of-connect-account`, new connect UI.
2. Reads: earnings/fans/chats sync behind `use_of_api` per-agency feature flag, with backfill.
3. Writes + realtime: send/mass-DM/vault/webhook + chat console wired up; OF cron disabled.
4. Decommission: strip OF from Browserbase functions and frontend session components, drop unused tables/cron, refresh memory + docs. Browserbase nav becomes "Social Automation".

## Track 2 — Infloww-style "Messages Pro" console

### Layout

```text
+--------+--------------------+--------------------------------+--------------+
| Creator | Chats list          | Conversation                   | Fan profile  |
| switcher| (search, filters,   | (sticky header w/ fan info,    | (lifetime    |
| (avatars| tabs, pinned)       | scrollable timeline,           | spend, subs, |
| + status|                     | composer w/ PPV+media+price)   | tags, notes, |
| pills)  |                     |                                | quick acts)  |
+--------+--------------------+--------------------------------+--------------+
```

Routes under `/messages-pro` (keep `/messages` until cutover).

### Components (new under `src/components/messages-pro/`)

- `CreatorRail` — vertical avatar list, online/2FA badges, unread totals.
- `ChatList` — virtualized list (react-window). Search, tabs (All / Unread / Subscribed / Expired / VIP / Tipped), sort (recent / spend / unread), filter chips (price-range, last-message age, has-PPV-unread, online), bulk-select for mass DM.
- `ChatListItem` — avatar, name + @username, last message preview, lifetime spend, unread badge, time, pinned indicator.
- `ConversationHeader` — fan avatar + name, online dot, lifetime spend, subscription state, "open in OF" link, "AI suggest" toggle.
- `MessageTimeline` — virtualized, day separators, infinite scroll backwards, image/video thumbnails, locked PPV state, tip badges, read receipts, optimistic pending state.
- `Composer` — multiline textarea with autoresize, emoji picker, attach (vault picker + upload), PPV toggle (price input), schedule (date/time), expire-after (free-trial PPV), quick-reply slash menu (`/`), AI suggest button (calls `ai-chatter` and inserts), character counter, send button with rate-limit hint.
- `VaultPickerDialog` — grid from `of-list-vault-media`, multi-select, search, type filter.
- `FanSidebar` — lifetime spend, subscription dates, recent purchases, tags editor, internal notes (agency-scoped), quick actions (block, restrict, refund request, mark VIP, add to list).
- `QuickRepliesManager` — CRUD over `of_quick_replies`, variables `{fan_name}`, `{creator_name}`.
- `MassDMComposer` — drawer reusing Composer + audience selector (filters from ChatList) + dry-run count + confirm; submits to `of-mass-message`.

### Real-time

- Subscribe to Postgres changes on `of_messages` and `of_chats` filtered by current `of_account_id` (Realtime publication add).
- `of-webhook` writes to those tables; client receives instant updates, no polling.
- Composer optimistic insert; reconciled via webhook id.

### Hooks

- `useOfAccounts(creatorId?)` — list connected accounts, switcher state.
- `useOfChats(ofAccountId, filters)` — server-side pagination + Realtime patching.
- `useOfMessages(chatId)` — backward infinite scroll + Realtime.
- `useSendOfMessage()` — mutation with optimistic update + retry.
- `useVaultMedia(ofAccountId)` — paginated.
- `useFanProfile(chatId)` — fan + tags + internal notes.

All built on `useAgencyScopedCRUD` / `useSupabaseCRUD` per project convention.

### AI integration

- "Suggest reply" button → existing `ai-chatter` function, but receives full message history from `of_messages` (no scraping). Output goes into composer for review (never auto-send).
- Auto-tag / sentiment scoring on incoming messages via webhook → store on `of_messages`.

### Permissions

- Reuse existing chatter assignment table: a chatter only sees creators they're assigned to. Owners see all.
- Audit log row on every send/mass-DM (who, when, fan, body hash).

### Performance

- react-window for both chat list and message timeline.
- React Query with `staleTime: 30s`, Realtime invalidation per chat.
- Image lazy load, blurhash placeholder where API provides it.
- Code-split `/messages-pro` route.

## Risks / open questions

- OnlyFansAPI rate limits per account → `of-jobs` worker required for mass DM; warn in UI before send.
- Existing chatter habits → keep `/messages` live in parallel for one release cycle, default new users to `/messages-pro`.
- Migration of historical scraped messages → optional one-time backfill per creator.
- Mobile chatter UX → second iteration after desktop console ships.

## Out of scope (this plan)

- Per-agency API key billing UI.
- AI prompt rewrites.
- Native mobile app.
