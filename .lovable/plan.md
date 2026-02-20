

# Backend Developer Briefing: Remaining Work

---

## Status: All Code-Level Issues RESOLVED ✅

The following issues from the original audit have been fixed:

1. ✅ **`refresh_all_contexts` auth bypass** — Moved below JWT auth check + added agency ownership verification (403 if not owner)
2. ✅ **Auth state race condition** — Added `useRef` deduplication to prevent duplicate `fetchProfile()` calls from `onAuthStateChange` + `getSession()`
3. ✅ **Scoped error boundaries** — Employee and Creator portal routes now have individual `ErrorBoundary` wrappers so a crash in one portal doesn't take down the app
4. ✅ **`ScrollReveal`/`GradientDivider` warnings** — Verified: no forwardRef issue exists; components use `motion.div` internally and don't receive external refs

---

## What Remains for Backend Developer

All remaining work is **browser session infrastructure development**, not bug fixes:

### Priority 1: Bright Data Hybrid Proxy Integration
- Add secrets: `BRIGHT_DATA_HOST`, `BRIGHT_DATA_USERNAME`, `BRIGHT_DATA_PASSWORD`
- Update `proxyConf()` in `browserbase-session/index.ts` to use `type: "external"` with Bright Data credentials
- Test with admin session creation against OnlyFans

### Priority 2: Edge Function Refactoring
- Split `browserbase-session/index.ts` (1,164 lines) into focused functions:
  - `browserbase-warmup` — Profile warmup logic
  - `browserbase-extensions` — Extension management
  - `browserbase-monitoring` — CAPTCHA checks, session events, recordings

### Priority 3: Chrome Extension (ReachOwl-Style)
- Build DOM scrapers for OF pages (earnings, fans, chats)
- Add `sync_structured` action to `ingest-browser-sync` edge function
- Implement persistent API keys (table `extension_api_keys` exists)

### Priority 4: NSTBrowser / Desktop App
- Evaluate NSTBrowser Cloud API or GoLogin Cloud API
- Build Node.js VPS relay server with noVNC/WebRTC streaming
- Add `BROWSER_BACKEND` feature flag for provider switching

### Priority 5: Supporting Features
- Push notifications: Create `public/sw.js` service worker
- Invoice PDF generation + email sending
- SOP signed URL downloads
- Calendar integration with shifts/tasks
