

# Production Launch Readiness Review

## Executive Summary

The application has strong architectural foundations (declarative routing, centralized error handling, multi-tenant RLS, structured logging) but has several **blockers** and **high-priority gaps** that must be addressed before a production launch.

---

## BLOCKERS (Must Fix Before Launch)

### 1. No Password Reset Flow
There is no "Forgot Password" link on either login page (`Auth.tsx`, `EmployeeAuth.tsx`), and no `/reset-password` page exists. Users who forget their password are locked out permanently. The only password reset mechanism is an admin edge function (`admin-reset-password`).

**Fix:** Add a "Forgot Password?" link to both auth pages, implement `supabase.auth.resetPasswordForEmail()`, and create a `/reset-password` page that handles the recovery token and calls `updateUser({ password })`.

### 2. No Email Verification Resend
After signup, the verification screen has no "Resend email" button. If the email is delayed or lost, the user is stuck.

**Fix:** Add a resend button calling `supabase.auth.resend({ type: 'signup', email })` with a 60-second cooldown timer.

### 3. Security Vulnerabilities (from scan)

| Finding | Severity | Summary |
|---|---|---|
| `of_cache` table fully public | **Critical** | `USING(true)` RLS — any user can read/write all cached OnlyFans data across agencies |
| GHL webhook no signature check | **Critical** | Attackers can forge payment events to upgrade subscriptions for free |
| Session access logs unrestricted inserts | **Warn** | Any authenticated user can forge audit trail entries |
| AI query resource exhaustion | **Warn** | No rate limiting on expensive AI edge function calls |

**Fix:** Tighten `of_cache` RLS to service_role only, add HMAC signature verification to `ghl-webhook`, restrict `session_access_logs` inserts, add rate limiting to AI functions.

### 4. Notification Settings Are Non-Functional
The Settings > Notifications tab renders Switch toggles with hardcoded `defaultChecked` values but doesn't persist preferences anywhere. Users toggle them and nothing happens.

**Fix:** Either connect to a `notification_preferences` table or remove the tab to avoid misleading users.

---

## HIGH PRIORITY (Should Fix Before Launch)

### 5. Landing Page Stats Are Fabricated
The hero section claims "500+ Agencies", "10,000+ Creators Managed", "$50M+ Revenue Tracked". These are hardcoded marketing numbers. If they are not accurate, this could damage trust or create legal issues.

**Fix:** Either verify these numbers are accurate, replace with softer language ("Trusted by growing agencies"), or pull real aggregate stats.

### 6. Testimonials Are Likely Fictional
Three testimonials with first-name-last-initial format ("Marcus T.", "Elena R.", "David K.") with specific metrics. If these are not real customers, this is a significant trust/legal risk.

**Fix:** Use real testimonials or remove the section. At minimum, add a disclaimer.

### 7. Footer Links Are Dead
The footer "Use Cases" links all point to `href="#"` (OnlyFans Agencies, Fansly Management, Multi-Platform). The Privacy Policy link also points to `#` instead of `/privacy`.

**Fix:** Either create the target pages or remove the dead links.

### 8. SEO Canonical URL Points to Lovable Subdomain
`index.html` has `<link rel="canonical" href="https://creatorss.lovable.app" />` and all OG/Twitter meta tags reference this URL. For a production launch with a custom domain, these must be updated.

**Fix:** Update canonical URL, OG URLs, and structured data to the production domain.

---

## MEDIUM PRIORITY (Polish for Launch Quality)

### 9. Console Logging in Production
85+ `console.log/error/warn` calls across page components. These leak internal state and error details to end users who open DevTools.

**Fix:** Replace with the existing `createLogger()` utility which respects the `IS_DEV` flag.

### 10. `window.__logoUploadHandler` Global Mutation
Both `Settings.tsx` and `AgencyOnboardingWizard.tsx` attach upload handlers to `window` as a global. This is fragile and can cause conflicts.

**Fix:** Use React context or a callback prop instead.

### 11. Pricing Inconsistency
Landing page says "$100 per creator" as the base unit, but the Core plan is $69/mo for 1 creator. The "Save 31%" badge implies $100 is the full price, but no standalone $100/creator option exists in-app.

**Fix:** Clarify messaging — either offer a true $100/creator a-la-carte option or reframe the discount language.

### 12. `googleLoading` State Shared Between Google and Apple Buttons
In `Auth.tsx`, the Apple sign-in button reuses `googleLoading` state, meaning clicking Apple disables the Google button and vice versa with the wrong spinner.

**Fix:** Add a separate `appleLoading` state or use a generic `oauthProvider` state.

---

## LOW PRIORITY (Nice to Have)

### 13. No Loading State on Landing Page
The landing page eagerly loads all sections (Hero, Pain Points, Features, AI Tools, Comparison, How It Works, Testimonials, Pricing, CTA). For slower connections, consider lazy loading below-the-fold sections.

### 14. Structured Data `highPrice` Mismatch
`index.html` schema.org has `"highPrice": "399"` but the highest priced plan is $249 (Pro). Enterprise is "Custom".

### 15. Missing `apple-touch-icon` Proper Sizes
The same `favicon.png` is used for both regular and 180x180 apple touch icon. Consider providing proper sized icons.

---

## Recommended Implementation Order

1. **Security fixes** (of_cache RLS, GHL webhook signature) — database migrations + edge function edit
2. **Password reset flow** — new page + auth page updates
3. **Email resend button** — small Auth.tsx update
4. **Fix dead footer links** — point to real routes
5. **Remove/fix notification settings** — either build or remove
6. **Update SEO meta for production domain** — index.html edit
7. **Fix OAuth loading state bug** — Auth.tsx
8. **Replace console.log with logger** — across pages
9. **Review marketing claims** — business decision
10. **Remove window global hack** — refactor LogoUpload

Would you like me to implement these fixes? I recommend starting with the security blockers and auth flow gaps.

