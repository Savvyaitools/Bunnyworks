import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Share2, Calendar, BarChart3, Sparkles, Clock, TrendingUp, 
   Instagram, Twitter, Send, Loader2, Plus, Eye, ThumbsUp, MessageCircle,
   DollarSign, Users, Flame, Globe, Search, ExternalLink, ArrowUpRight, Link, Crosshair, ArrowLeft, Settings, Play
} from "lucide-react";
import { TatumAPISettings } from "@/components/tatum/TatumAPISettings";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreators } from "@/hooks/useCreators";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { searchPlatformTrends } from "@/lib/api/apify";

interface GeneratedPost {
  platform: string;
  caption: string;
  hashtags: string[];
  bestTime: string;
  contentType: string;
}

interface StrategyInsight {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  metric?: string;
}

interface TrendItem {
  title: string;
  platform: string;
  description: string;
  engagement: string;
  url?: string;
  actionable_tip: string;
}

interface NicheContentPlan {
  reference_url: string;
  reference_title: string;
  reference_video_url?: string;
  platform: string;
  what_works: string;
  recreation_prompt: string;
  hashtags: string[];
  estimated_engagement: string;
}

export default function SocialMediaManager() {
  const navigate = useNavigate();
  const { creators } = useCreators();
  const { profile } = useAuth();
  const [selectedCreator, setSelectedCreator] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<string>("instagram");
  const [generating, setGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [analyzingStrategy, setAnalyzingStrategy] = useState(false);
  const [strategyInsights, setStrategyInsights] = useState<StrategyInsight[]>([]);
  const [contentCalendar, setContentCalendar] = useState<GeneratedPost[]>([]);
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  const [scanningTrends, setScanningTrends] = useState(false);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [nicheQuery, setNicheQuery] = useState("");
  const [creatorSocialUrl, setCreatorSocialUrl] = useState("");
  const [nicheContentPlan, setNicheContentPlan] = useState<NicheContentPlan[]>([]);
  const [researchingNiche, setResearchingNiche] = useState(false);

  // Look up the OF account ID for the selected creator
  const { data: ofAccountId } = useQuery({
    queryKey: ["creator-of-account", selectedCreator],
    queryFn: async () => {
      if (!selectedCreator) return null;
      const { data } = await supabase
        .from("creator_social_accounts" as any)
        .select("of_account_id")
        .eq("creator_id", selectedCreator)
        .eq("platform", "onlyfans")
        .maybeSingle();
      return (data as any)?.of_account_id ?? null;
    },
    enabled: !!selectedCreator,
  });

  // Fetch live OnlyFans data for dashboard cards
  const { data: liveOFData, isLoading: loadingOF } = useQuery({
    queryKey: ["tatum-live-of", selectedCreator, ofAccountId],
    queryFn: async () => {
      if (!ofAccountId || !selectedCreator) return null;
      // Call the social media manager with a special "fetch_live_data" action
      // We'll use the existing edge function but with a lightweight request
      const { data: earnings } = await supabase
        .from("creator_earnings")
        .select("amount, subscriptions, tips, messages_revenue, period_start, period_end")
        .eq("creator_id", selectedCreator)
        .order("period_end", { ascending: false })
        .limit(7);
      
      const { data: socialAccounts } = await supabase
        .from("creator_social_accounts" as any)
        .select("username, platform, of_connection_status, of_last_synced_at")
        .eq("creator_id", selectedCreator);

      const totalRevenue = (earnings || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      const totalSubs = (earnings || []).reduce((sum: number, e: any) => sum + (e.subscriptions || 0), 0);
      const totalTips = (earnings || []).reduce((sum: number, e: any) => sum + (e.tips || 0), 0);
      const totalMessages = (earnings || []).reduce((sum: number, e: any) => sum + (e.messages_revenue || 0), 0);
      
      const ofAccount = (socialAccounts as any[] || []).find((s: any) => s.platform === "onlyfans");

      return {
        revenue: totalRevenue,
        subs: totalSubs,
        tips: totalTips,
        messagesRev: totalMessages,
        connected: ofAccount?.of_connection_status === "connected",
        lastSynced: ofAccount?.of_last_synced_at,
        earnings: earnings || [],
      };
    },
    enabled: !!selectedCreator && !!ofAccountId,
    refetchInterval: 60000,
  });

  const generatePosts = async () => {
    if (!topic.trim()) { toast.error("Please enter a topic or theme"); return; }
    setGenerating(true);
    try {
      const creator = creators?.find(c => c.id === selectedCreator);
      const { data, error } = await supabase.functions.invoke("ai-social-media-manager", {
        body: { action: "generate_posts", topic, platform, creatorName: creator?.name || "the creator", creatorNiche: "general", creatorPersona: creator?.persona || "", agencyId: profile?.agency_id, creatorId: selectedCreator || undefined, ofAccountId: ofAccountId || undefined },
      });
      if (error) throw error;
      setGeneratedPosts(data.posts || []);
      toast.success(`Generated ${data.posts?.length || 0} post ideas`);
    } catch (err) { toast.error("Failed to generate posts"); console.error(err); }
    finally { setGenerating(false); }
  };

  const analyzeStrategy = async () => {
    setAnalyzingStrategy(true);
    try {
      const creator = creators?.find(c => c.id === selectedCreator);
      const { data, error } = await supabase.functions.invoke("ai-social-media-manager", {
        body: { action: "analyze_strategy", creatorName: creator?.name || "the creator", creatorNiche: "general", platform, agencyId: profile?.agency_id, creatorId: selectedCreator || undefined, ofAccountId: ofAccountId || undefined },
      });
      if (error) throw error;
      setStrategyInsights(data.insights || []);
      toast.success("Strategy analysis complete");
    } catch (err) { toast.error("Failed to analyze strategy"); console.error(err); }
    finally { setAnalyzingStrategy(false); }
  };

  const generateCalendar = async () => {
    setGeneratingCalendar(true);
    try {
      const creator = creators?.find(c => c.id === selectedCreator);
      const { data, error } = await supabase.functions.invoke("ai-social-media-manager", {
        body: { action: "generate_calendar", creatorName: creator?.name || "the creator", creatorNiche: "general", platform, days: 7, agencyId: profile?.agency_id, creatorId: selectedCreator || undefined, ofAccountId: ofAccountId || undefined },
      });
      if (error) throw error;
      setContentCalendar(data.calendar || []);
      toast.success("7-day content calendar generated");
    } catch (err) { toast.error("Failed to generate calendar"); console.error(err); }
    finally { setGeneratingCalendar(false); }
  };

  const scanTrends = async () => {
    setScanningTrends(true);
    setTrends([]);
    try {
      const creator = creators?.find(c => c.id === selectedCreator);
      const query = topic.trim() || "viral content creator";

      // Use Apify actors for platform-specific trend scraping
      const apifyResult = await searchPlatformTrends(platform, query, 15);

      let scrapedContent = "";

      if (apifyResult.success && apifyResult.formattedContent) {
        scrapedContent = apifyResult.formattedContent;
      } else {
        // Fallback to Firecrawl if Apify fails
        const platformVideoQueries: Record<string, string[]> = {
          instagram: [
            "site:instagram.com OR site:tiktok.com viral reels millions views creator",
            "most viral Instagram Reels this week millions views likes",
          ],
          twitter: [
            "viral tweets millions impressions engagement creator promotion",
            "Twitter X viral content strategy high engagement retweets",
          ],
          tiktok: [
            "site:tiktok.com viral videos millions views trending sounds",
            "most viral TikTok videos this week creator niche millions views",
          ],
          reddit: [
            "site:reddit.com top posts this week creator promotion thousands upvotes",
            "Reddit viral posts high engagement upvotes comments creator marketing",
          ],
          all: [
            "most viral social media videos this week millions views engagement",
            "trending viral videos TikTok Instagram Reels millions views",
          ],
        };
        const queries = platformVideoQueries[platform] || platformVideoQueries.all;
        const searchResults = await Promise.all(
          queries.map(q => firecrawlApi.search(q, { limit: 5, scrapeOptions: { formats: ["markdown"] } }))
        );
        const allResults: any[] = [];
        const seenUrls = new Set<string>();
        for (const result of searchResults) {
          if (result.success && result.data) {
            for (const item of result.data as any[]) {
              if (item.url && !seenUrls.has(item.url)) {
                seenUrls.add(item.url);
                allResults.push(item);
              }
            }
          }
        }
        if (allResults.length === 0) throw new Error("No search results found");
        scrapedContent = allResults.slice(0, 10)
          .map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${(r.markdown || r.description || "").slice(0, 600)}`)
          .join("\n\n---\n\n");
      }

      const { data: aiData, error: aiError } = await supabase.functions.invoke("ai-social-media-manager", {
        body: {
          action: "analyze_trends",
          topic: scrapedContent,
          platform,
          creatorName: creator?.name || "the creator",
          creatorNiche: "general",
          creatorPersona: creator?.persona || "",
          agencyId: profile?.agency_id,
          creatorId: selectedCreator || undefined,
          ofAccountId: ofAccountId || undefined,
        },
      });

      if (aiError) throw aiError;
      setTrends(aiData.trends || []);
      toast.success(`Found ${aiData.trends?.length || 0} trending strategies`);
    } catch (err) {
      console.error("Trends scan error:", err);
      toast.error("Failed to scan trends");
    } finally {
      setScanningTrends(false);
    }
  };

  const researchNiche = async () => {
    if (!nicheQuery.trim()) { toast.error("Enter a niche or content style to research"); return; }
    setResearchingNiche(true);
    setNicheContentPlan([]);
    try {
      // Step 1: Multi-query niche search for viral content with engagement data
      const nicheSearchQueries = [
        `${nicheQuery} viral video millions views ${platform !== "all" ? platform : "TikTok Instagram"}`,
        `${nicheQuery} most popular content creator high engagement likes views`,
        `site:tiktok.com OR site:instagram.com ${nicheQuery} viral trending`,
      ];
      
      const nicheResults = await Promise.all(
        nicheSearchQueries.map(q => firecrawlApi.search(q, {
          limit: 5,
          scrapeOptions: { formats: ["markdown"] },
        }))
      );
      
      // Merge and deduplicate
      const allNicheResults: any[] = [];
      const seenNicheUrls = new Set<string>();
      for (const result of nicheResults) {
        if (result.success && result.data) {
          for (const item of result.data as any[]) {
            if (item.url && !seenNicheUrls.has(item.url)) {
              seenNicheUrls.add(item.url);
              allNicheResults.push(item);
            }
          }
        }
      }
      
      const searchResult = { success: allNicheResults.length > 0, data: allNicheResults, error: allNicheResults.length === 0 ? "Niche search failed" : undefined };

      if (!searchResult.success || !searchResult.data) {
        throw new Error(searchResult.error || "Niche search failed");
      }

      // Step 2: If creator social URL provided, scrape their existing content
      let existingSocialContent = "";
      if (creatorSocialUrl.trim()) {
        try {
          const scrapeResult = await firecrawlApi.scrape(creatorSocialUrl.trim(), {
            formats: ["markdown"],
            onlyMainContent: true,
          });
          if (scrapeResult.success && scrapeResult.data) {
            const scraped = scrapeResult.data as any;
            existingSocialContent = (scraped.data?.markdown || scraped.markdown || "").slice(0, 2000);
          }
        } catch (e) {
          console.warn("Could not scrape creator social:", e);
        }
      }

      const searchData = (searchResult.data as any[]).slice(0, 8);
      const scrapedReferences = searchData
        .map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${(r.markdown || r.description || "").slice(0, 600)}`)
        .join("\n\n---\n\n");

      // Step 3: Send to AI for niche content plan with reference links
      const creator = creators?.find(c => c.id === selectedCreator);
      const { data: aiData, error: aiError } = await supabase.functions.invoke("ai-social-media-manager", {
        body: {
          action: "niche_content_plan",
          topic: scrapedReferences,
          nicheQuery: nicheQuery,
          existingSocialContent,
          platform,
          creatorName: creator?.name || "the creator",
          creatorNiche: nicheQuery,
          creatorPersona: creator?.persona || "",
          agencyId: profile?.agency_id,
          creatorId: selectedCreator || undefined,
          ofAccountId: ofAccountId || undefined,
        },
      });

      if (aiError) throw aiError;
      setNicheContentPlan(aiData.content_plan || []);
      toast.success(`Generated ${aiData.content_plan?.length || 0} content ideas with reference links`);
    } catch (err) {
      console.error("Niche research error:", err);
      toast.error("Failed to research niche. Make sure Firecrawl is connected.");
    } finally {
      setResearchingNiche(false);
    }
  };

  const priorityColor = (p: string) => {
    if (p === "high") return "destructive";
    if (p === "medium") return "default";
    return "secondary";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/of-ai")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Share2 className="h-6 w-6 text-primary" />
                Tatum
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                AI Social Media Manager — generate content, analyze trends, and optimize strategy
              </p>
            </div>
          </div>
        </div>

        {/* Creator & Platform Selector */}
        <div className="flex flex-wrap gap-4">
          <Select value={selectedCreator} onValueChange={setSelectedCreator}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select creator" />
            </SelectTrigger>
            <SelectContent>
              {creators?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="twitter">Twitter / X</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="reddit">Reddit</SelectItem>
              <SelectItem value="all">All Platforms</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Live OF Data Cards — only show when creator selected + OF connected */}
        {selectedCreator && ofAccountId && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <LiveStatCard
              icon={DollarSign}
              label="Revenue (7d)"
              value={loadingOF ? null : `$${(liveOFData?.revenue || 0).toLocaleString()}`}
              color="text-green-500"
              loading={loadingOF}
            />
            <LiveStatCard
              icon={Users}
              label="Subscriptions"
              value={loadingOF ? null : `$${(liveOFData?.subs || 0).toLocaleString()}`}
              color="text-blue-500"
              loading={loadingOF}
            />
            <LiveStatCard
              icon={Flame}
              label="Tips"
              value={loadingOF ? null : `$${(liveOFData?.tips || 0).toLocaleString()}`}
              color="text-amber-500"
              loading={loadingOF}
            />
            <LiveStatCard
              icon={MessageCircle}
              label="Messages Rev"
              value={loadingOF ? null : `$${(liveOFData?.messagesRev || 0).toLocaleString()}`}
              color="text-purple-500"
              loading={loadingOF}
            />
          </div>
        )}

        <Tabs defaultValue="generate" className="space-y-4">
          <TabsList>
            <TabsTrigger value="generate" className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Generate
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <Calendar className="h-4 w-4" /> Calendar
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-1.5">
              <Flame className="h-4 w-4" /> Trends
            </TabsTrigger>
            <TabsTrigger value="strategy" className="gap-1.5">
              <BarChart3 className="h-4 w-4" /> Strategy
            </TabsTrigger>
            <TabsTrigger value="api-settings" className="gap-1.5">
              <Settings className="h-4 w-4" /> API Settings
            </TabsTrigger>
          </TabsList>

          {/* Generate Posts Tab */}
          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate Post Ideas</CardTitle>
                <CardDescription>Describe a topic or theme and AI will create platform-optimized posts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea placeholder="e.g. New photo set teaser, behind the scenes content, fan engagement poll..." value={topic} onChange={e => setTopic(e.target.value)} rows={3} />
                <Button onClick={generatePosts} disabled={generating}>
                  {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {generating ? "Generating..." : "Generate Posts"}
                </Button>
              </CardContent>
            </Card>

            {generatedPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedPosts.map((post, i) => (
                  <Card key={i} className="border-primary/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{post.platform}</Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> Best: {post.bestTime}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
                      {post.hashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.hashtags.map((tag, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">#{tag}</Badge>
                          ))}
                        </div>
                      )}
                      <Button size="sm" variant="outline" onClick={() => {
                        navigator.clipboard.writeText(post.caption + "\n\n" + post.hashtags.map(t => `#${t}`).join(" "));
                        toast.success("Copied to clipboard");
                      }}>Copy</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Content Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">7-Day Content Calendar</CardTitle>
                <CardDescription>AI generates a full week of scheduled content ideas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={generateCalendar} disabled={generatingCalendar}>
                  {generatingCalendar ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                  {generatingCalendar ? "Generating..." : "Generate 7-Day Calendar"}
                </Button>
              </CardContent>
            </Card>

            {contentCalendar.length > 0 && (
              <div className="space-y-3">
                {contentCalendar.map((post, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="flex flex-col items-center min-w-[60px] text-center">
                        <span className="text-xs text-muted-foreground">Day {i + 1}</span>
                        <Clock className="h-4 w-4 text-primary mt-1" />
                        <span className="text-xs mt-1">{post.bestTime}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{post.platform}</Badge>
                          <Badge variant="secondary">{post.contentType}</Badge>
                        </div>
                        <p className="text-sm">{post.caption}</p>
                        {post.hashtags?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.hashtags.map((tag, j) => (
                              <span key={j} className="text-xs text-primary">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            {/* Niche Content Research Section */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crosshair className="h-5 w-5 text-primary" />
                  Niche Content Research
                </CardTitle>
                <CardDescription>
                  Crawl niche-specific trending content, review the creator's existing social media, and get a content plan with real reference links to recreate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Content niche / style to research *</label>
                    <Textarea
                      placeholder="e.g. Fitness model aesthetic reels, luxury lifestyle teasers, cosplay TikToks, GFE content promotion..."
                      value={nicheQuery}
                      onChange={e => setNicheQuery(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Creator's social media URL <span className="text-muted-foreground/60">(optional — for personalized plan)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-muted-foreground shrink-0" />
                      <input
                        type="url"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="https://instagram.com/creatorname or https://tiktok.com/@creator"
                        value={creatorSocialUrl}
                        onChange={e => setCreatorSocialUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <Crosshair className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Tatum will crawl <strong className="text-foreground">{nicheQuery || "your niche"}</strong> content across the web, find top-performing examples with links, and create a recreation plan tailored to your creator.
                  </p>
                </div>
                <Button onClick={researchNiche} disabled={researchingNiche || !nicheQuery.trim()} className="gap-2">
                  {researchingNiche ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {researchingNiche ? "Researching niche..." : "Research & Build Content Plan"}
                </Button>
              </CardContent>
            </Card>

            {/* Niche Content Plan Results */}
            {nicheContentPlan.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-primary" />
                  Content Plan — {nicheContentPlan.length} Reference Ideas
                </h3>
                {nicheContentPlan.map((item, i) => (
                  <Card key={i} className="border-l-4 border-l-primary/60 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs capitalize">{item.platform}</Badge>
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <TrendingUp className="h-2.5 w-2.5" />
                              {item.estimated_engagement}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-sm">{item.reference_title}</h4>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.reference_video_url && (
                            <Button size="sm" variant="default" className="gap-1.5 text-xs" asChild>
                              <a href={item.reference_video_url} target="_blank" rel="noopener noreferrer">
                                <Play className="h-3 w-3" />
                                Watch Video
                              </a>
                            </Button>
                          )}
                          {item.reference_url && (
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                              <a href={item.reference_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                                View Reference
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Why it works</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.what_works}</p>
                        </div>
                        <div className="p-2.5 rounded-md bg-primary/5 border border-primary/10">
                          <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-1">How to recreate</p>
                          <p className="text-xs text-foreground leading-relaxed">{item.recreation_prompt}</p>
                        </div>
                      </div>
                      {item.hashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.hashtags.map((tag, j) => (
                            <span key={j} className="text-xs text-primary">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Generic Trends Scanner (existing) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flame className="h-5 w-5 text-destructive" />
                  Quick Trend Scan
                </CardTitle>
                <CardDescription>
                  Generic scan of what's trending right now (no niche filter)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={scanTrends} disabled={scanningTrends} variant="outline" className="gap-2">
                  {scanningTrends ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {scanningTrends ? "Scanning..." : "Quick Scan"}
                </Button>
              </CardContent>
            </Card>

            {trends.length > 0 && (
              <div className="space-y-3">
                {trends.map((trend, i) => (
                  <Card key={i} className="border-l-4 border-l-destructive/40 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs capitalize">{trend.platform}</Badge>
                            {trend.engagement && (
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <TrendingUp className="h-2.5 w-2.5" />
                                {trend.engagement}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-sm">{trend.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{trend.description}</p>
                        </div>
                        {trend.url && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" asChild>
                            <a href={trend.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="flex items-start gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/10">
                        <ArrowUpRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-primary font-medium">{trend.actionable_tip}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!scanningTrends && trends.length === 0 && nicheContentPlan.length === 0 && !researchingNiche && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Crosshair className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">Enter your creator's niche above to get a content plan with real reference links</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Strategy Analysis</CardTitle>
                <CardDescription>Get AI-powered growth strategies and posting recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={analyzeStrategy} disabled={analyzingStrategy}>
                  {analyzingStrategy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                  {analyzingStrategy ? "Analyzing..." : "Analyze Strategy"}
                </Button>
              </CardContent>
            </Card>

            {strategyInsights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strategyInsights.map((insight, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{insight.title}</CardTitle>
                        <Badge variant={priorityColor(insight.priority)}>{insight.priority}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                      {insight.metric && (
                        <p className="text-xs text-primary mt-2 font-medium">{insight.metric}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* API Settings Tab */}
          <TabsContent value="api-settings" className="space-y-4">
            <TatumAPISettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function LiveStatCard({ icon: Icon, label, value, color, loading }: {
  icon: React.ElementType; label: string; value: string | null; color: string; loading: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground truncate">{label}</p>
          {loading ? (
            <Skeleton className="h-5 w-16 mt-0.5" />
          ) : (
            <p className="text-sm font-bold truncate">{value || "—"}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}