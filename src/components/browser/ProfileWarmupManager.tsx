import { useState } from "react";
import { Flame, Play, Zap, Plus, ArrowRight, Search, Globe, BookOpen, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfileWarmups, useWarmupIntelligence } from "@/hooks/useProfileWarmups";
import { useCreators } from "@/hooks/useCreators";
import { useBrowserSessions } from "@/hooks/useBrowserSessions";
import { formatDistanceToNow } from "date-fns";

function healthBadge(latestWarmup: any) {
  if (!latestWarmup) return <Badge variant="outline" className="text-muted-foreground">Never warmed</Badge>;
  if (latestWarmup.status === "running") return <Badge variant="secondary">Running...</Badge>;
  if (latestWarmup.status === "failed") return <Badge variant="destructive">Failed</Badge>;
  const ago = Date.now() - new Date(latestWarmup.completed_at || latestWarmup.created_at).getTime();
  const days = ago / (1000 * 60 * 60 * 24);
  if (days < 3) return <Badge variant="default">Healthy</Badge>;
  if (days < 7) return <Badge variant="secondary">Aging</Badge>;
  return <Badge variant="outline">Stale</Badge>;
}

export function ProfileWarmupManager() {
  const { creators } = useCreators();
  const { sessionLinks } = useBrowserSessions();
  const { warmups, preWarmed, warmupSingle, warmupBatch, createPreWarm, assignPreWarm, getLatestWarmup } = useProfileWarmups();
  const { intelligence, isLoading: intelLoading } = useWarmupIntelligence();
  const [warmupType, setWarmupType] = useState<string>("full");
  const [bulkRunning, setBulkRunning] = useState(false);
  const [assignCreatorId, setAssignCreatorId] = useState<string>("");

  const activeCreators = creators.filter(c => c.status === "Active" || c.status === "Onboarding");

  const handleWarmupAll = async () => {
    setBulkRunning(true);
    try {
      const batch = await warmupBatch.mutateAsync({ warmupType });
      const ids: string[] = batch.creatorIds || [];
      // Fire all in parallel
      await Promise.allSettled(ids.map(id => warmupSingle.mutateAsync({ creatorId: id, warmupType })));
    } catch { /* errors handled by mutation */ }
    setBulkRunning(false);
  };

  const handleCreatePreWarm = async () => {
    const profile = await createPreWarm.mutateAsync({ warmupType });
    if (profile?.contextId) {
      // Auto-warmup the new context
      warmupSingle.mutate({ contextId: profile.contextId, warmupType });
    }
  };

  const availablePreWarmed = preWarmed.filter(p => p.status === "available");

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={warmupType} onValueChange={setWarmupType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="generic">Generic (cookies only)</SelectItem>
            <SelectItem value="research">Research (intel only)</SelectItem>
            <SelectItem value="full">Full (cookies + intel)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleWarmupAll} disabled={bulkRunning || activeCreators.length === 0} className="gap-2">
          <Zap className="h-4 w-4" />
          {bulkRunning ? "Warming All..." : `Warm Up All (${activeCreators.length})`}
        </Button>
        <Button variant="outline" onClick={handleCreatePreWarm} disabled={createPreWarm.isPending} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Pre-Warm Profile
        </Button>
      </div>

      <Tabs defaultValue="creators">
        <TabsList>
          <TabsTrigger value="creators" className="gap-2"><Flame className="h-4 w-4" />Creator Profiles</TabsTrigger>
          <TabsTrigger value="pool" className="gap-2"><Globe className="h-4 w-4" />Pre-Warm Pool ({availablePreWarmed.length})</TabsTrigger>
          <TabsTrigger value="intelligence" className="gap-2"><BookOpen className="h-4 w-4" />Intelligence Feed</TabsTrigger>
        </TabsList>

        {/* Creator Profiles */}
        <TabsContent value="creators" className="space-y-3">
          {activeCreators.length === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No active creators. Add creators to start building browser profiles.</CardContent></Card>
          )}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeCreators.map(creator => {
              const latest = getLatestWarmup(creator.id);
              const link = sessionLinks.find(l => l.creator_id === creator.id);
              const isRunning = latest?.status === "running";
              const progress = isRunning && latest.total_sites > 0
                ? Math.round((latest.sites_visited / latest.total_sites) * 100)
                : 0;

              return (
                <Card key={creator.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{creator.alias || creator.name}</CardTitle>
                      {healthBadge(latest)}
                    </div>
                    <CardDescription className="text-xs">
                      {link?.browserbase_context_id
                        ? <span className="font-mono">ctx: {link.browserbase_context_id.slice(0, 12)}…</span>
                        : "No context yet — warmup will auto-create one"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isRunning && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Sites visited</span>
                          <span>{latest.sites_visited}/{latest.total_sites}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                    {latest?.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        Last: {formatDistanceToNow(new Date(latest.completed_at), { addSuffix: true })} ({latest.sites_visited} sites, {latest.warmup_type})
                      </p>
                    )}
                    {latest?.status === "failed" && (
                      <p className="text-xs text-destructive">{latest.error_message}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm" variant="outline" className="gap-1.5 flex-1"
                        disabled={isRunning || warmupSingle.isPending}
                        onClick={() => warmupSingle.mutate({ creatorId: creator.id, warmupType })}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Warm Up
                      </Button>
                      <Button
                        size="sm" variant="outline" className="gap-1.5"
                        disabled={isRunning || warmupSingle.isPending}
                        onClick={() => warmupSingle.mutate({ creatorId: creator.id, warmupType: "research" })}
                      >
                        <Search className="h-3.5 w-3.5" />
                        Research
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Pre-Warm Pool */}
        <TabsContent value="pool" className="space-y-3">
          {preWarmed.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              No pre-warmed profiles yet. Create one to have a ready-to-assign browser context.
            </CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {preWarmed.map(pw => (
                <Card key={pw.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-mono">
                        {pw.browserbase_context_id.slice(0, 16)}…
                      </CardTitle>
                      <Badge variant={pw.status === "available" ? "default" : "secondary"}>
                        {pw.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Warmed {pw.warmup_count}x
                      {pw.last_warmed_at && ` · Last: ${formatDistanceToNow(new Date(pw.last_warmed_at), { addSuffix: true })}`}
                    </p>
                    {pw.status === "available" && (
                      <div className="flex gap-2 items-center">
                        <Select value={assignCreatorId} onValueChange={setAssignCreatorId}>
                          <SelectTrigger className="flex-1 h-8 text-xs">
                            <SelectValue placeholder="Assign to creator..." />
                          </SelectTrigger>
                          <SelectContent>
                            {activeCreators.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.alias || c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm" variant="outline"
                          disabled={!assignCreatorId || assignPreWarm.isPending}
                          onClick={() => {
                            assignPreWarm.mutate({ profileId: pw.id, creatorId: assignCreatorId });
                            setAssignCreatorId("");
                          }}
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Intelligence Feed */}
        <TabsContent value="intelligence">
          {intelligence.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              No intelligence gathered yet. Run a "Research" or "Full" warmup to start collecting data.
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Research Intelligence</CardTitle>
                  <CardDescription>Structured data extracted via AI during research warmup runs — automatically fed to Tatum</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="hidden md:table-cell">Key Insights</TableHead>
                        <TableHead className="hidden lg:table-cell">Engagement</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {intelligence.map(item => {
                        const hasStructured = (item as any).key_takeaways?.length > 0 || (item as any).engagement_metrics;
                        const contentType = (item as any).content_type || "raw";
                        const typeBadgeVariant = contentType === "article" ? "default" : contentType === "reddit_post" ? "secondary" : "outline";

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="max-w-[200px]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs truncate">{item.page_title || item.source_url}</span>
                                {item.source_url && (
                                  <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                  </a>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={typeBadgeVariant} className="text-xs capitalize">
                                {contentType.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell max-w-[350px]">
                              {hasStructured && (item as any).key_takeaways?.length > 0 ? (
                                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                                  {((item as any).key_takeaways as string[]).slice(0, 3).map((t, i) => (
                                    <li key={i} className="truncate">{t}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-muted-foreground truncate">{item.extracted_text?.slice(0, 120)}</p>
                              )}
                              {(item as any).statistics?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {((item as any).statistics as string[]).slice(0, 3).map((s, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px] font-mono">{s}</Badge>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {(item as any).engagement_metrics && (
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                  {(item as any).engagement_metrics.upvotes != null && (
                                    <span className="block">↑ {(item as any).engagement_metrics.upvotes}</span>
                                  )}
                                  {(item as any).engagement_metrics.comments != null && (
                                    <span className="block">💬 {(item as any).engagement_metrics.comments}</span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
