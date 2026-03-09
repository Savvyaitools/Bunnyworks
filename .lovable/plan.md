
# Production Launch Plan — BunnyWorksOS (bunnyworks.io)

## Current State Summary
- **Custom domain**: `bunnyworks.io` ✅ configured
- **Email domain**: ❌ NOT configured — auth emails come from generic sender
- **Payments**: GHL integration exists but will be **replaced with Stripe**
- **SEO**: ❌ All meta/canonical/OG tags still point to `creatorss.lovable.app`
- **Auth flows**: ❌ No password reset, no email resend button

---

## Phase 1 — Remove GHL & Enable Stripe

### 1a. Remove GHL Integration
**Files to delete:**
- `supabase/functions/ghl-create-checkout/index.ts`
- `supabase/functions/ghl-webhook/index.ts`

**Files to update:**
- `supabase/config.toml` — remove `[functions.ghl-create-checkout]` and `[functions.ghl-webhook]`
- `src/hooks/useSubscription.ts` — remove `initiateCheckout` (will be replaced by Stripe checkout)
- `src/pages/Settings.tsx` — remove GHL checkout references

**Secrets to delete:**
- `GHL_API_KEY`

**DB columns to clean up (migration):**
- `agencies.ghl_contact_id` — drop column
- `agencies.ghl_location_id` — drop column

### 1b. Enable Stripe Integration
- Use Lovable's native Stripe integration (`stripe--enable_stripe`)
- Create Stripe products/prices matching tiers: Core ($69), Scale ($129), Pro ($249)
- Implement checkout flow with Stripe Checkout Sessions
- Handle subscription webhooks for status updates
- Wire `useSubscription` to use Stripe instead of GHL

---

## Phase 2 — Email Domain Setup

### 2a. Configure Email Sending Domain
- Set up `bunnyworks.io` as the email sending domain
- Add required DNS records (SPF, DKIM, DMARC) at domain registrar
- This ensures password reset, verification, and notification emails come from `@bunnyworks.io`

### 2b. Custom Email Templates (optional)
- Brand the password reset, signup confirmation, and magic link emails
- Use Lovable Cloud's email template configuration

---

## Phase 3 — Auth Flow Gaps

### 3a. Password Reset Flow
- Add "Forgot Password?" link to `Auth.tsx` and `EmployeeAuth.tsx`
- Call `supabase.auth.resetPasswordForEmail()` with redirect to `/reset-password`
- Create `/reset-password` page: reads recovery token, allows setting new password via `updateUser({ password })`
- Add route to `routeConfig.tsx`

### 3b. Email Verification Resend
- Add "Resend verification email" button on the post-signup confirmation screen
- Call `supabase.auth.resend({ type: 'signup', email })` with 60-second cooldown timer

### 3c. Fix OAuth Loading State
- Separate `googleLoading` / `appleLoading` states in `Auth.tsx` so buttons don't conflict

---

## Phase 4 — Security Hardening

### 4a. Agency Billing Fields (Critical)
- Restrict `agencies` UPDATE RLS policy so clients can only modify: `name`, `website`, `logo_url`, `commission_rate`, `browser_session_mode`, `browser_sync_enabled`, `onboarding_completed`, `onboarding_step`
- All billing/subscription fields (`subscription_tier`, `subscription_status`, `max_creators`, `max_employees`, `subscription_*`, `trial_ends_at`) writable only by service_role

### 4b. Employee Permissions Escalation (Critical)
- `employee_of_permissions` INSERT/UPDATE policies must verify the caller is an agency owner, not an employee granting themselves access

### 4c. Session Access Logs
- Remove overly permissive INSERT policy; keep agency-scoped one

### 4d. Messages Cross-Creator Injection
- Add `conversation_id` ownership check to creator INSERT policy on `messages`

---

## Phase 5 — SEO & Meta Updates

### 5a. Update index.html
All references to `creatorss.lovable.app` → `bunnyworks.io`:
- `<link rel="canonical">`
- `og:url`, `og:image`
- `twitter:image`
- Structured data `provider.url`

