
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

## Implementation Order

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
| 9 | Fix OAuth loading state | Medium | Small |
| 10 | Fix notification settings | Medium | Small |
| 11 | Soften marketing claims | Medium | Small |
| 12 | Console logging cleanup | Low | Medium |
