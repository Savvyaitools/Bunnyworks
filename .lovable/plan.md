

# Fix: Earnings Scrape Timing Issue

## Problem
The CDP scraper navigates to `onlyfans.com/my/statistics` and immediately reads `document.body.innerText` after `Page.loadEventFired`. But OnlyFans loads earnings data asynchronously via JavaScript/XHR -- the DOM only has ~15 characters at that point (a loading state). The regex parser finds nothing and skips the database update.

## Solution
Replace the single evaluate-after-load with a **polling loop** that waits for the page content to actually contain financial data before extracting.

## Changes

### File: `supabase/functions/browserbase-session/index.ts`

In the `navigateViaCDP` function (or in the save_and_close earnings scrape block), after the page load event fires:

1. **Add a polling loop** (up to 10 seconds, checking every 1.5s):
   - Execute `document.body.innerText` via CDP `Runtime.evaluate`
   - Check if the returned text contains earnings indicators (e.g., `$`, `earnings`, `tips`, `subscriptions`, or text length > 200 chars)
   - If found, break and proceed with parsing
   - If not found after all retries, log warning and proceed with empty result

2. **Replace the current single-shot evaluate** in the earnings scrape section with the polled result

### Pseudocode
```text
// After Page.loadEventFired:
let pageText = "";
for (let attempt = 0; attempt < 7; attempt++) {
  await sleep(1500);
  pageText = await cdpEvaluate("document.body.innerText");
  if (pageText.length > 200 && /\$[\d,]+/.test(pageText)) {
    break; // Content loaded
  }
}
// proceed with regex parsing on pageText
```

### Expected Outcome
- The scraper will wait up to ~10.5 seconds for OnlyFans to finish rendering earnings data
- Once dollar amounts appear in the DOM text, it extracts immediately (no unnecessary waiting)
- If the page never loads (e.g., logged out, error), it gracefully times out and still saves cookies
- No changes to the UI or other session logic