### 5b. Fix Structured Data
- `highPrice: 399` → `249` (Pro plan is highest at $249; Enterprise is "Custom")
- `offerCount: 4` → `3` (3 priced plans + 1 custom)

### 5c. Fix Dead Footer Links
- "Use Cases" links point to `#` — either create pages or remove links
- Privacy Policy footer link → `/privacy`

---

## Phase 6 — UI Polish

### 6a. Notification Settings
- Settings > Notifications tab has non-functional Switch toggles with hardcoded values
- Either: wire to a `notification_preferences` table, or remove the tab until implemented

### 6b. Marketing Claims
- Hero: "500+ Agencies", "10,000+ Creators", "$50M+ Revenue" are hardcoded
- Soften to "Trusted by growing agencies" or verify numbers

### 6c. Testimonials
- 3 testimonials with first-name-last-initial — verify they're real or add disclaimer

### 6d. Console Logging Cleanup
- 85+ `console.log/error/warn` calls in page components
- Replace with `createLogger()` utility which respects `IS_DEV` flag

### 6e. `window.__logoUploadHandler` Global
- Replace with React context or callback prop

---

## Phase 7 — Tatum AI Social Media Agent Enhancement

### 7a. Trending Sounds & Hashtags Discovery (All Platforms)

**New edge function actions in `ai-social-media-manager`:**

#### TikTok Trends
- Scrape TikTok Creative Center (`ads.tiktok.com/business/creativecenter`) via Firecrawl for:
  - Trending hashtags with view counts
  - Trending sounds/audio with usage counts
  - Top-performing content formats
- Action: `discover_tiktok_trends`

#### Instagram Trends
- **Instagram Graph API** (native) for connected Business/Creator accounts:
  - Post insights (reach, impressions, saves, shares)
  - Story/Reel metrics
  - Follower demographics
  - Hashtag search volume
- Firecrawl fallback for public profile scraping when accounts aren't connected
- Action: `discover_instagram_trends`
- **Requires**: Meta App ID + App Secret, creator OAuth consent

#### Twitter/X Trends
- **X API v2** (native):
  - Trending topics by location
  - Tweet engagement metrics (likes, retweets, quotes, impressions)
  - User growth metrics
- Action: `discover_twitter_trends`
- **Requires**: `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`

#### Reddit Trends
- **Reddit Data API** (native):
  - Subreddit trending posts (hot/rising)
  - Post engagement (upvotes, comments, awards)
  - Cross-post performance tracking
  - Niche community discovery for creator promotion
- Action: `discover_reddit_trends`
- **Requires**: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`

### 7b. Creator Social Media Analytics

**New DB table: `social_analytics_snapshots`**
```sql
CREATE TABLE social_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) NOT NULL,
  creator_id UUID REFERENCES creators(id) NOT NULL,
  platform TEXT NOT NULL, -- 'tiktok', 'instagram', 'twitter', 'reddit'
  followers INTEGER,
  following INTEGER,
  total_posts INTEGER,
  avg_engagement_rate NUMERIC(5,2),
  avg_likes INTEGER,
  avg_comments INTEGER,
  avg_shares INTEGER,
  top_post_url TEXT,
  top_post_engagement JSONB,
  raw_data JSONB,
  captured_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**New edge function action: `fetch_creator_analytics`**
- Pull analytics from each connected platform
- Store snapshot in `social_analytics_snapshots`
- Compare with previous snapshot to calculate growth rates
- AI summarizes performance trends

### 7c. Virality Score Engine

**Scoring algorithm (computed by AI + heuristics):**
- **Engagement velocity**: likes/views in first hour
- **Share-to-view ratio**: viral coefficient
- **Comment sentiment**: positive = higher score
- **Cross-platform spread**: content appearing on multiple platforms
- **Trend alignment**: how well content matches current trending topics

