import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Share2, BarChart3, Sparkles, TrendingUp, Send, Loader2, Plus,
  ExternalLink, ArrowUpRight, Link, Crosshair, ArrowLeft, Play, CheckSquare, Search, Flame
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreators } from "@/hooks/useCreators";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { searchPlatformTrends } from "@/lib/api/apify";

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
  video_url?: string;
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
  const [platform, setPlatform] = useState<string>("instagram");
  const [analyzingStrategy, setAnalyzingStrategy] = useState(false);
  const [strategyInsights, setStrategyInsights] = useState<StrategyInsight[]>([]);
  const [scanningTrends, setScanningTrends] = useState(false);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [nicheQuery, setNicheQuery] = useState("");
  const [creatorSocialUrl, setCreatorSocialUrl] = useState("");
  const [nicheContentPlan, setNicheContentPlan] = useState<NicheContentPlan[]>([]);
  const [researchingNiche, setResearchingNiche] = useState(false);
  const [selectedIdeas, setSelectedIdeas] = useState<Set<number>>(new Set());
  const [pushingToPlans, setPushingToPlans] = useState(false);
  const [topic] = useState("");

  const toggleIdeaSelection = (index: number) => {
    setSelectedIdeas(prev => { const next = new Set(prev); if (next.has(index)) next.delete(index); else next.add(index); return next; });
  };
  const toggleAllIdeas = () => {
    setSelectedIdeas(selectedIdeas.size === nicheContentPlan.length ? new Set() : new Set(nicheContentPlan.map((_, i) => i)));
  };

  const { data: ofAccountId } = useQuery({
    queryKey: ["creator-of-account", selectedCreator],
    queryFn: async () => {
      if (!selectedCreator) return null;
      const { data } = await supabase.from("creator_social_accounts" as any).select("of_account_id").eq("creator_id", selectedCreator).eq("platform", "onlyfans").maybeSingle();
      return (data as any)?.of_account_id ?? null;
    },
    enabled: !!selectedCreator,
  });

  const pushSelectedToContentPlans = async () => {
    if (!selectedCreator || selectedIdeas.size === 0 || !profile?.agency_id) { toast.error("Select a creator and at least one idea"); return; }
    setPushingToPlans(true);
    try {
      const items = Array.from(selectedIdeas).map(i => nicheContentPlan[i]);
      const platformMap: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", twitter: "Twitter", reddit: "Reddit", youtube: "YouTube", threads: "Threads", snapchat: "Snapchat" };
      const rows = items.map((item, idx) => ({
        title: item.reference_title,
        description: `**Why it works:** ${item.what_works}\n\n**How to recreate:** ${item.recreation_prompt}${item.reference_url ? `\n\nReference: ${item.reference_url}` : ""}${item.reference_video_url ? `\nVideo: ${item.reference_video_url}` : ""}${item.hashtags?.length ? `\n\nHashtags: ${item.hashtags.map(t => `#${t}`).join(" ")}` : ""}`,
        creator_id: selectedCreator, agency_id: profile.agency_id,
        platform: platformMap[item.platform.toLowerCase()] || item.platform,
        status: "planned", content_category: "social" as const, board_column: "to_do", board_position: idx,
      }));
      const { error } = await supabase.from("content_plans").insert(rows);
      if (error) throw error;
      toast.success(`${rows.length} idea(s) added to Content Plans`);
      setSelectedIdeas(new Set());
    } catch { toast.error("Failed to add ideas"); } finally { setPushingToPlans(false); }
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
    } catch { toast.error("Failed to analyze strategy"); } finally { setAnalyzingStrategy(false); }
  };

  const scanTrends = async () => {
    setScanningTrends(true); setTrends([]);
    try {
      const creator = creators?.find(c => c.id === selectedCreator);
      const query = topic.trim() || "viral content creator";
      const apifyResult = await searchPlatformTrends(platform, query, 15);
      let scrapedContent = "";
      if (apifyResult.success && apifyResult.formattedContent) {
        scrapedContent = apifyResult.formattedContent;
      } else {
        const queries = ["most viral social media videos this week millions views engagement"];
        const searchResults = await Promise.all(queries.map(q => firecrawlApi.search(q, { limit: 5, scrapeOptions: { formats: ["markdown"] } })));
        const allResults: any[] = [];
        const seenUrls = new Set<string>();
        for (const result of searchResults) { if (result.success && result.data) { for (const item of result.data as any[]) { if (item.url && !seenUrls.has(item.url)) { seenUrls.add(item.url); allResults.push(item); } } } }
        if (allResults.length === 0) throw new Error("No results found");
        scrapedContent = allResults.slice(0, 10).map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${(r.markdown || r.description || "").slice(0, 600)}`).join("\n\n---\n\n");
      }
      const { data: aiData, error: aiError } = await supabase.functions.invoke("ai-social-media-manager", {
        body: { action: "analyze_trends", topic: scrapedContent, platform, creatorName: creator?.name || "the creator", creatorNiche: "general", creatorPersona: creator?.persona || "", agencyId: profile?.agency_id, creatorId: selectedCreator || undefined, ofAccountId: ofAccountId || undefined },
      });
      if (aiError) throw aiError;
      setTrends(aiData.trends || []);
      toast.success(`Found ${aiData.trends?.length || 0} trends`);
    } catch { toast.error("Failed to scan trends"); } finally { setScanningTrends(false); }
  };

  const researchNiche = async () => {
    if (!nicheQuery.trim()) { toast.error("Enter a niche to research"); return; }
    setResearchingNiche(true); setNicheContentPlan([]);
    try {
      const apifyResult = await searchPlatformTrends(platform, nicheQuery, 15);
      let nicheItems: any[] = [];
      if (apifyResult.success && apifyResult.rawItems.length > 0) { nicheItems = apifyResult.rawItems; }
      else {
        const queries = [`${nicheQuery} viral video millions views ${platform !== "all" ? platform : "TikTok Instagram"}`];
        const results = await Promise.all(queries.map(q => firecrawlApi.search(q, { limit: 5, scrapeOptions: { formats: ["markdown"] } })));
        for (const result of results) { if (result.success && result.data) nicheItems.push(...(result.data as any[])); }
      }
      if (nicheItems.length === 0) throw new Error("No results");

      let existingSocialContent = "";
      if (creatorSocialUrl.trim()) {
        try {
          const scrapeResult = await firecrawlApi.scrape(creatorSocialUrl.trim(), { formats: ["markdown"], onlyMainContent: true });
          if (scrapeResult.success && scrapeResult.data) { existingSocialContent = ((scrapeResult.data as any).data?.markdown || (scrapeResult.data as any).markdown || "").slice(0, 2000); }
        } catch {}
      }

      const scrapedRefs = apifyResult.success && apifyResult.formattedContent ? apifyResult.formattedContent : nicheItems.slice(0, 8).map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${(r.markdown || r.description || "").slice(0, 600)}`).join("\n\n---\n\n");
      const creator = creators?.find(c => c.id === selectedCreator);
      const { data: aiData, error: aiError } = await supabase.functions.invoke("ai-social-media-manager", {
        body: { action: "niche_content_plan", topic: scrapedRefs, nicheQuery, existingSocialContent, platform, creatorName: creator?.name || "the creator", creatorNiche: nicheQuery, creatorPersona: creator?.persona || "", agencyId: profile?.agency_id, creatorId: selectedCreator || undefined, ofAccountId: ofAccountId || undefined },
      });
      if (aiError) throw aiError;
      setNicheContentPlan(aiData.content_plan || []);
      toast.success(`Generated ${aiData.content_plan?.length || 0} content ideas`);
    } catch { toast.error("Failed to research niche"); } finally { setResearchingNiche(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/of-ai")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Share2 className="h-5 w-5 text-accent" /> Tatum
            </h1>
            <p className="text-xs text-muted-foreground">Content strategist — viral discovery & content plans</p>
          </div>
        </div>

        {/* Selectors */}
        <div className="flex flex-wrap gap-3">
          <Select value={selectedCreator} onValueChange={setSelectedCreator}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select creator" /></SelectTrigger>
            <SelectContent>{creators?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="twitter">Twitter / X</SelectItem>
              <SelectItem value="reddit">Reddit</SelectItem>
              <SelectItem value="threads">Threads</SelectItem>
              <SelectItem value="snapchat">Snapchat</SelectItem>
              <SelectItem value="all">All Platforms</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="niche" className="space-y-4">
          <TabsList className="h-9">
            <TabsTrigger value="niche" className="text-xs gap-1.5"><Crosshair className="h-3.5 w-3.5" /> Niche Research</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs gap-1.5"><Flame className="h-3.5 w-3.5" /> Trends</TabsTrigger>
            <TabsTrigger value="strategy" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Strategy</TabsTrigger>
          </TabsList>

          {/* Niche Research */}
          <TabsContent value="niche" className="space-y-4">
            <div className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-3">
              <Textarea placeholder="e.g. Fitness model aesthetic reels, luxury lifestyle teasers..." value={nicheQuery} onChange={e => setNicheQuery(e.target.value)} rows={2} className="resize-none" />
              <div className="flex items-center gap-2">
                <Link className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input type="url" className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Creator's social URL (optional)" value={creatorSocialUrl} onChange={e => setCreatorSocialUrl(e.target.value)} />
              </div>
              <Button size="sm" onClick={researchNiche} disabled={researchingNiche || !nicheQuery.trim()}>
                {researchingNiche ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Search className="h-3.5 w-3.5 mr-1.5" />}
                {researchingNiche ? "Researching..." : "Research & Build Plan"}
              </Button>
            </div>

            {nicheContentPlan.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-semibold">{nicheContentPlan.length} Ideas</h3>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={toggleAllIdeas} className="text-xs gap-1 h-7">
                      <CheckSquare className="h-3 w-3" /> {selectedIdeas.size === nicheContentPlan.length ? "Deselect" : "Select All"}
                    </Button>
                    {selectedIdeas.size > 0 && (
                      <Button size="sm" onClick={pushSelectedToContentPlans} disabled={pushingToPlans} className="text-xs gap-1 h-7">
                        {pushingToPlans ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Add {selectedIdeas.size}
                      </Button>
                    )}
                  </div>
                </div>
                {nicheContentPlan.map((item, i) => (
                  <div key={i} className={cn("p-4 rounded-lg border border-border/50 border-l-4 cursor-pointer transition-colors", selectedIdeas.has(i) ? "border-l-primary bg-primary/5" : "border-l-primary/40 hover:bg-muted/30")} onClick={() => toggleIdeaSelection(i)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox checked={selectedIdeas.has(i)} onCheckedChange={() => toggleIdeaSelection(i)} onClick={e => e.stopPropagation()} className="mt-0.5" />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] capitalize">{item.platform}</Badge>
                            <Badge variant="secondary" className="text-[10px] gap-0.5"><TrendingUp className="h-2.5 w-2.5" />{item.estimated_engagement}</Badge>
                          </div>
                          <h4 className="font-medium text-sm">{item.reference_title}</h4>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        {item.reference_video_url && <Button size="sm" variant="default" className="h-7 text-[10px] gap-1" asChild><a href={item.reference_video_url} target="_blank" rel="noopener noreferrer"><Play className="h-3 w-3" />Watch</a></Button>}
                        {item.reference_url && <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" asChild><a href={item.reference_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /></a></Button>}
                      </div>
                    </div>
                    <div className="space-y-2 pl-7 mt-2">
                      <p className="text-xs text-muted-foreground">{item.what_works}</p>
                      <div className="p-2 rounded-md bg-primary/5 border border-primary/10">
                        <p className="text-xs">{item.recreation_prompt}</p>
                      </div>
                    </div>
                    {item.hashtags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pl-7 mt-2">{item.hashtags.map((tag, j) => <span key={j} className="text-[11px] text-primary">#{tag}</span>)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!researchingNiche && nicheContentPlan.length === 0 && (
              <div className="py-10 text-center">
                <Crosshair className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Enter a niche above to get a content plan with references</p>
              </div>
            )}
          </TabsContent>

          {/* Trends */}
          <TabsContent value="trends" className="space-y-4">
            <Button size="sm" onClick={scanTrends} disabled={scanningTrends} variant="outline">
              {scanningTrends ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Search className="h-3.5 w-3.5 mr-1.5" />}
              {scanningTrends ? "Scanning..." : "Quick Scan"}
            </Button>

            {trends.length > 0 ? (
              <div className="space-y-3">
                {trends.map((trend, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border/50 border-l-4 border-l-destructive/40 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] capitalize">{trend.platform}</Badge>
                          {trend.engagement && <Badge variant="secondary" className="text-[10px] gap-0.5"><TrendingUp className="h-2.5 w-2.5" />{trend.engagement}</Badge>}
                        </div>
                        <h4 className="font-medium text-sm">{trend.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{trend.description}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {trend.video_url && <Button size="sm" variant="default" className="h-7 text-[10px] gap-1" asChild><a href={trend.video_url} target="_blank" rel="noopener noreferrer"><Play className="h-3 w-3" />Watch</a></Button>}
                        {trend.url && <Button size="icon" variant="ghost" className="h-7 w-7" asChild><a href={trend.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /></a></Button>}
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 p-2 rounded-md bg-primary/5 border border-primary/10">
                      <ArrowUpRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-primary font-medium">{trend.actionable_tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : !scanningTrends && (
              <div className="py-10 text-center">
                <Flame className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Click scan to discover trending content</p>
              </div>
            )}
          </TabsContent>

          {/* Strategy */}
          <TabsContent value="strategy" className="space-y-4">
            <Button size="sm" onClick={analyzeStrategy} disabled={analyzingStrategy}>
              {analyzingStrategy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5 mr-1.5" />}
              {analyzingStrategy ? "Analyzing..." : "Analyze Strategy"}
            </Button>
            {strategyInsights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {strategyInsights.map((insight, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{insight.title}</h4>
                      <Badge variant={insight.priority === "high" ? "destructive" : insight.priority === "medium" ? "default" : "secondary"} className="text-[10px]">{insight.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                    {insight.metric && <p className="text-xs text-primary font-medium">{insight.metric}</p>}
                  </div>
                ))}
              </div>
            ) : !analyzingStrategy && (
              <div className="py-10 text-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Run a strategy analysis for growth insights</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
