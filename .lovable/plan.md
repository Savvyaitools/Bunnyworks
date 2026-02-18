
# Stagehand Integration into Browserbase Edge Function

## What Changes

Replace all raw CDP (Chrome DevTools Protocol) code in `browserbase-session/index.ts` with Stagehand's AI-powered primitives (`act()`, `extract()`, `observe()`), and introduce new Stagehand-powered workflows for analytics, login verification, and future content automation.

## Why Stagehand

Our current implementation manually constructs WebSocket CDP messages, writes brittle DOM selectors, and extracts raw `innerText` blobs. Stagehand replaces all of this with natural language commands that:

- **Self-heal**: If a page layout changes, Stagehand adapts automatically
- **Extract structured data**: Returns typed JSON via Zod schemas instead of raw text
- **Simulate human behavior**: `act()` clicks, types, and scrolls like a real user
- **Handle complex flows**: `agent()` can autonomously complete multi-step tasks like login recovery

## LLM Configuration

Stagehand requires an LLM to interpret pages. We already have the **Lovable AI Gateway** (`LOVABLE_API_KEY`) which is OpenAI-compatible. Stagehand supports custom endpoints:

```text
model: {
  modelName: "openai/gpt-5-mini",
  apiKey: LOVABLE_API_KEY,
  baseURL: "https://ai.gateway.lovable.dev/v1"
}
```

This means **zero additional API keys needed** -- we use the same gateway already powering Tatum, Felix, and Izzy.

Using `gpt-5-mini` for Stagehand keeps costs low while providing strong enough vision/reasoning for page understanding.

## Workflows to Upgrade

### 1. Auto-Navigation (Admin + Chatter Sessions)

**Current (raw CDP):**
```text
ws.send(JSON.stringify({ id: 1, method: "Page.navigate", params: { url } }));
// Manual WebSocket message handling, timeout logic
```

**With Stagehand:**
```text
await page.goto("https://onlyfans.com");
await page.act("wait for the page to fully load");
```

The entire `navigateSession()` helper function (lines 19-38) gets replaced. Stagehand handles connection, navigation, and waiting natively.

### 2. Profile Warmup -- Generic Phase

**Current:** Sequential `Page.navigate` + `Runtime.evaluate("window.scrollTo()")` -- robotic behavior.

**With Stagehand:**
```text
await page.goto("https://www.google.com");
await page.act("type 'best movies 2026' into the search bar and press Enter");
await page.act("scroll down slowly and click on one of the results");
await page.act("scroll through the page for a few seconds");
```

This creates genuinely human-like browsing patterns. Each warmup visit becomes a mini interaction instead of a static page load.

### 3. Research Runs -- Intelligence Extraction

**Current:** Raw `document.body.innerText.substring(0, 2000)` -- unstructured text blob dumped into `warmup_intelligence`.

**With Stagehand + Zod schemas:**
```text
// Search Google
await page.goto("https://www.google.com/search?q=onlyfans+marketing+strategy+2026");

// Extract structured search results
const results = await page.extract(
  "extract the top 5 search result titles, URLs, and snippet descriptions",
  z.object({
    results: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    }))
  })
);

// Visit each result and extract deeper intelligence
for (const result of results.results.slice(0, 3)) {
  await page.goto(result.url);
  const intel = await page.extract(
    "extract the main article content, key takeaways, and any statistics mentioned",
    z.object({
      mainContent: z.string(),
      keyTakeaways: z.array(z.string()),
      statistics: z.array(z.string()).optional(),
      topic: z.string(),
    })
  );
  // Save structured intelligence to warmup_intelligence table
}
```

This gives Tatum **structured, categorized intelligence** instead of raw text dumps.

### 4. OnlyFans Analytics Scraping (on save_and_close)

**New workflow** -- after an admin saves a session, before releasing it, Stagehand scrapes analytics:

```text
// Navigate to analytics
await page.act("click on the Statistics menu item");

// Extract earnings
const earnings = await page.extract(
  "extract all visible earnings data including total, subscriptions, tips, messages, and referrals",
  z.object({
    totalNet: z.number(),
    subscriptions: z.number(),
    tips: z.number(),
    messages: z.number(),
    referrals: z.number().optional(),
    period: z.string().optional(),
  })
);

// Navigate to subscribers
await page.act("go to the Subscribers or Fans section");
const fans = await page.extract(
  "extract the total subscriber count and active subscriber count",
  z.object({
    totalSubscribers: z.number(),
    activeSubscribers: z.number(),
  })
);

// Navigate to posts
await page.act("go to the Posts section");
const posts = await page.extract(
  "extract the 5 most recent posts with their likes, comments, and tips",
  z.object({
    posts: z.array(z.object({
      text: z.string(),
      likes: z.number(),
      comments: z.number(),
      tips: z.number().optional(),
    }))
  })
);
```

This replaces the existing CDP scraper with self-healing extraction that adapts if OnlyFans changes their UI.

### 5. Login State Verification

**New capability** -- before launching chatter sessions, verify the creator is actually logged in:

```text
const loginState = await page.extract(
  "check if the user is logged in to OnlyFans. Look for profile menu, dashboard elements, or login/signup buttons",
  z.object({
    isLoggedIn: z.boolean(),
    username: z.string().optional(),
    indicator: z.string(), // what element confirmed the state
  })
);
```

