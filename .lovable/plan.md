

# Browser Session Workflow — Safety-First Architecture

## Priority Order
1. **Account Safety** — Never overwrite valid cookies; fail-open on ambiguous states
2. **Logged-In Sessions** — Verify login state at every session boundary (launch, close, chatter join)
3. **Analytics Import** — Auto-scrape earnings on save_and_close; periodic cron scraping

## Session Lifecycle

### Admin Session Launch (`create_admin_session`)
```
1. Resolve/create persistent browser context
2. Create Browserbase session (advancedStealth, geo-matched proxy)
3. Wait for RUNNING state (up to 20s)
4. Wait 8s for cookie/localStorage restoration ← increased from 5s
5. Set timezone & locale via CDP (preLoginSetup)
6. Navigate to platform URL via CDP
7. NEW: 2-phase login verification (CSS selectors + AI fallback)
   - If previously authenticated but login fails → set status "pending", create alert event
   - If ambiguous/empty CDP data → fail-open (preserve cookies)
8. Get embed URL, persist to DB
```

### Chatter Session Launch (`launch_chatter_session`)
```
1. Verify permissions (employee_of_permissions)
2. Check for existing active session (pooling: shared/exclusive mode)
3. Create new Browserbase session with saved context
4. Wait for RUNNING state (up to 20s)
5. Wait 8s for cookie restoration ← increased from 5s
6. Set timezone & locale via CDP
7. Navigate to platform URL via CDP
8. UPGRADED: 2-phase login verification (CSS + AI fallback) ← was CSS-only
   - Fixed: chatterStartUrl was undefined → now uses PLATFORM_URLS[platform]
   - If login fails → set status "pending", create alert event
9. Get embed URL, persist to DB
```

### Save & Close (`save_and_close`)
```
1. 2-phase login verification (CSS pre-check + AI fallback)
   - Empty CDP data → fail-open (preserve cookies)
   - CSS "logged_in" → persist
   - CSS "not_logged_in" → skip persist (protect existing cookies)
   - CSS "ambiguous" → AI detection via Gemini-2.5-flash
2. CDP earnings scrape (XHR interception → AI extraction → regex fallback)
3. Upsert earnings to creator_earnings table
4. Release session: REQUEST_RELEASE with persist=true (logged in) or persist=false (not logged in)
```

## AI-Powered Helpers
- `aiDetectLoginState(domText, url)` → `{ logged_in, confidence, reason }`
- `aiExtractEarnings(domText)` → `{ total, tips, subscriptions, messages, referrals, posts }`
- Model: `google/gemini-2.5-flash` via Lovable AI Gateway
- 10s timeout, graceful fallback on failure

## Key Safety Mechanisms
1. **Fail-open on empty CDP data** — If CDP returns no DOM/URL, always preserve cookies
2. **8-second cookie restoration wait** — Prevents racing ahead of Browserbase context restore
3. **Login alerts** — `browser_session_events` with `login_expired` type for monitoring
4. **No-persist guard** — save_and_close only persists cookies when login is confirmed
5. **Stuck session recovery** — `check_and_recover_sessions` auto-heals dead sessions
