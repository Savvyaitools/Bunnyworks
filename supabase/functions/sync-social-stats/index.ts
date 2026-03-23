import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APIFY_BASE = "https://api.apify.com/v2";

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  profile_url: string | null;
  creator_id: string;
}

interface ProfileStats {
  follower_count?: number;
  engagement_rate?: number;
  bio?: string;
  avg_likes?: number;
  avg_comments?: number;
  posts_count?: number;
}

// Map platform names to Apify actor IDs and input builders
const PLATFORM_SCRAPERS: Record<string, { actorId: string; buildInput: (username: string) => Record<string, unknown> }> = {
  Instagram: {
    actorId: "apify/instagram-profile-scraper",
    buildInput: (username) => ({
      usernames: [username.replace(/^@/, "")],
      resultsLimit: 1,
    }),
  },
  TikTok: {
    actorId: "clockworks/free-tiktok-scraper",
    buildInput: (username) => ({
      profiles: [`https://www.tiktok.com/@${username.replace(/^@/, "")}`],
      resultsPerPage: 1,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    }),
  },
  Twitter: {
    actorId: "quacker/twitter-scraper",
    buildInput: (username) => ({
      twitterHandles: [username.replace(/^@/, "")],
      maxTweets: 1,
      getFollowers: false,
      getFollowing: false,
    }),
  },
  YouTube: {
    actorId: "streamers/youtube-channel-scraper",
    buildInput: (username) => ({
      startUrls: [{ url: `https://www.youtube.com/@${username.replace(/^@/, "")}` }],
      maxResults: 1,
    }),
  },
  Reddit: {
    actorId: "trudax/reddit-scraper-lite",
    buildInput: (username) => ({
      startUrls: [{ url: `https://www.reddit.com/user/${username.replace(/^u\//, "").replace(/^@/, "")}` }],
      maxItems: 1,
    }),
  },
  Threads: {
    actorId: "automation-lab/threads-scraper",
    buildInput: (username) => ({
      usernames: [username.replace(/^@/, "")],
      maxPosts: 1,
    }),
  },
};

function extractStats(platform: string, items: any[]): ProfileStats {
  if (!items || items.length === 0) return {};

  const item = items[0];

  switch (platform) {
    case "Instagram":
      return {
        follower_count: item.followersCount || item.followerCount || item.followedByCount || undefined,
        engagement_rate: item.engagementRate || undefined,
        bio: item.biography || item.bio || undefined,
        avg_likes: item.avgLikesCount || undefined,
        avg_comments: item.avgCommentsCount || undefined,
        posts_count: item.postsCount || item.mediaCount || undefined,
      };

    case "TikTok":
      return {
        follower_count: item.authorMeta?.fans || item.fans || item.followerCount || undefined,
        bio: item.authorMeta?.signature || item.signature || undefined,
        avg_likes: item.authorMeta?.heart ? Math.round(item.authorMeta.heart / Math.max(item.authorMeta.video || 1, 1)) : undefined,
        posts_count: item.authorMeta?.video || undefined,
      };

    case "Twitter":
      return {
        follower_count: item.user?.followersCount || item.followersCount || undefined,
        bio: item.user?.description || item.description || undefined,
        posts_count: item.user?.statusesCount || undefined,
      };

    case "YouTube":
      return {
        follower_count: item.subscriberCount || item.subscribersCount || undefined,
        bio: item.description || undefined,
        posts_count: item.videosCount || undefined,
      };

    case "Reddit":
      return {
        follower_count: item.followers || undefined,
        bio: item.about || undefined,
      };

    case "Threads":
      return {
        follower_count: item.followersCount || item.followerCount || undefined,
        bio: item.biography || item.bio || undefined,
      };

    default:
      return {
        follower_count: item.followersCount || item.followerCount || item.fans || undefined,
        bio: item.biography || item.bio || item.description || undefined,
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");
    if (!APIFY_API_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: "APIFY_API_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { creatorId, agencyId, mode } = body;

    // mode = "single" (sync one creator) or "all" (cron: sync all creators in agency)
    let accounts: SocialAccount[] = [];

    if (mode === "all" && agencyId) {
      // Cron mode: get all social accounts for all creators in this agency
      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("agency_id", agencyId);

      if (creators && creators.length > 0) {
        const creatorIds = creators.map((c: any) => c.id);
        const { data } = await supabase
          .from("creator_social_accounts")
          .select("id, platform, username, profile_url, creator_id")
          .in("creator_id", creatorIds)
          .eq("account_type", "social");
        accounts = (data || []) as unknown as SocialAccount[];
      }
    } else if (creatorId) {
      // Single creator sync
      const { data } = await supabase
        .from("creator_social_accounts")
        .select("id, platform, username, profile_url, creator_id")
        .eq("creator_id", creatorId)
        .eq("account_type", "social");
      accounts = (data || []) as unknown as SocialAccount[];
    }

    if (accounts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, synced: 0, message: "No social accounts to sync" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Syncing ${accounts.length} social accounts`);

    const results: { id: string; platform: string; success: boolean; stats?: ProfileStats; error?: string }[] = [];

    // Process accounts sequentially to avoid Apify rate limits
    for (const account of accounts) {
      const scraper = PLATFORM_SCRAPERS[account.platform];
      if (!scraper) {
        results.push({ id: account.id, platform: account.platform, success: false, error: "Unsupported platform" });
        continue;
      }

      try {
        const encodedActorId = scraper.actorId.replace("/", "~");
        const input = scraper.buildInput(account.username);

        const runRes = await fetch(
          `${APIFY_BASE}/acts/${encodedActorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}&timeout=60`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        if (!runRes.ok) {
          const errText = await runRes.text();
          console.error(`Apify error for ${account.platform}/@${account.username}:`, errText);
          results.push({ id: account.id, platform: account.platform, success: false, error: `Apify ${runRes.status}` });
          continue;
        }

        const items = await runRes.json();
        const stats = extractStats(account.platform, Array.isArray(items) ? items : []);

        // Update the social account with the stats
        const updateData: Record<string, unknown> = { last_synced_at: new Date().toISOString() };
        if (stats.follower_count != null) updateData.follower_count = stats.follower_count;
        if (stats.engagement_rate != null) updateData.engagement_rate = stats.engagement_rate;
        if (stats.bio != null) updateData.bio = stats.bio;
        if (stats.avg_likes != null) updateData.avg_likes = stats.avg_likes;
        if (stats.avg_comments != null) updateData.avg_comments = stats.avg_comments;
        if (stats.posts_count != null) updateData.posts_count = stats.posts_count;

        await supabase
          .from("creator_social_accounts")
          .update(updateData)
          .eq("id", account.id);

        results.push({ id: account.id, platform: account.platform, success: true, stats });
        console.log(`Synced ${account.platform}/@${account.username}: ${stats.follower_count || "?"} followers`);
      } catch (err) {
        console.error(`Error syncing ${account.platform}/@${account.username}:`, err);
        results.push({ id: account.id, platform: account.platform, success: false, error: String(err) });
      }
    }

    const synced = results.filter((r) => r.success).length;
    return new Response(
      JSON.stringify({ success: true, synced, total: accounts.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("sync-social-stats error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
