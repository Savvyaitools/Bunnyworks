# Pricing Model Overhaul

## New Pricing Structure

The pricing shifts to a **per-creator model at $100/creator**, with each creator slot including 5 employees. Existing plan prices are shown as **discounted bundles** compared to the a-la-carte rate.

### Tier Breakdown


| Tier           | Creators Included | Employees Included | A-la-carte Value | Discounted Price  | Savings         |
| -------------- | ----------------- | ------------------ | ---------------- | ----------------- | --------------- |
| **CORE**       | 1                 | 5                  | $100             | **$69/mo**        | 31% off         |
| **SCALE**      | 2                 | 10                 | $200             | **$129/mo**       | 36% off         |
| **PRO**        | 4                 | 15                 | $400             | **$249/mo**       | calculate again |
| **ENTERPRISE** | Custom            | Custom             | --               | **Contact Sales** | --              |


- **Extra creators** on any plan: **$100/creator** (includes 5 additional employees per creator)

### Feature Distribution by Tier

**CORE (Visibility)** -- 1 creator, 5 employees

- Unified employee management
- Basic shift scheduling
- Creator profiles + onboarding
- 50 GB Content Vault
- Task management dashboard
- Basic performance tracking
- Fan CRM
- Cloud Browser Sessions

**SCALE (Operational Control)** -- 2 creators, 10 employees

- Everything in Core, plus:
- Advanced chatter performance tracking
- PPV and revenue analytics per shift
- Recruiting pipeline with follow-ups
- Coverage gap detection
- 200 GB Content Vault
- Cloud Browser Sessions
- Priority support

**PRO (AI-Powered Growth)** -- 3 creators, 15 employees

- Everything in Scale, plus:
- AI-powered performance insights (Coach PBF)
- Automated daily summaries
- Creator consistency scoring
- Staff reliability metrics
- AI Smart Replies (Izzy)
- 600 GB Content Vault
- Early access to features

**ENTERPRISE (Systems Command)** -- Custom

- Everything in Pro, plus:
- Unlimited creators and team members
- AI Chatting System
- AI Voice Cloner
- AI Content Generator
- Custom KPIs and automations
- White-label experience
- 1 TB+ Content Vault
- Dedicated implementation manager
- SLA + roadmap influence

---

## Technical Changes

### 1. Update `src/lib/subscriptionTiers.ts`

- Change CORE: price 69, maxCreators 1, maxEmployees 5
- Change SCALE: price 129, maxCreators 2, maxEmployees 10
- Change PRO: price 249, maxCreators 3, maxEmployees 15
- ENTERPRISE: price null (unchanged), maxCreators/maxEmployees 9999 (unchanged)
- Add new fields to `TierConfig`: `originalValue` (a-la-carte price), `discountLabel` (e.g. "Save 31%"), `extraCreatorPrice` (100)
- Update feature lists to match the distribution above

### 2. Update `PricingSection` in `src/components/landing/LandingSections.tsx`

- Show **strikethrough original value** (e.g. $100) next to the discounted price for Core, Scale, Pro
- Add a "Save X%" badge on each card
- Add "+$100/extra creator" note below the price on each card
- Enterprise card: show "Contact Sales" with no price (remove "$399+")
- Update feature bullet points to match the new distribution
- Add a note below the pricing grid: "Each creator includes 5 team member slots. Need more? Add creators at $100/each."

### 3. Database migration

- Update the database trigger that syncs `max_creators` and `max_employees` from `subscription_tier` to use the new values (1/5, 2/10, 3/15)
- This ensures new agencies and tier changes get the correct limits

### 4. Update `ComparisonSection` features (no changes needed -- feature availability stays the same, just distribution across tiers changes)

### Files to modify:

- `src/lib/subscriptionTiers.ts` -- tier config values and features
- `src/components/landing/LandingSections.tsx` -- pricing card UI with discounts
- Database migration -- update the tier sync trigger