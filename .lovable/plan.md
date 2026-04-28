# AI Agents Study

You currently have **9 AI surfaces** under `/of-ai`. They split into 3 groups:

```text
1. CONVERSATIONAL AGENTS (chat with tool-calling)
   - Coach PBF        → /of-ai/coach-pbf
   - Flick            → /of-ai/flick-manager
   - Tatum            → /of-ai/social-media

2. WORKFLOW / SUGGESTION ENGINES
   - Marylin Monroe   → /of-ai/chatter        (auto-reply generator)
   - JODIE            → ai-izzy-suggest        (4-suggestion bar in chat UI)
   - Orchestrator     → ai-agent-orchestrator  (background workflows)

3. EMBEDDED THIRD-PARTY (iframes — not our agents)
   - Naked Savvy (image)   - Only Voice (TTS)
   - ComfyUI               - File Pal Plus (framework)
```

All three conversational agents (Coach PBF, Flick, Tatum) **share the same edge function** `ai-felix-query` — they're the same brain with different system prompts. That's a major reason performance feels uneven.

---

## 1. Coach PBF — Strategic Chief-of-Staff

**Purpose:** Personal AI advisor for the agency owner. Strategy, forecasting, barrier identification.

**Current abilities**
- Reads: agency, creators, employees, chatters, earnings (last 30), tasks (50), KPIs, content plans, shifts, alerts, assignments, persistent `agent_memories`
- Tools (shared with Flick/Tatum): `create_content_plan`, `bulk_create_content_plans`, `create_task`, `assign_chatter_to_creator`, `create_shift`, `create_calendar_event`, `create_performance_alert`, `send_message_to_creator`, `search_niche_trends`
- Persistent memory via `<!--MEMORIES:-->` markers; conversation history persisted in `coach_pbf_conversations/messages`
- Prompt-injection guard, 500-char query cap
- Model: `google/gemini-2.5-flash`

**Why it underperforms**
- **No real forecasting** — system prompt says "forecasting" but only feeds raw rows; model has to do the math itself with no aggregations precomputed (MoM growth, churn rate, LTV, CAC).
- **Earnings limited to 30 rows total** for the whole agency → with 4 creators × 8 weeks that's only ~7 weeks of data. Trend statements are unreliable.
- **No fan-level data** (top fans, spend distribution, churned fans) even though it exists in `ai_fan_context` and fan analytics.
- **No social account growth, no marketing-link clicks, no expenditures** → can't talk P&L, can't talk acquisition.
- **No web/research tool** — can't pull a SOP, a benchmark, or a creator's public profile.
- **Same model as Flick/Tatum** (Flash). For C-suite reasoning Coach PBF should be on Pro/GPT-5 with `reasoning: medium`.

**What to add**
- Pre-computed metric block: WoW/MoM revenue, retention, top/bottom mover, run-rate vs goal, gross margin (revenue − payroll − expenditures).
- New tools: `forecast_revenue` (n-period projection), `compute_payroll_period`, `summarize_fan_segment`, `compare_creators`, `set_goal` (writes to `agent_goals`), `dismiss_alert`, `export_report` (PDF to documents bucket).
- Model upgrade to `openai/gpt-5` or `google/gemini-2.5-pro` with reasoning enabled for analytic queries.
- Streaming responses (currently blocking — feels slow).

---

## 2. Flick — Creator Manager

**Purpose:** Operational execution on creator content pipeline (OF/Fansly), accountability, daily check-ins.

**Current abilities**
- Loads the same agency data + `flick_framework` knowledge base entries
- Domain restricted to `platform = onlyfans|fansly` content plans
- Can DM creators via `send_message_to_creator` (writes to `messages` with `conversation_id = creator-{id}`)
- Quick actions: Daily Check-In, Content Pipeline, Add Platform Plan, Message Creators

**Why it underperforms**
- **No awareness of the creator's actual portal activity** — doesn't see when a creator last logged into the portal, last uploaded a vault file, or last replied. So "who's falling behind" is guessed from `content_plans.board_column`, not real behavior.
- **Cannot read a content plan's media** — can suggest a plan but can't say "review the 3 reference videos already attached to plan X".
- **No quota tracker** — the framework says "weekly quotas" but there's no `creator_quotas` table being read.
- **Messaging is one-shot** — Flick can send a message but doesn't see the creator's reply on the next turn (no `messages` history fed back into prompt).
- **No scheduling intelligence** — can create plans for any date but doesn't check creator's existing schedule density / shoot-day calendar.

