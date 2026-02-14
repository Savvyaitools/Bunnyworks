import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Share2, Calendar, BarChart3, Sparkles, Clock, TrendingUp, 
  Instagram, Twitter, Send, Loader2, Plus, Eye, ThumbsUp, MessageCircle
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreators } from "@/hooks/useCreators";
import { toast } from "sonner";

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

export default function SocialMediaManager() {
  const { creators } = useCreators();
  const [selectedCreator, setSelectedCreator] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<string>("instagram");
  const [generating, setGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [analyzingStrategy, setAnalyzingStrategy] = useState(false);
  const [strategyInsights, setStrategyInsights] = useState<StrategyInsight[]>([]);
  const [contentCalendar, setContentCalendar] = useState<GeneratedPost[]>([]);
  const [generatingCalendar, setGeneratingCalendar] = useState(false);

  const generatePosts = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic or theme");
      return;
    }
    setGenerating(true);
    try {
      const creator = creators?.find(c => c.id === selectedCreator);
      const { data, error } = await supabase.functions.invoke("ai-social-media-manager", {
        body: {
          action: "generate_posts",
          topic,
          platform,
          creatorName: creator?.name || "the creator",
          creatorNiche: "general",
          creatorPersona: creator?.persona || "",
        },
      });
      if (error) throw error;
      setGeneratedPosts(data.posts || []);
      toast.success(`Generated ${data.posts?.length || 0} post ideas`);
    } catch (err) {
      toast.error("Failed to generate posts");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const analyzeStrategy = async () => {
    setAnalyzingStrategy(true);
    try {
      const creator = creators?.find(c => c.id === selectedCreator);
      const { data, error } = await supabase.functions.invoke("ai-social-media-manager", {
        body: {
          action: "analyze_strategy",
          creatorName: creator?.name || "the creator",
          creatorNiche: "general",
          platform,
        },
      });
      if (error) throw error;
      setStrategyInsights(data.insights || []);
      toast.success("Strategy analysis complete");
    } catch (err) {
      toast.error("Failed to analyze strategy");
      console.error(err);
    } finally {
      setAnalyzingStrategy(false);
    }
  };

  const generateCalendar = async () => {
    setGeneratingCalendar(true);
    try {
      const creator = creators?.find(c => c.id === selectedCreator);
      const { data, error } = await supabase.functions.invoke("ai-social-media-manager", {
        body: {
          action: "generate_calendar",
          creatorName: creator?.name || "the creator",
          creatorNiche: "general",
          platform,
          days: 7,
        },
      });
      if (error) throw error;
      setContentCalendar(data.calendar || []);
      toast.success("7-day content calendar generated");
    } catch (err) {
      toast.error("Failed to generate calendar");
      console.error(err);
    } finally {
      setGeneratingCalendar(false);
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
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Share2 className="h-6 w-6 text-primary" />
              Tatum
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI Social Media Manager — generate content, schedule posts, and optimize your strategy
            </p>
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

        <Tabs defaultValue="generate" className="space-y-4">
          <TabsList>
            <TabsTrigger value="generate" className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Generate Posts
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <Calendar className="h-4 w-4" /> Content Calendar
            </TabsTrigger>
            <TabsTrigger value="strategy" className="gap-1.5">
              <BarChart3 className="h-4 w-4" /> Strategy
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
                <Textarea
                  placeholder="e.g. New photo set teaser, behind the scenes content, fan engagement poll..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  rows={3}
                />
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
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          navigator.clipboard.writeText(post.caption + "\n\n" + post.hashtags.map(t => `#${t}`).join(" "));
                          toast.success("Copied to clipboard");
                        }}>
                          Copy
                        </Button>
                      </div>
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
