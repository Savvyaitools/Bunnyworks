

# Auto-Upload Both Chrome Extensions to Browserbase

## Overview
Create an edge function that programmatically uploads both Chrome extensions (Permission Guard + Analytics Scraper) to Browserbase via their REST API, and a UI to activate them with one click from the Browser page.

## What Gets Uploaded

### Extension 1: Permission Guard
- Hides the OnlyFans sidebar menu
- Blocks restricted pages based on employee permissions
- Files: `manifest.json`, `content.js`, `blocked.css`

### Extension 2: Analytics Scraper (Browser Sync)
- Detects extension presence on OnlyFans/Fansly pages
- Extracts page data for importing analytics
- Files: `manifest.json`, `content.js`, `background.js`
- Note: `popup.html` and `popup.js` are excluded since they are not needed in headless Browserbase sessions

## Technical Plan

### 1. New Edge Function: `upload-browserbase-extension`
- Accepts a `type` parameter: `"permission_guard"` or `"analytics_scraper"`
- Embeds extension file contents as string constants directly in the function (no file system access in edge functions)
- Constructs a ZIP file in memory using raw ZIP binary format
- Calls `POST https://api.browserbase.com/v1/extensions` with `multipart/form-data` and the ZIP as the `file` field
- On success, saves the returned Browserbase extension ID into the `browser_extensions` table with `auto_inject = true` and `is_active = true`
- Uses existing `BROWSERBASE_API_KEY` secret

### 2. Fix Permission Guard manifest.json
- Remove the `icons` section (references broken paths `../chrome-extension/icons/`)
- Extension works without icons in Browserbase headless sessions

### 3. UI: Extension Activation Card on Browser Page
- Add an "Extensions" tab or card section on `src/pages/BrowserSync.tsx`
- Two cards: "Permission Guard" and "Analytics Scraper"
- Each shows status (Not Uploaded / Active) by checking `browser_extensions` table
- "Activate" button calls the edge function to upload and register
- Once active, shows green badge -- extensions auto-inject into all future sessions

### 4. Hook: `useExtensionUpload`
- Mutation hook that calls `upload-browserbase-extension` edge function
- Invalidates the `browser-extensions` query on success

### Files to Create
- `supabase/functions/upload-browserbase-extension/index.ts`

### Files to Modify
- `chrome-extension-permissions/manifest.json` -- remove broken icon paths
- `src/pages/BrowserSync.tsx` -- add Extensions tab with activation buttons
- `src/hooks/useBrowserFeatures.ts` -- add `useExtensionUpload` mutation hook

### Config
- Add `verify_jwt = false` entry in `supabase/config.toml` for the new function

## How It Works After Implementation

1. Go to Browser page, open Extensions tab
2. Click "Activate Permission Guard" -- extension is zipped, uploaded to Browserbase, and registered
3. Click "Activate Analytics Scraper" -- same process
4. All future browser sessions (admin + chatter) automatically load both extensions
5. OnlyFans sidebar is hidden, restricted pages are blocked, and analytics data extraction markers are injected

