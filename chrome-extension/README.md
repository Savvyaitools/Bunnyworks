# Creator OS Browser Sync Extension

A Chrome extension to sync data from creator platforms directly to Creator OS.

## Installation (Development)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select this `chrome-extension` folder
5. The extension should now appear in your toolbar

## Setup

1. Go to Creator OS → Integrations → Browser Sync
2. Enable Browser Sync
3. Generate a temporary token (valid for 10 minutes)
4. Click "Open Browser Sync Extension" or paste the token manually
5. Click "Connect" in the extension popup

## Usage

1. Navigate to OnlyFans or Fansly
2. Go to the page you want to capture (e.g., earnings/statistics)
3. Click the Creator OS extension icon
4. Click "Sync Current Page"
5. The screenshot will be sent to Creator OS for processing
6. Check your Manual Data Import queue for the synced data

## Supported Platforms

- OnlyFans
- Fansly

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup UI
- `popup.js` - Popup logic
- `background.js` - Background service worker
- `content.js` - Content script injected into pages
- `icons/` - Extension icons (you'll need to add these)

## Icons

Create icons in the following sizes and place them in an `icons/` folder:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

## Notes

- Tokens expire after 10 minutes for security
- Screenshots are processed by AI to extract metrics
- Data appears in the Manual Data Import review queue
