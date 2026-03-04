

## Fan Analytics Section -- Implementation Plan

### What FansMetric Offers (Key Features to Replicate)

FansMetric provides deep fan-level analytics that your platform currently lacks as a UI section:
- **Top Fans** ranked by total spend, with purchase counts
- **Fan Segmentation** (smart lists by spend tier: whales, mid-spenders, low-spenders)
- **Earning Metrics**: avg earnings per fan, visitor-to-subscriber conversion rate, new subscriber count
- **Chat Analytics**: message volume, response times, earnings per chat
- **Marketing Link ROI**: tracking link performance with clicks, conversions, revenue

### What You Already Have (Database)

Your database is well-positioned:
- `of_fans`: has `total_spent`, `username`, `name`, `avatar_url`, `is_active`, `subscribed_at`, `expires_at`, `renew_on`, `of_account_id`
- `of_chats`: has `fan_username`, `last_message_at`, `unread_count`, `of_fan_id`
- `creator_earnings`: has `tips`, `subscriptions`, `messages_revenue`, `referrals`, broken down by period
- `tracking_links`: has `clicks`, `conversions`, `revenue`, `campaign`, `source`

What's **missing**: per-fan transaction history (individual purchases/tips per fan), fan online status tracking, and message-level analytics. But you can build a powerful v1 with existing data.

### Plan

#### 1. New Page: `/fan-analytics`
Create `src/pages/FanAnalytics.tsx` with the following sections:

**Section A -- KPI Stats Bar** (top row of 4-5 stat cards)
- Total Fans (active count from `of_fans`)
- Average Spend Per Fan (`SUM(total_spent) / COUNT(*)`)
- New Subscribers This Month (fans with `subscribed_at` in current month)
- Renewal Rate (fans with `renew_on = true` / total active)
- Avg Earnings Per Fan (total earnings / fan count)

**Section B -- Top Fans Leaderboard** (table/list)
- Query `of_fans` ordered by `total_spent DESC`, limit 20
- Show avatar, username, total spent, subscription status, subscribed date
- Filter by creator (via `of_account_id` joined to creators)

**Section C -- Fan Spend Distribution** (pie/bar chart)
- Segment fans into tiers: Whales ($500+), High ($100-500), Mid ($25-100), Low (<$25)
- Query `of_fans` and bucket by `total_spent`

**Section D -- Subscriber Growth Chart** (line chart)
- Plot new fans per week/month using `subscribed_at` field
- Show churn via `expires_at` in the past + `renew_on = false`

**Section E -- Chat Engagement Overview**
- Join `of_chats` with `of_fans` to show fans with most recent activity
- Unread count distribution, last message recency

**Section F -- Marketing Link Performance**
- Query `tracking_links` grouped by campaign/source
- Show clicks, conversions, revenue, ROI per link

#### 2. Navigation Update
- Add "Fan Analytics" to the sidebar under a new "Analytics" collapsible section (or alongside existing items)
- Icon: `BarChart3` or `Users` variant

#### 3. Database Migration
- Add a new `fan_transactions` table for granular per-fan purchase tracking (for future Chrome extension sync):
  ```sql
  CREATE TABLE public.fan_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid REFERENCES agencies(id),
    of_account_id text NOT NULL,
    of_fan_id text NOT NULL,
    transaction_type text NOT NULL, -- 'tip', 'ppv', 'subscription', 'message'
    amount numeric DEFAULT 0,
    description text,
    transacted_at timestamptz,
    created_at timestamptz DEFAULT now(),
    synced_at timestamptz DEFAULT now()
  );
  ```
- This enables per-fan revenue attribution that FansMetric excels at

#### 4. Files to Create/Edit
- **Create** `src/pages/FanAnalytics.tsx` -- main page with all sections
- **Create** `src/components/fan-analytics/` -- component folder:
  - `FanStatsBar.tsx` -- KPI row
  - `TopFansTable.tsx` -- leaderboard
  - `FanSpendDistribution.tsx` -- chart
  - `SubscriberGrowthChart.tsx` -- line chart
  - `ChatEngagementPanel.tsx` -- chat stats
  - `MarketingLinkPerformance.tsx` -- tracking link ROI
- **Edit** `src/components/layout/AppSidebar.tsx` -- add nav item
- **Edit** `src/components/layout/MobileBottomNav.tsx` -- add if needed
- **Edit** `src/App.tsx` -- add route

#### 5. Data Flow
All queries use the existing `supabase` client, filtered by `agency_id` from `useAgency()`. Creator selector dropdown lets users filter analytics per creator or view aggregate. Charts use `recharts` (already installed).

### Technical Notes
- The `of_fans` table currently gets populated via the Chrome extension sync (`ingest-browser-sync`). The analytics page will show "Connect your accounts to see fan data" as an empty state when no data exists.
- The `fan_transactions` table sets up future granular tracking but the UI will work with `of_fans.total_spent` for v1.

