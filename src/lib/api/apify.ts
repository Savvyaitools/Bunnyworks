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
  // clockworks/tiktok-scraper is the maintained actor; supports keyword search
  return runApifyActor("clockworks/tiktok-scraper", {
    searchQueries: [query],
    resultsPerPage: maxItems,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadSubtitles: false,
  }, { maxItems, timeoutSecs: 180 });
}

/** Scrape Instagram posts/reels by hashtag */
export async function scrapeInstagramTrends(hashtag: string, maxItems = 20) {
  return runApifyActor("apify/instagram-hashtag-scraper", {
    hashtags: [hashtag.replace(/^#/, "").replace(/\s+/g, "")],
    resultsLimit: maxItems,
  }, { maxItems, timeoutSecs: 180 });
}

/** Scrape Reddit posts from search */
export async function scrapeRedditTrends(query: string, maxItems = 20) {
  return runApifyActor("trudax/reddit-scraper-lite", {
    startUrls: [{ url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&sort=top&t=week` }],
    maxItems,
    sort: "top",
  }, { maxItems, timeoutSecs: 120 });
}

/** Scrape Twitter/X posts by search query */
export async function scrapeTwitterTrends(query: string, maxItems = 20) {
  // quacker/twitter-scraper was deprecated and now returns 404.
  // apidojo/tweet-scraper is the current maintained actor.
  return runApifyActor("apidojo/tweet-scraper", {
    searchTerms: [query],
    maxItems,
    sort: "Top",
    tweetLanguage: "en",
  }, { maxItems, timeoutSecs: 180 });
}

/** Scrape Threads posts by search query */
export async function scrapeThreadsTrends(query: string, maxItems = 20) {
  // apify/threads-scraper is the maintained actor.
  return runApifyActor("apify/threads-scraper", {
    searchQueries: [query],
    resultsLimit: maxItems,
  }, { maxItems, timeoutSecs: 180 });
}

/** Scrape Snapchat Spotlight trending videos */
export async function scrapeSnapchatTrends(query: string, maxItems = 20) {
  // Snapchat Spotlight doesn't have keyword search — we use the trending feed scraper
  return runApifyActor("api-empire/snapchat-spotlight-scraper", {
    urls: [`https://www.snapchat.com/spotlight`],
    maxItems,
  }, { maxItems, timeoutSecs: 120 });
}

// ── Platform metadata ────────────────────────────────────────────

export const APIFY_PLATFORMS = [
  { id: "tiktok", label: "TikTok", icon: "tiktok" },
  { id: "instagram", label: "Instagram", icon: "instagram" },
  { id: "twitter", label: "Twitter / X", icon: "twitter" },
  { id: "reddit", label: "Reddit", icon: "reddit" },
  { id: "threads", label: "Threads", icon: "threads" },
  { id: "snapchat", label: "Snapchat", icon: "snapchat" },
  { id: "all", label: "All Platforms", icon: "all" },
] as const;

export type ApifyPlatformId = (typeof APIFY_PLATFORMS)[number]["id"];

// ── Normalizer: unify output across actors ───────────────────────

interface NormalizedPost {
  title: string;
  url: string;
  platform: string;
  author: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  videoUrl?: string;
}

function normalizeItem(item: any, platformHint: string): NormalizedPost {
  // TikTok
  if (item.webVideoUrl || item.authorMeta) {
    return {
      title: (item.text || "").slice(0, 300),
      url: item.webVideoUrl || `https://www.tiktok.com/@${item.authorMeta?.name}/video/${item.id}`,
      platform: "tiktok",
      author: item.authorMeta?.name || item.authorMeta?.nickName || "",
      views: item.playCount || 0,
      likes: item.diggCount || 0,
      comments: item.commentCount || 0,
      shares: item.shareCount || 0,
      videoUrl: item.videoUrl || item.webVideoUrl || undefined,
    };
  }

  // Instagram
  if (item.shortCode || item.ownerUsername) {
    return {
      title: (item.caption || item.alt || "").slice(0, 300),
      url: item.url || `https://www.instagram.com/p/${item.shortCode}/`,
      platform: "instagram",
      author: item.ownerUsername || item.ownerFullName || "",
      views: item.videoViewCount || item.videoPlayCount || 0,
      likes: item.likesCount || 0,
      comments: item.commentsCount || 0,
      shares: 0,
      videoUrl: item.videoUrl || undefined,
    };
  }

  // Reddit
  if (item.communityName || item.upVotes !== undefined || item.subreddit || item.ups !== undefined) {
    return {
      title: (item.title || item.body || "").slice(0, 300),
      url: item.url || item.link || (item.permalink ? `https://reddit.com${item.permalink}` : ""),
      platform: "reddit",
      author: item.username || item.author || item.user || "",
      views: 0,
      likes: item.upVotes || item.ups || item.score || 0,
      comments: item.numberOfComments || item.numComments || item.num_comments || 0,
      shares: 0,
    };
  }

  // Twitter/X
  if (item.fullText || item.retweetCount !== undefined) {
    return {
      title: (item.fullText || item.text || "").slice(0, 300),
      url: item.url || "",
      platform: "twitter",
      author: item.user?.username || item.author?.userName || "",
      views: item.viewCount || item.views || 0,
      likes: item.likeCount || item.favoriteCount || 0,
      comments: item.replyCount || 0,
      shares: item.retweetCount || 0,
    };
  }

  // Threads
  if (item.threadUrl || item.repostCount !== undefined) {
    return {
      title: (item.text || item.caption || "").slice(0, 300),
      url: item.threadUrl || item.url || "",
      platform: "threads",
      author: item.username || item.author?.username || "",
      views: 0,
      likes: item.likeCount || item.likes || 0,
      comments: item.replyCount || item.replies || 0,
      shares: item.repostCount || 0,
    };
  }

  // Snapchat
  if (item.snapUrl || item.snapId) {
    return {
      title: (item.caption || item.title || item.description || "").slice(0, 300),
      url: item.snapUrl || item.url || "",
      platform: "snapchat",
      author: item.username || item.creator || "",
      views: item.viewCount || item.views || 0,
      likes: item.likeCount || item.likes || 0,
      comments: item.commentCount || 0,
      shares: item.shareCount || 0,
      videoUrl: item.videoUrl || item.mediaUrl || undefined,
    };
  }

  // Fallback
  return {
    title: (item.text || item.title || item.caption || item.fullText || "").slice(0, 300),
    url: item.url || item.webVideoUrl || item.permalink || "",
    platform: platformHint,
    author: item.author || item.username || item.user?.username || "",
    views: item.playCount || item.viewCount || item.views || 0,
    likes: item.diggCount || item.likesCount || item.likeCount || item.ups || 0,
    comments: item.commentCount || item.commentsCount || item.replyCount || 0,
    shares: item.shareCount || item.retweetCount || item.repostCount || 0,
    videoUrl: item.videoUrl || item.webVideoUrl || undefined,
  };
}

/**
 * Unified trend search across platforms.
 * Returns scraped content formatted for AI analysis with video reference links.
 */
export async function searchPlatformTrends(
  platform: string,
  query: string,
  maxItems = 15
): Promise<{ success: boolean; formattedContent: string; rawItems: NormalizedPost[] }> {
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
    case "threads":
      result = await scrapeThreadsTrends(query, maxItems);
      break;
    case "snapchat":
      result = await scrapeSnapchatTrends(query, maxItems);
      break;
    default: {
      // "all" — run top platforms in parallel
      const [tiktok, instagram, threads] = await Promise.all([
        scrapeTikTokTrends(query, 6),
        scrapeInstagramTrends(query, 6),
        scrapeThreadsTrends(query, 4),
      ]);
      const items = [
        ...(tiktok.data || []),
        ...(instagram.data || []),
        ...(threads.data || []),
      ];
      result = { success: items.length > 0, data: items };
      break;
    }
  }

  if (!result.success || !result.data?.length) {
    return { success: false, formattedContent: "", rawItems: [] };
  }

  const normalized = result.data.slice(0, maxItems).map((item: any) => normalizeItem(item, platform));

  const formatted = normalized.map((p) => {
    let entry = `Title: ${p.title}
URL: ${p.url}
Platform: ${p.platform}
Author: ${p.author}
Views: ${p.views.toLocaleString()} | Likes: ${p.likes.toLocaleString()} | Comments: ${p.comments.toLocaleString()} | Shares: ${p.shares.toLocaleString()}`;
    if (p.videoUrl) {
      entry += `\nVideo URL: ${p.videoUrl}`;
    }
    return entry;
  }).join("\n\n---\n\n");

  return { success: true, formattedContent: formatted, rawItems: normalized };
}
