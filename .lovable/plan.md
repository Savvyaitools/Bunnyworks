

# CDP Capabilities Audit and Roadmap

## What You Already Have (Built)

| Capability | CDP Domain | Status |
|---|---|---|
| Page navigation (back/forward/reload/goto) | `Page.navigate`, `Runtime.evaluate` | Done |
| Login state detection (CSS + AI fallback) | `Runtime.evaluate` | Done |
| Auto-login (type email, password, click submit) | `Runtime.evaluate` with native setter | Done |
| Earnings scraping (XHR interception + DOM fallback) | `Network.enable`, `Network.getResponseBody`, `Runtime.evaluate` | Done |
| Cookie verification | `Network.getCookies` | Done |
| Timezone/locale spoofing | `Emulation.setTimezoneOverride`, `Emulation.setLocaleOverride` | Done |
| Sidebar restriction injection (CSS hide) | `Runtime.evaluate` (inject `<style>`) | Done |
| Chat context reading (Izzy/Jodie) | `Runtime.evaluate` (DOM scrape) | Done |
| Chat text injection | `Runtime.evaluate` (native setter) | Done |
| Profile warmup (visit sites, scroll) | `Page.navigate`, `Runtime.evaluate` | Done |
| Arbitrary JS execution | `Runtime.evaluate` | Done |
| CAPTCHA event detection | Browserbase logs API | Done |

## What You Can Add with CDP (No Stagehand Needed)

### 1. Auto-Credential Capture on First Manual Login
When an agency owner manually logs in for the first time, CDP can **intercept the login form submission** and automatically save the credentials to `creator_credential_submissions` — so you never lose them again.

**How:** `Network.requestWillBeSent` event listener watches for POST requests to OnlyFans login endpoints. Extract email/password from the request body, base64-encode the password, and upsert into the database.

### 2. Fan List / Subscriber Scraping
Scrape `/my/subscribers/active` to extract fan usernames, subscription dates, and spend tiers. Upsert into `of_fans`.

**How:** Navigate via CDP, then `Runtime.evaluate` to extract the subscriber table DOM or intercept `/api2/v2/subscriptions` XHR responses (same pattern as earnings scraper).

### 3. Chat History Scraping
Scrape `/my/chats` to pull recent conversation lists — fan names, last message time, unread count. Feed into `of_chats`.

**How:** Same XHR interception pattern targeting `/api2/v2/chats` endpoints.

### 4. Mass Message Automation
Type and send mass messages via CDP — fill in the compose form, attach vault content, select recipients, and click send.

**How:** Same `Runtime.evaluate` pattern as `inject_chat_text` but targeting the mass message composer at `/my/mass_messages/create`.

### 5. Vault Content Listing
Scrape `/my/vault` to catalog all uploaded media (images, videos) with metadata. Feed into content vault tracking.

**How:** DOM extraction or XHR interception on vault API endpoints.

### 6. Post Scheduling / Auto-Posting
Fill in the post composer form — text, price, media attachments, schedule date — and submit. Enables scheduled content posting.

**How:** `Runtime.evaluate` to interact with the post creation form at `/my/posts/create`.

### 7. Notification Scraping
Read `/my/notifications` to detect new subscribers, tips, purchases, and expired subs. Feed into real-time activity feeds.

**How:** XHR interception on notification API endpoints or DOM scraping.

### 8. Screenshot Capture
Take screenshots of the live session for QC review, proof of work, or debugging.

**How:** `Page.captureScreenshot` CDP command. Returns base64 PNG. Store in the `content-vault` bucket.

### 9. Auto-2FA Handler
When a 2FA/email code is needed during login, detect the 2FA input field via DOM inspection, then prompt the agency owner (via push notification or in-app alert) to enter the code. Once entered, type it via CDP.

**How:** `Runtime.evaluate` to detect 2FA form, then `inject_chat_text`-style typing once the user provides the code through the UI.

### 10. Cookie Export/Import
Export all cookies from a session and store them as JSON. Import them into new sessions for cross-device or backup restoration.

**How:** `Network.getAllCookies` to export, `Network.setCookies` to import.

### 11. DOM Mutation Monitoring
Watch for real-time DOM changes (new messages arriving, notifications popping up) and trigger actions.

**How:** `Runtime.evaluate` to install a `MutationObserver`, then poll results or use `Runtime.addBinding` + `Runtime.bindingCalled` events.

### 12. Network Request Blocking
Block analytics trackers, ad scripts, or specific endpoints to speed up page loads and reduce fingerprint surface.

**How:** `Network.setBlockedURLs` or `Fetch.enable` with request interception patterns.

## Priority Recommendation

```text
HIGH IMPACT (build next):
  1. Auto-Credential Capture    ← solves your recurring credential loss problem
  2. Screenshot Capture         ← enables QC workflows
  3. Fan List Scraping          ← feeds fan analytics dashboard

MEDIUM IMPACT:
  4. Chat History Scraping      ← powers messaging analytics
  5. Notification Scraping      ← real-time activity feed
  6. Cookie Export/Import       ← backup & cross-device

LOWER PRIORITY:
  7. Mass Message Automation
  8. Post Scheduling
  9. Auto-2FA Handler
 10. Network Request Blocking
```

All of these use the exact same CDP WebSocket pattern you already have in `cdp-helpers.ts` — connect, `Target.getTargets`, `Target.attachToTarget`, then the relevant domain commands. No new dependencies needed.