If not logged in, the system can flag the session link as needing re-authentication instead of letting chatters hit a login wall.

### 6. Reddit/Twitter Trend Scraping (Research Runs)

**Current:** Navigates to Reddit/Twitter and dumps `innerText`.

**With Stagehand:**
```text
await page.goto("https://www.reddit.com/r/onlyfansadvice/");
const redditPosts = await page.extract(
  "extract the top 10 post titles, upvote counts, comment counts, and post URLs from this subreddit",
  z.object({
    posts: z.array(z.object({
      title: z.string(),
      upvotes: z.number(),
      comments: z.number(),
      url: z.string(),
    }))
  })
);
```

This gives Tatum actual post-level trend data with engagement metrics.

### 7. Future: Autonomous Content Posting (agent mode)

Stagehand's `agent()` can handle multi-step autonomous workflows. Future use:

```text
await stagehand.agent("Navigate to the new post page, upload the image, add the caption 'Summer vibes', set the price to $5, and publish the post");
```

This is not part of the initial implementation but becomes possible once Stagehand is integrated.

## Architecture

```text
browserbase-session/index.ts
+-- Import: npm:@browserbasehq/stagehand
+-- Import: npm:zod (for extract schemas)
|
+-- Helper: createStagehandSession(sessionId)
|   Returns initialized Stagehand instance connected to existing BB session
|   Uses Lovable AI gateway as LLM backend
|
+-- Schemas (Zod):
|   +-- searchResultsSchema
|   +-- articleIntelligenceSchema
|   +-- ofEarningsSchema
|   +-- ofSubscriberSchema
|   +-- ofPostsSchema
|   +-- loginStateSchema
|   +-- redditPostsSchema
|
+-- Actions (modified to use Stagehand):
    +-- create_admin_session    -> page.goto + page.act for navigation
    +-- save_and_close          -> NEW: scrape analytics before release
    +-- launch_chatter_session  -> page.goto + observe for login check
    +-- warmup_single_profile   -> act() for human-like browsing
    +-- warmup_single_profile   -> extract() for structured research
```

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/browserbase-session/index.ts` | Add Stagehand import, create helper, replace CDP code in warmup/research/navigation, add analytics scraping on save_and_close, add login verification |
| `src/components/browser/ProfileWarmupManager.tsx` | Update intelligence feed display to show structured data (key takeaways, statistics) instead of raw text |
| `src/hooks/useProfileWarmups.ts` | No changes needed -- data shape stays compatible |
| `supabase/functions/ai-social-media-manager/index.ts` | Update Tatum's intelligence query to leverage new structured fields |

## Database Changes

**Migration: Add structured columns to `warmup_intelligence`**

| Column | Type | Purpose |
|--------|------|---------|
| `key_takeaways` | `text[]` | Structured takeaways from extracted articles |
| `statistics` | `text[]` | Numbers/stats mentioned in content |
| `engagement_metrics` | `jsonb` | For Reddit/Twitter: upvotes, comments, etc. |
| `content_type` | `text` | `search_result`, `article`, `reddit_post`, `tweet` |

No new tables needed -- we enhance the existing `warmup_intelligence` table.

## Implementation Sequence

1. **Add Stagehand dependency** and create the `createStagehandSession()` helper with Lovable AI gateway config
2. **Replace `navigateSession()`** with Stagehand page.goto + page.act (affects admin + chatter launches)
3. **Upgrade warmup generic phase** -- replace CDP nav/scroll with act() commands for human-like browsing
4. **Upgrade research phase** -- replace raw text extraction with extract() + Zod schemas for structured intelligence
5. **Add analytics scraping to save_and_close** -- extract earnings, subscribers, posts before session release
6. **Add login state verification** to chatter session launch -- observe/extract login state before proceeding
7. **Run migration** to add structured columns to `warmup_intelligence`
8. **Update frontend** -- display structured intelligence (takeaways, stats) instead of raw text blobs
9. **Update Tatum** -- query structured intelligence fields for richer AI recommendations

## Edge Function Size Consideration

Stagehand's npm package is ~2.5MB. Deno edge functions support npm imports, and the Stagehand v3 core communicates directly via CDP (no Playwright dependency at runtime). The import would be:

```text
import { Stagehand } from "npm:@browserbasehq/stagehand";
import { z } from "npm:zod";
```

If the bundle size causes cold-start issues, we can create a separate `stagehand-automation` edge function dedicated to Stagehand-powered workflows and keep the lightweight session management (create, terminate, heartbeat) in the existing function.

## Risk Mitigation

- **Stagehand + Deno compatibility**: Stagehand v3 removed the Playwright dependency and uses CDP directly, which improves Deno compatibility. If issues arise, we fall back to the existing CDP code for critical paths (session create/terminate) and use Stagehand only for warmup/research/scraping.
- **LLM costs**: Using `gpt-5-mini` via Lovable AI keeps per-call costs minimal. Each warmup site visit = ~1 LLM call. A full warmup (10 sites) = ~10 calls. Research (5 keywords x 3 results) = ~20 calls. Analytics scraping = ~3 calls per session close.
- **Rate limits**: Warmup runs are not time-critical, so we can add delays between Stagehand calls to stay within Lovable AI rate limits.