**What to add**
- Read `messages` thread per creator (last 20) and `content_files` upload counts (last 7d) into the prompt.
- New table `creator_quotas` (posts/wk, PPV/wk, livestreams/mo) + tool `set_creator_quota` and prompt block "X is at 2/5 PPVs this week".
- Tool `request_content_from_creator` → creates a structured "request" item in their portal Kanban + push notification.
- Tool `score_creator_week` → writes a 0-100 consistency score to `creator_consistency_scores` (PRO tier feature already advertised).
- Auto-trigger: when 2 consecutive missed quotas, Flick auto-DMs + creates an alert.

---

## 3. Tatum — Social Media Strategist

**Purpose:** Viral content discovery, niche research, social-platform content planning (TikTok/IG/X/Reddit).

**Current abilities**
- All shared tools + Apify-powered `search_niche_trends` (TikTok/IG/Twitter/Reddit)
- Dedicated workflow function `ai-social-media-manager` with actions: `generate_posts`, `generate_calendar`, `analyze_strategy`, `analyze_trends`, `niche_content_plan`
- Pulls live OF data via OnlyFans API when `ofAccountId` is connected
- Reads `creator_social_accounts` (followers, ER), `warmup_intelligence` (Firecrawl scrapes)
- Persistent memory under `agent_type='tatum'`

**Why it underperforms**
- **Two parallel implementations** (`ai-felix-query` with `agentContext='tatum_social'` AND `ai-social-media-manager`) — they don't share results. Owner asks "find trends" in chat → Apify call. Owner clicks "Search Trends" tab → different Apify call. Memory and context drift.
- **Apify free actor (`clockworks/free-tiktok-scraper`)** is rate-limited and frequently returns thin data → poor "viral" picks.
- **No video understanding** — Tatum sees a URL + caption but never analyzes the actual video. Recreation prompts are generic.
- **No follower growth deltas** — has follower count snapshot but no time-series, so can't say "+1.2k this week".
- **Hashtag suggestions are model-generated**, not validated against real reach data.

**What to add**
- Consolidate into one function; `ai-social-media-manager` becomes a *tool* of `ai-felix-query` (same pattern as `search_niche_trends`).
- Upgrade Apify actors to paid (Instagram, TikTok) or use Firecrawl extract on profiles.
- Tool `analyze_video_url` → uses Gemini Pro multimodal to actually watch the reference clip and extract hook/pacing/transitions.
- Time-series: `social_stats_history` table fed by existing `sync-social-stats` cron → Tatum quotes real growth.
- Tool `schedule_social_post` (when a publisher integration exists) — currently it can only *plan*, never *post*.

---

## 4. Marylin Monroe — Auto-Reply Chatter

**Purpose:** Generate replies to fans on platform, auto-send when confidence ≥ threshold, queue the rest for human review.

**Current abilities**
- One-shot reply generator with confidence + reason + flagForReview
- Reads creator persona, boundaries, fan profile (`ai_fan_context`), creator earnings (3 periods), past suggestion outcomes (sales/edits), `agent_memories` for marylin
- `confidenceThreshold` slider, conversation history (last 6 turns)
- Returns `suggestedUpsell`
- Model: `google/gemini-3-flash-preview`, temp 0.5

**Why it underperforms (this is the biggest user complaint historically)**
- **The Sandbox/Rules/Review queue UI is fully mocked** — `queue` and `rules` arrays are hardcoded in `AIChatter.tsx`. Nothing persists, no real fan messages flow in. The actual `ai-chatter` function is only called from the test sandbox.
- **No production message ingestion path** — there's no webhook/poller that takes inbound platform DMs and routes them through Marylin. The "auto-reply" toggle does nothing real.
- **Trigger rules don't connect** to the AI function — they're a separate UI concept that never executes.
- **No PPV pricing model** — the prompt mentions tier-based pricing but there's no PPV catalog being passed.
- **No A/B learning loop** — `ai_suggestions_log` is read but `resulted_in_sale` is never written back from any real flow, so "performance" stats are meaningless.
- **Per-fan memory is shallow** — only 5 fan profiles loaded, no per-fan conversation summary (last 30 days of chat).

**What to add (highest ROI fix)**
- **Wire it to real DMs**: cron poller pulls unread DMs via OnlyFans API → enqueues into `pending_replies` table → Marylin processes batch → auto-sends if conf ≥ threshold, else writes to `review_queue`.
- Real `auto_reply_rules` table + UI CRUD; rules evaluated *before* AI (regex match → instant cheap reply, AI fallback otherwise).
- `ppv_catalog` table per creator (sets, prices, last sent to fan) → tool `suggest_ppv_for_fan(fan_id)` returns concrete asset + price.
- Outcome tracking: when fan tips/buys after a sent reply, mark `resulted_in_sale=true` → Marylin actually learns.
- Per-fan memory summarizer (cron): rolling 30-day chat summary + top kinks/preferences in `fan_memory`.

---

## 5. JODIE — Reply Suggestions Bar

**Purpose:** Generate 4 reply candidates for a human chatter to pick from inside the messaging UI.

