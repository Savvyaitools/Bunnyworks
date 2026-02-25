

# Enable Browserbase Advanced Stealth (7-Day Trial)

Browserbase just enabled Advanced Stealth on your account. Here's the plan to turn it on and get browser sessions working properly.

## What Changes

### 1. Enable `advancedStealth: true` in session config

In the `sessionBody()` function (line 203-217), add `advancedStealth: true` to `browserSettings`. According to the docs, CAPTCHA solving is **included automatically** with Advanced Stealth -- no separate `solveCaptchas` flag needed.

### 2. Keep proxies enabled (required)

The Browserbase team confirmed Advanced Stealth works best with proxies. Your existing `proxyConf()` with `type: "browserbase"` residential proxies and state-level geo-pinning stays exactly as-is. This is the recommended setup.

### 3. Remove the custom stealth script injection

With Advanced Stealth, Browserbase handles fingerprinting at the browser level (canvas, WebGL, audio, navigator, etc.) -- far more effective than our JS-level patches. The custom `STEALTH_SCRIPT` (~80 lines of canvas noise, WebGL spoofing, AudioContext noise, etc.) should be **removed** to avoid conflicts with Browserbase's native stealth. The CDP calls that inject it via `Page.addScriptToEvaluateOnNewDocument` will be cleaned up.

### 4. Simplify `browserFingerprint()` 

The docs say: "With Advanced Stealth Mode, we handle fingerprinting and viewport configuration for you." We can simplify our fingerprint config to just specify OS preference (Windows) and let Browserbase handle the rest, or keep it minimal as a hint.

## Technical Details

**File changed:** `supabase/functions/browserbase-session/index.ts`

**Changes:**

1. **`sessionBody()` function (line 203-217):** Add `advancedStealth: true` to `browserSettings`. Remove the old comment about Enterprise plan.

2. **`STEALTH_SCRIPT` constant (line 292+):** Remove the entire ~80 line stealth injection script (canvas noise, WebGL spoofing, AudioContext noise, navigator overrides, WebRTC leak prevention, battery API spoofing, plugin spoofing).

3. **All CDP calls injecting `STEALTH_SCRIPT`:** Find every `Page.addScriptToEvaluateOnNewDocument` call that injects `STEALTH_SCRIPT` and remove them. The pre-login warmup browsing (Google/YouTube navigation) stays -- only the stealth injection is removed.

4. **`browserFingerprint()` (line 191-197):** Simplify to just hint at OS preference since Browserbase now manages the full fingerprint.

## What Does NOT Change

- Proxy configuration (`proxyConf()` with state rotation) -- stays as-is
- Session lifecycle (create, save, launch, terminate, heartbeat)
- Context persistence
- Warmup browsing logic (Google/YouTube pre-login navigation)
- Session pooling
- All frontend components
- Database schema

## Expected Result

- Browser sessions will load OnlyFans successfully (no more DNS errors)
- CAPTCHAs will be solved automatically by Browserbase
- Browser fingerprint will be native-grade (not JS patches)
- Existing geo-pinned residential proxies continue working

