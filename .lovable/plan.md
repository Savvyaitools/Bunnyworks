

# Custom Proxy & Stealth Layer on Browserbase

## Current State

The platform exclusively uses **Browserbase's built-in proxies** (`type: "browserbase"` with geolocation). The `proxyConf()` function in `cdp-helpers.ts` always returns `[{ type: "browserbase", geolocation: { country, state, city } }]`. Stealth is limited to the `BROWSERBASE_ADVANCED_STEALTH` env flag which toggles `advancedStealth: true` and `os: "windows"` in the Browserbase session config.

## What Changes

### 1. Database: Per-Creator Proxy Provider Settings

Add a `creator_proxy_configs` table storing custom proxy credentials per creator:

```text
creator_proxy_configs
├── id (uuid PK)
├── creator_id (FK → creators)
├── agency_id (FK → agencies)
├── provider (enum: 'browserbase' | 'brightdata' | 'custom')
├── proxy_host (text, encrypted)
├── proxy_port (int)
├── proxy_username (text, encrypted)
├── proxy_password (text, encrypted)
├── proxy_protocol (enum: 'http' | 'socks5')
├── is_active (bool, default true)
├── label (text, e.g. "Bright Data US Residential")
└── created_at / updated_at
```

Also add a `stealth_profile` JSONB column to `creator_session_links` or `creator_proxy_configs` for per-creator fingerprint overrides (user agent, screen res, WebGL vendor, etc.).

### 2. Edge Function: Hybrid Proxy Support in `proxyConf`

Update `proxyConf()` in `cdp-helpers.ts` to check if the creator has a custom proxy config. If so, return Browserbase's `type: "external"` proxy format:

```text
// Browserbase external proxy format:
[{
  type: "external",
  server: "http://proxy-host:port",
  username: "user",
  password: "pass"
}]
```

When `provider === 'brightdata'`, auto-construct the Bright Data super-proxy URL with geo-targeting baked into the username (e.g., `brd-customer-XXXX-zone-residential-country-us-state-texas`).

When `provider === 'browserbase'`, keep current behavior.

### 3. CDP-Injected Stealth Layer

Add a `injectStealthFingerprint()` helper in `cdp-helpers.ts` that runs after session creation via `Runtime.evaluate`. This injects JavaScript overrides for:

- **Navigator spoofing**: `navigator.webdriver = false`, platform, hardwareConcurrency, deviceMemory
- **Canvas fingerprint noise**: Add subtle pixel noise to `HTMLCanvasElement.toDataURL` and `toBlob`
- **WebGL spoofing**: Override `UNMASKED_VENDOR_WEBGL` and `UNMASKED_RENDERER_WEBGL`
- **Timezone consistency**: Match `Intl.DateTimeFormat` to proxy geo
- **Screen resolution**: Override `screen.width/height` to common values
- **Plugin/language masking**: Spoof `navigator.plugins` and `navigator.languages`

This runs via `executeCDPScript()` on every session launch (admin and chatter), called right after `preLoginSetup()`.

### 4. UI: Proxy Provider Manager

Add a "Proxy Provider" section to the existing **Proxy Settings** tab on the Browser Sync page. Per creator:

- Toggle between Browserbase (default), Bright Data, or Custom
- Input fields for host, port, username, password when Custom/Bright Data selected
- Test button that creates a throwaway session and verifies IP via `https://httpbin.org/ip`
- Display current detected IP and geolocation

### 5. Stealth Settings UI

Add a collapsible "Stealth Profile" card on the Proxy Settings tab:

- Toggle for custom fingerprint injection (on/off)
- Optional overrides: User Agent string, screen resolution, WebGL renderer
- Defaults auto-generated per creator for consistency across sessions

## Implementation Order

1. Migration: `creator_proxy_configs` table with RLS
2. Update `proxyConf()` and `sessionBody()` in `cdp-helpers.ts` to support external proxies
3. Add `injectStealthFingerprint()` CDP helper
4. Wire stealth injection into `create_admin_session` and `launch_chatter_session` flows
5. Build Proxy Provider Manager UI component
6. Build Stealth Profile UI component
7. Add proxy test endpoint (`test_proxy` action in edge function)

## Technical Details

- Bright Data residential proxy format: `http://brd-customer-{CID}-zone-{ZONE}-country-{CC}-state-{ST}:{PASS}@brd.superproxy.io:22225`
- Browserbase `type: "external"` passes proxy to the browser instance directly — Browserbase handles the tunnel
- Stealth scripts use `Page.addScriptToEvaluateOnNewDocument` (not `Runtime.evaluate`) so overrides persist across navigations
- Proxy credentials stored with RLS scoped to `agency_id`
- Secret management: Bright Data API key stored via `add_secret` tool as `BRIGHTDATA_CUSTOMER_ID` and `BRIGHTDATA_ZONE_PASSWORD`

