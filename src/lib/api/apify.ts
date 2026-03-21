import { supabase } from "@/integrations/supabase/client";

type ApifyResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Run any Apify actor and return the dataset items.
 */
export async function runApifyActor<T = any>(
  actorId: string,
  input: Record<string, unknown> = {},
  options?: { maxItems?: number; timeoutSecs?: number }
): Promise<ApifyResponse<T[]>> {
  const { data, error } = await supabase.functions.invoke("apify-actor", {
    body: { actorId, input, maxItems: options?.maxItems, timeoutSecs: options?.timeoutSecs },
  });

  if (error) return { success: false, error: error.message };
  return data;
}

// ── Pre-configured platform scrapers ─────────────────────────────

/** Scrape trending TikTok videos by hashtag or keyword */
export async function scrapeTikTokTrends(query: string, maxItems = 20) {
  return runApifyActor("clockworks/free-tiktok-scraper", {
    hashtags: [query],
    resultsPerPage: maxItems,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
  }, { maxItems, timeoutSecs: 120 });
}

/** Scrape Instagram posts by hashtag */
export async function scrapeInstagramTrends(hashtag: string, maxItems = 20) {
  return runApifyActor("apify/instagram-hashtag-scraper", {
    hashtags: [hashtag.replace(/^#/, "")],
    resultsLimit: maxItems,
  }, { maxItems, timeoutSecs: 120 });
}

/** Scrape Reddit posts from a subreddit or search */
export async function scrapeRedditTrends(query: string, maxItems = 20) {
  return runApifyActor("trudax/reddit-scraper-lite", {
    startUrls: [{ url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&sort=top&t=week` }],
    maxItems,
    sort: "top",
  }, { maxItems, timeoutSecs: 120 });
}

/** Scrape Twitter/X posts by search query */
export async function scrapeTwitterTrends(query: string, maxItems = 20) {
  return runApifyActor("quacker/twitter-scraper", {
    searchTerms: [query],
    maxTweets: maxItems,
    sort: "Top",
  }, { maxItems, timeoutSecs: 120 });
}

/**
 * Unified trend search across platforms.
 * Returns scraped content formatted for AI analysis.
 */
export async function searchPlatformTrends(
  platform: string,
  query: string,
  maxItems = 15
): Promise<{ success: boolean; formattedContent: string; rawItems: any[] }> {
  let result: ApifyResponse;

  switch (platform) {
    case "tiktok":
      result = await scrapeTikTokTrends(query, maxItems);
      break;
    case "instagram":
      result = await scrapeInstagramTrends(query, maxItems);
      break;
    case "reddit":
      result = await scrapeRedditTrends(query, maxItems);
      break;
    case "twitter":
      result = await scrapeTwitterTrends(query, maxItems);
      break;
    default: {
      // For "all" — run TikTok + Instagram in parallel
      const [tiktok, instagram] = await Promise.all([
        scrapeTikTokTrends(query, 8),
        scrapeInstagramTrends(query, 8),
      ]);
      const items = [...(tiktok.data || []), ...(instagram.data || [])];
      result = { success: items.length > 0, data: items };
      break;
    }
  }

  if (!result.success || !result.data?.length) {
    return { success: false, formattedContent: "", rawItems: [] };
  }

  const formatted = result.data.slice(0, maxItems).map((item: any) => {
    // Normalize across different actor output formats
    const title = item.text || item.caption || item.title || item.fullText || "";
    const url = item.url || item.webVideoUrl || item.shortcode
      ? `https://www.instagram.com/p/${item.shortcode}/`
      : item.permalink || "";
    const views = item.playCount || item.videoViewCount || item.views || 0;
    const likes = item.diggCount || item.likesCount || item.likes || item.ups || 0;
    const comments = item.commentCount || item.commentsCount || item.comments || item.numComments || 0;
    const shares = item.shareCount || item.shares || 0;
    const author = item.authorMeta?.name || item.ownerUsername || item.author || item.user?.username || "";
    const platformLabel = item.platform || platform;

    return `Title: ${title.slice(0, 300)}
URL: ${url}
Platform: ${platformLabel}
Author: ${author}
Views: ${views.toLocaleString()} | Likes: ${likes.toLocaleString()} | Comments: ${comments.toLocaleString()} | Shares: ${shares.toLocaleString()}`;
  }).join("\n\n---\n\n");

  return { success: true, formattedContent: formatted, rawItems: result.data };
}
