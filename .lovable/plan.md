

# Browser Session Workflow — Safety-First Architecture

## Priority Order
1. **Account Safety** — Never overwrite valid cookies; fail-open on all ambiguous states
2. **Logged-In Sessions** — Verify login state at every session boundary (launch, close, terminate)
3. **Analytics Import** — Auto-scrape earnings on save_and_close; periodic cron scraping

## Key Architectural Improvements

### 1. Reusable `checkLoginViaCDP()` Helper
Eliminated 3x code duplication (~150 lines removed). Single function handles:
- CDP WebSocket connection + page target attachment
- CSS selector pre-check (`.b-tabs`, `.l-header__menu`, `form.b-loginreg`, etc.)
- AI fallback via Gemini-2.5-flash for ambiguous cases
- Fail-open on empty CDP data (preserves cookies)

### 2. CDP Cookie Verification (`verifyCookiesRestored()`)
After the 8-second context restoration wait, actually verifies cookies were loaded using `Network.getCookies`. Creates a `cookie_restoration_failed` alert if zero cookies found for the target domain.

### 3. Cookie-Safe `terminate_session`
Previously released sessions without cookie tracking. Now:
- Explicitly releases with cookie persistence (REQUEST_RELEASE defaults to persist)
- Updates `last_saved_at` on creator_session_links
- Clears `browserbase_session_id` and `browserbase_live_url` from the link

### 4. Dead Session Fail-Open in `save_and_close`
If session is dead when save_and_close is called:
- Previously authenticated → fail-open, preserve "authenticated" status
- Not authenticated → no persist (correct behavior)

## Session Lifecycle

### Admin Session Launch (`create_admin_session`)
```
1. Resolve/create persistent browser context
2. Create Browserbase session (advancedStealth, geo-matched proxy)
3. Wait for RUNNING state (up to 20s)
4. Wait 8s for cookie/localStorage restoration
5. CDP cookie verification (Network.getCookies) — alert if 0 cookies
6. Set timezone & locale via CDP (preLoginSetup)
7. Navigate to platform URL via CDP
8. Login verification via checkLoginViaCDP()
   - If previously authenticated but login fails → "pending" + alert
   - If ambiguous/empty CDP data → fail-open
9. Get embed URL, persist to DB
```

### Chatter Session Launch (`launch_chatter_session`)
```
1. Verify permissions (employee_of_permissions)
2. Check for existing active session (pooling: shared/exclusive mode)
3. Create new Browserbase session with saved context
4. Wait for RUNNING state (up to 20s)
5. Wait 8s for cookie restoration
6. Set timezone & locale via CDP
7. Navigate to platform URL via CDP
8. Login verification via checkLoginViaCDP()
   - If login fails → "pending" + alert
9. Get embed URL, persist to DB
```

### Save & Close (`save_and_close`)
```
1. Login verification via checkLoginViaCDP()
   - Dead session + previously authenticated → fail-open (preserve)
   - Dead session + not authenticated → no persist
   - Alive: standard 2-phase check
2. CDP earnings scrape (XHR interception → AI extraction → regex fallback)
3. Upsert earnings to creator_earnings table
4. Release: REQUEST_RELEASE (logged in) or persist=false (not logged in)
```

### Terminate Session (`terminate_session`)
```
1. If last viewer leaving:
   - Release with cookie persistence (REQUEST_RELEASE)
   - Update last_saved_at timestamp
   - Clear session references from session link
2. If other viewers remain:
   - Remove viewer from list, update count
```

## AI-Powered Helpers
- `aiDetectLoginState(domText, url)` → `{ logged_in, confidence, reason }`
- `aiExtractEarnings(domText)` → `{ total, tips, subscriptions, messages, referrals, posts }`
- Model: `google/gemini-2.5-flash` via Lovable AI Gateway
- 10s timeout, graceful fallback on failure

## Key Safety Mechanisms
1. **Fail-open on empty CDP data** — If CDP returns no DOM/URL, always preserve cookies
2. **8-second cookie restoration wait** — Prevents racing ahead of Browserbase context restore
3. **CDP cookie verification** — Actually checks Network.getCookies after context restore
4. **Login alerts** — `browser_session_events` with `login_expired` / `cookie_restoration_failed`
5. **No-persist guard** — save_and_close only persists cookies when login is confirmed
6. **Dead session fail-open** — Previously authenticated sessions keep their status
7. **terminate_session persistence** — Always persists cookies and updates last_saved_at
8. **Stuck session recovery** — `check_and_recover_sessions` auto-heals dead sessions
