

# Launch Readiness Status Report

## 1. Payment Processor (GHL + Stripe)

**Status: Partially wired, not production-ready**

What exists:
- `ghl-create-checkout` edge function syncs contacts to GoHighLevel and logs `checkout_initiated` events
- `ghl-webhook` edge function receives payment events and updates `agencies.subscription_tier/status`
- `useSubscription` hook reads subscription state and exposes `initiateCheckout`
- `GHL_API_KEY` secret is configured

What's missing / broken:
- **`GHL_WEBHOOK_SECRET` is NOT configured** — the webhook code gracefully skips HMAC verification when the secret is absent, meaning anyone can forge payment events to upgrade agencies for free. You need to add this secret.
- **No actual payment URL returned** — `ghl-create-checkout` returns `{ success: true }` but no `paymentUrl`, so `initiateCheckout` shows a toast but never redirects users to pay. You need to either: (a) configure a GHL payment link/funnel URL per tier and return it, or (b) switch to Stripe for direct checkout.
- **Agency billing fields unprotected** — the security scan confirms any authenticated user in an agency can UPDATE `subscription_tier`, `max_creators`, etc. directly via the client. This is a critical privilege escalation.

**Setup steps:**
1. Add `GHL_WEBHOOK_SECRET` as a secret (get it from your GHL webhook settings)
2. Either configure GHL payment funnel URLs in the edge function, or switch to Stripe (Lovable has a native Stripe integration — I can enable it)
3. Lock down the `agencies` UPDATE RLS policy to only allow `name`, `website`, `logo_url` changes from clients; all billing fields must only be writable by service_role

---

## 2. Email Management (Password Reset, Verification)

**Status: Not implemented**

What exists:
- Email verification screen shows after signup (but no "Resend" button)
- No "Forgot Password" link on either Auth page
- No `/reset-password` route exists anywhere in the codebase

What needs to be built:
1. **Password reset flow**: Add "Forgot Password?" link → call `resetPasswordForEmail()` → create `/reset-password` page that reads the recovery token and calls `updateUser({ password })`
2. **Resend verification email**: Add button on the verification screen calling `supabase.auth.resend({ type: 'signup', email })` with a 60-second cooldown
3. **Custom email templates** (optional): Set up a custom sender domain so emails come from your brand instead of the default. This requires DNS configuration.

---

## 3. Security Vulnerabilities (from fresh scan)

Five findings, two critical:

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | **Critical** | Agency users can self-modify `subscription_tier`, `max_creators`, billing fields | Restrict UPDATE policy to non-billing columns only |
| 2 | **Critical** | Employees can grant themselves OF permissions (`employee_of_permissions` INSERT/UPDATE) | Add `user_type = 'agency'` check to write policies |
| 3 | Warn | Any authenticated user can insert fabricated `session_access_logs` | Remove the permissive policy, keep agency-scoped one |
| 4 | Warn | Creators can inject messages into other creators' conversations | Add `conversation_id` check to creator INSERT policy |
| 5 | Info | RLS enabled but no policies on some tables | Add policies or confirm service-role-only access |

---

## 4. Other Missing Items for Launch

| Area | Status | What's needed |
|------|--------|---------------|
| **SEO meta** | Points to `creatorss.lovable.app` | Update `index.html` canonical, OG, and structured data URLs to your production domain |
| **Structured data** | `highPrice: 399` but highest plan is $249 | Fix to match actual pricing |
| **Notification settings** | UI toggles exist but don't persist | Either wire to a table or remove the tab |
| **OAuth loading state** | `googleLoading` shared for Google and Apple buttons | Separate into per-provider states |
| **Dead footer links** | "Use Cases" links all point to `#` | Wire to real pages or remove |
| **Marketing claims** | "500+ Agencies", "10,000+ Creators" hardcoded | Soften or verify |
| **Console logging** | 85+ `console.log` calls in production | Replace with `createLogger()` |

---

## Recommended Implementation Order

### Phase 1 — Security (must-fix before any real users)
- DB migration: restrict `agencies` UPDATE policy to non-billing columns
- DB migration: restrict `employee_of_permissions` writes to agency users
- DB migration: fix `session_access_logs` and `messages` policies
- Add `GHL_WEBHOOK_SECRET` secret

### Phase 2 — Auth flows
- Add "Forgot Password" + `/reset-password` page
- Add "Resend verification" button with cooldown
- Fix OAuth loading state bug

### Phase 3 — Payments
- Either: Enable Stripe via Lovable's native integration (simpler, no GHL dependency)
- Or: Configure GHL payment funnel URLs and return them from `ghl-create-checkout`

### Phase 4 — Polish
- Update SEO meta for production domain
- Fix dead footer links
- Remove non-functional notification settings
- Clean up console.log statements
- Fix structured data pricing

Shall I start implementing? I recommend beginning with Phase 1 (security migrations) and Phase 2 (auth flows) together.

