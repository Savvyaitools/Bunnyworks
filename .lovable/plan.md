
# Messages Pro — Infloww + OnlyMonster-style chat console

Goal: build the OnlyFans messaging surface as an "advanced OnlyFans page" that feels like Infloww's Message Dashboard / OnlyMonster's chatter workspace, powered by OnlyFansAPI.com. This plan covers ONLY the UI + the hooks/realtime needed to make it feel real. Backend edge functions already exist (`of-list-chats`, `of-list-messages`, `of-send-message`, `of-webhook`).

## Reference (what we're matching)

**Infloww Messages Pro / Message Dashboard**
- Dark theme, rounded cards, orange accent, dense rows.
- Each chat row shows: avatar, name, "Sent X · Purchased Y · Earnings $Z", last-message preview, time.
- Manager-style overview: filter by employee/chatter, sensitive-word flags, sales attribution per message.

**OnlyMonster chatter workspace**
- Detachable Fan Notes widget (right side) — fan score 0–5, custom notes/tags, purchase history.
- Speed Chatting Mode: slash-templates, hotkeys, "press Enter to send", queue next chat after send.
- Media Hub: tagged/priced vault items, drag into composer.
- Chargeback % badge on risky fans, AI fan-score chip (whale tiers).

## Layout

Looks like an OF page itself, not a generic CRM. Pure-black canvas, glass panels, electric accent.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  TopBar: [Creator switcher ▾] [Online dot] [Unread totals] [Filters] [⚙ Speed mode] [AI] │
├────────┬────────────────────────┬─────────────────────────────────┬──────────────────────┤
│ Rail   │ ChatList               │ Conversation                    │ FanSidebar           │
│ 64px   │ 320–360px              │ flex-1                          │ 320px (collapsible)  │
│        │                        │                                 │                      │
│ avatar │ Tabs: All · Unread ·   │ Sticky header:                  │ Avatar + @username   │
│ stack  │ Subscribed · VIP ·     │   avatar · name · spend · subs  │ Whale score 🐳 0–5   │
│ per OF │ Expired · Tipped ·     │   "Open in OF" · ⋯              │ Lifetime $           │
│ acct   │ Flagged                │                                 │ Subs: active/expires │
│ +unread│                        │ Timeline (virtualized):         │ Last seen            │
│ badge  │ Search + filter chips: │   day separators                │                      │
│ status │  price range, age,     │   in/out bubbles                │ Tags (chips, +)      │
│ pill   │  has-PPV-unread,       │   PPV cards (locked / paid)     │ Internal notes (rich)│
│        │  online, whale tier    │   tip badges, media thumbs      │                      │
│        │                        │   read receipts, pending dot    │ Purchase history     │
│        │ Bulk-select toolbar    │                                 │ Recent media bought  │
│        │  → Mass DM             │ Composer:                       │                      │
│        │                        │   textarea (autoresize)         │ Quick actions:       │
│        │ ChatListItem rows:     │   row1: 📎 vault · 😀 emoji ·   │  Block · Restrict ·  │
│        │  avatar (online dot)   │          GIF · 🎤 voice         │  Refund · ⭐ VIP ·   │
│        │  Name · @user          │   row2: 💎 PPV $__ · ⏱ schedule│  Add to list         │
│        │  Spent $ · Sent N      │          · ⏳ expire · /scripts │                      │
│        │  Last msg preview      │   send button + rate-limit dot  │ Chargeback %         │
│        │  • unread badge        │                                 │ AI Suggest panel     │
│        │  📌 pinned · 🚩 flag   │ AI suggestion bar (slides up    │  (3 reply variants,  │
│        │  time                  │  above composer when toggled)   │   tone selector)     │
│        │                        │                                 │                      │
└────────┴────────────────────────┴─────────────────────────────────┴──────────────────────┘
```

Mobile (<md): Rail collapses to top creator dropdown; only one pane visible at a time (ChatList → Conversation → FanSidebar drawer).

## Components (new, under `src/components/messages-pro/`)

```text
MessagesProShell.tsx        // grid layout, panel sizing, mobile pane swap
TopBar.tsx                  // creator switcher (combobox), totals, speed-mode toggle
CreatorRail.tsx             // 64px vertical avatar list, unread badge, status dot
ChatList.tsx                // tabs + search + chips + virtualized list (react-window)
ChatListItem.tsx            // dense row, $ spend, last msg, unread, pin/flag
ChatFilters.tsx             // chips: price range, age, PPV-unread, online, whale tier
ConversationHeader.tsx      // sticky, fan summary, "Open on OF" link
MessageTimeline.tsx         // virtualized, infinite-scroll-back, day separators
MessageBubble.tsx           // text / media / tip / PPV (locked vs unlocked)
PPVCard.tsx                 // price, blurred preview, paid badge, unlock time
Composer.tsx                // textarea + toolbar + PPV/schedule/expire + slash menu
QuickReplyMenu.tsx          // "/" autocomplete from of_quick_replies
VaultPickerDialog.tsx       // grid of media, multi-select, tag filter, price tag
AISuggestPanel.tsx          // calls ai-chatter, shows 3 variants, "Insert" button
FanSidebar.tsx              // right pane: profile, score, tags, notes, history, actions
FanScoreBadge.tsx           // whale 0–5 chip with color ramp
TagsEditor.tsx              // inline chip editor (add/remove)
InternalNotes.tsx           // textarea per-fan, agency-scoped, autosave
PurchaseHistoryList.tsx     // recent transactions for this fan
SpeedModeSettings.tsx       // popover: enter-to-send, auto-next chat, hotkeys
MassDMDrawer.tsx            // audience preview from current filters + composer reuse
RateLimitIndicator.tsx      // small pulsing dot with per-account remaining quota
```

## Hooks (new, under `src/hooks/`)

```text
useOfAccounts(creatorId?)   // list connected of_api accounts for rail
useOfChats(ofAccountId, filters)  // exists; extend with filters + search
useOfMessages(chatId)       // backward infinite scroll + realtime
useSendOfMessage()          // optimistic insert, reconciles via webhook
useVaultMedia(ofAccountId)  // paginated vault list (calls of-list-vault later)
useFanProfile(chatId)       // fan + tags + internal notes + purchase history
useQuickReplies(agencyId)   // CRUD of_quick_replies for slash menu
useSpeedModeSettings()      // localStorage + zustand-light toggle
useAISuggestReply(chatId)   // wraps ai-chatter, returns variants
```

All built on `useAgencyScopedCRUD` per project convention. Realtime via existing `of_chats`/`of_messages` Postgres-changes subscription.

## Routing

- New page `src/pages/MessagesPro.tsx` mounted at `/messages-pro` in `src/routes/routeConfig.tsx` (wrapped in DashboardLayout, code-split with `lazy()`).
- Sidebar entry "Messages Pro" with NEW badge; existing `/messages` (internal team chat) stays untouched.

## Visual language

- Pure black canvas (`hsl(0 0% 4%)`), glass panels at 70% opacity with subtle border + glow (project's existing AIaaS aesthetic).
- Accent: existing primary; PPV uses gold, tips use green, flagged uses red — all via semantic tokens added to `index.css` (`--ppv`, `--tip`, `--flag`, `--whale-1..5`).
- Dense typography (text-sm rows, text-xs metadata), avatars 36–40px in list, 48px in header.
- Smooth optimistic states (pending bubble pulses, replaced when webhook arrives).
- Keyboard-first: `J/K` to move chats, `Enter` to send, `/` for quick reply, `⌘K` command palette scoped to current chat.

## What this plan does NOT cover

- New edge functions (vault upload, mass-DM worker, sync earnings/fans) — separate plan.
- Historical message backfill.
- AI fan-score model itself (UI only consumes a `fan_score` field; we'll seed from spend tier until the model lands).
- Migration off `/messages` (kept side-by-side for one cycle).

## Open question for you

Right side: do you want the **FanSidebar always visible** (Infloww style, fixed 320px) or **detachable/floating widget** (OnlyMonster style, movable + hideable)? I'll default to fixed-collapsible if you don't pick.