**New DB table: `content_virality_scores`**
```sql
CREATE TABLE content_virality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) NOT NULL,
  content_plan_id UUID REFERENCES content_plans(id),
  platform TEXT NOT NULL,
  virality_score INTEGER CHECK (virality_score BETWEEN 0 AND 100),
  confidence NUMERIC(3,2),
  factors JSONB, -- breakdown of score components
  recommendation TEXT,
  scored_at TIMESTAMPTZ DEFAULT now()
);
```

**New edge function action: `score_content_virality`**
- Input: content idea/caption + platform + creator niche
- Tatum compares against current trends, creator's historical performance, platform-specific patterns
- Returns: 0-100 score + confidence + factor breakdown + optimization tips

### 7d. API Architecture

```
Frontend (SocialMediaManager.tsx)
  │
  ▼
ai-social-media-manager (edge function)
  │
  ├── discover_tiktok_trends ──→ Firecrawl (TikTok Creative Center)
  ├── discover_instagram_trends ──→ Instagram Graph API (native) / Firecrawl fallback
  ├── discover_twitter_trends ──→ X API v2 (native)
  ├── discover_reddit_trends ──→ Reddit API (native)
  ├── fetch_creator_analytics ──→ All connected platform APIs
  ├── score_content_virality ──→ AI + historical data + trend data
  │
  └── Existing actions:
      ├── generate_posts
      ├── generate_calendar
      ├── analyze_strategy
      ├── analyze_trends
      └── niche_content_plan
```

### 7e. API Keys Required

| API | Secrets Needed | Cost | Status |
|-----|---------------|------|--------|
| Firecrawl | `FIRECRAWL_API_KEY` | Connected | ✅ Ready |
| TikTok Creative Center | None (public, scraped via Firecrawl) | Free | ✅ Ready |
| Instagram Graph API | `META_APP_ID`, `META_APP_SECRET` | Free | ❌ Need Meta App |
| X API v2 | `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET` | $100/mo Basic | ❌ Need X Developer Account |
| Reddit API | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` | Free | ❌ Need Reddit App |

### 7f. Implementation Order

| Step | What | Effort | Dependencies |
|------|------|--------|-------------|
| 1 | TikTok trend discovery via Firecrawl | Small | None (ready now) |
| 2 | Reddit trend discovery | Small | Reddit app credentials |
| 3 | Virality scoring engine | Medium | Step 1 data |
| 4 | Social analytics snapshots table + UI | Medium | None |
| 5 | Twitter/X integration | Medium | X API credentials ($100/mo) |
| 6 | Instagram Graph API integration | Large | Meta App + OAuth flow |
| 7 | Analytics dashboard tab in Tatum UI | Medium | Steps 1-4 |

---

## Implementation Order (Overall)

| Step | Phase | Priority | Effort |
|------|-------|----------|--------|
| 1 | Remove GHL code & secrets | Blocker | Small |
| 2 | Enable Stripe integration | Blocker | Medium |
| 3 | Set up email domain (bunnyworks.io) | Blocker | Small (DNS) |
| 4 | Password reset flow | Blocker | Medium |
| 5 | Email resend button | Blocker | Small |
| 6 | Security RLS migrations | Blocker | Medium |
| 7 | Update SEO meta to bunnyworks.io | High | Small |
| 8 | Fix dead footer links | High | Small |
| 9 | Tatum: TikTok + Reddit trends (Phase 7, Steps 1-2) | High | Small |
| 10 | Tatum: Virality scoring (Phase 7, Step 3) | High | Medium |
| 11 | Tatum: Analytics dashboard (Phase 7, Steps 4+7) | Medium | Medium |
| 12 | Tatum: X/Instagram native APIs (Phase 7, Steps 5-6) | Medium | Large |
| 13 | Fix OAuth loading state | Medium | Small |
| 14 | Fix notification settings | Medium | Small |
| 15 | Soften marketing claims | Medium | Small |
| 16 | Console logging cleanup | Low | Medium |