**Current abilities**
- `ai-izzy-suggest` returns 4 suggestions with `text/intent/confidence`
- Pulls `creator_voice_profiles`, `ai_knowledge_base`, optional `ai_fan_context`
- Mode types: `reply | ppv_price | upsell`
- Has fallback hardcoded suggestions on parse failure (low quality)

**Why it underperforms**
- **Unclear if it's wired to a UI** — no `JODIE` import found in `src/components/messaging/*`. May be an orphan endpoint.
- **No conversation-thread view** — only last 10 turns; doesn't see the fan's purchase history details.
- **No "why this suggestion" rationale shown** to the chatter, so they can't improve their own writing.

**What to add**
- Confirm wiring (likely needs to be added as a "Suggest" panel in `ChatInput.tsx`).
- Show intent + confidence + voice-match score per suggestion.
- Track which of the 4 was picked → feedback loop for the voice profile.
- Add a `regenerate_with_steer` action ("more flirty", "more casual", "shorter").

---

## 6. Orchestrator — Background Workflow Runner

**Purpose:** Cron-driven background agent that monitors all agencies and writes alerts/tasks/briefings.

**Current abilities**
- 6 workflows: `monitor`, `briefing`, `revenue_recovery`, `content_gap`, `shift_optimization`, `fan_reengagement`
- Iterates ALL agencies, runs analysis, writes to `ai_performance_alerts`, `tasks`, `notifications`, `felix_briefings`
- Auto-dismisses alerts > 7 days old; deduplicates by title
- Model: `google/gemini-2.5-flash`, temp 0.3

**Why it underperforms**
- **No cron schedules visible** in the codebase — these workflows likely never run automatically (or only via manual curl). Search found no `pg_cron.schedule(...)` for the orchestrator.
- **Iterates ALL agencies in one invocation** — at scale this will time out (Edge functions have 60s wall-clock); also wastes tokens on agencies with no data.
- **Briefings overwrite per day** but UI surfacing is weak (no dashboard widget showing today's briefing prominently).
- **No feedback loop on alert quality** — the orchestrator writes alerts but doesn't learn which ones the owner dismissed vs acted on.

**What to add**
- Add `pg_cron` jobs: `monitor` every 30 min, `briefing` daily 7am owner-tz, `revenue_recovery` daily, `content_gap`/`shift_optimization` 2x/day, `fan_reengagement` weekly.
- Refactor to per-agency invocation (queue pattern using existing `scrape_jobs` infra) so one slow agency doesn't block others.
- New workflow `weekly_review` → comprehensive PDF briefing emailed via `send-push-notification` extension.
- Read `agent_feedback` ratings → adjust prompt examples (few-shot) per agency.

---

## 7. Embedded tools (iframes)

**Naked Savvy, Only Voice, ComfyUI, File Pal Plus** are HuggingFace Spaces / external Lovable apps embedded as iframes. They're not our AI agents — we have no control over their performance, prompts, or data.

**Recommendation:** Either build first-party replacements using Lovable AI image/video models (`google/gemini-3-pro-image-preview`, `google/gemini-3.1-flash-image-preview`), or clearly label them "Beta — third-party" so they're not judged as our agents.

---

## Cross-cutting issues affecting ALL agents

1. **No streaming** — every agent blocks until full response. Feels slow even when it's working. Switch to SSE per the AI gateway streaming pattern.
2. **No agent observability** — no dashboard showing token usage, latency, success rate, tool-call success per agent. Hard to know *which* agent is slow/wrong.
3. **No evaluation harness** — no fixed prompt set to regression-test after model/prompt changes.
4. **Memories are write-only-grow** — `agent_memories` accumulates forever; no decay, no de-duplication, no "forget" tool. Eventually the prompt is full of stale opinions.
5. **Same model for everything** (Gemini Flash). Pricier reasoning queries (Coach PBF strategy) deserve Pro/GPT-5; cheap ones (Marylin one-liners) can stay on Flash-Lite.
6. **Token bloat** — entity lookups list every creator/employee/chatter on every turn. Move to a `lookup_entity` tool the model calls when needed.

---

## Suggested priority order (if you want to act)

1. **Marylin Monroe production wiring** — biggest gap between marketing and reality.
2. **Orchestrator cron schedules + per-agency queueing** — the "automatic alerts" promise depends on this.
3. **Coach PBF analytics depth** — pre-aggregations + Pro model + streaming.
4. **Flick portal awareness** — read messages/uploads + quotas.
5. **Tatum consolidation** — merge two implementations, add multimodal video analysis.
6. **Agent observability dashboard** — so we can measure improvement instead of guessing.

---

**This is a study only — no code changes proposed in this plan.** Tell me which of the 6 priorities you want to tackle first (or your own ordering) and I'll come back with an implementation plan for that scope.