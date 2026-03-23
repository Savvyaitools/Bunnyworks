import { useState } from "react";
import { LinkPageManager } from "./LinkPageManager";
import { Plus, Link2, MousePointerClick, DollarSign, Target, Copy, ExternalLink, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrackingLinks, CreateTrackingLinkInput } from "@/hooks/useTrackingLinks";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { FeatureGuide } from "@/components/shared/FeatureGuide";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CreatorMarketingProps {
  creatorId: string;
  creatorName?: string;
}

export function CreatorMarketing({ creatorId, creatorName }: CreatorMarketingProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { trackingLinks, loading, stats, createTrackingLink, deleteTrackingLink } =
    useTrackingLinks(creatorId);

  const [newLink, setNewLink] = useState({
    name: "",
    code: "",
    url: "",
    campaign: "",
    source: "",
    of_account_id: null as string | null,
    is_active: true,
  });

  const handleCreateLink = async () => {
    if (!newLink.name || !newLink.code) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTrackingLink({
        ...newLink,
        creator_id: creatorId,
      } as CreateTrackingLinkInput);
      setDialogOpen(false);
      setNewLink({
        name: "",
        code: "",
        url: "",
        campaign: "",
        source: "",
        of_account_id: null,
        is_active: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Chart data - revenue by source for this creator
  const revenueBySource = trackingLinks.reduce((acc, link) => {
    const source = link.source || "Direct";
    const existing = acc.find((a) => a.source === source);
    if (existing) {
      existing.revenue += Number(link.revenue);
      existing.clicks += link.clicks;
    } else {
      acc.push({ source, revenue: Number(link.revenue), clicks: link.clicks });
    }
    return acc;
  }, [] as { source: string; revenue: number; clicks: number }[]);

  const guideSteps = [
    {
      icon: <Plus className="h-4 w-4" />,
      title: "Create a Tracking Link",
      description: "Click 'Create Link' and add a unique code for each traffic source",
    },
    {
      icon: <Link2 className="h-4 w-4" />,
      title: "Select Traffic Source",
      description: "Choose where fans will come from (Instagram, TikTok, Reddit, etc.)",
    },
    {
      icon: <Copy className="h-4 w-4" />,
      title: "Share the Link",
      description: "Copy the tracking link and use it in your bio, posts, or marketing",
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      title: "Track Performance",
      description: "Monitor clicks, conversions, and revenue attributed to each link",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Feature Guide */}
      <FeatureGuide
        title="How to Use Tracking Links"
        description="Create unique tracking links to measure which traffic sources bring the most fans and revenue."
        steps={guideSteps}
        tips={[
          "Use different codes for each platform (e.g., 'ig-bio', 'tt-link', 'reddit-post')",
          "Revenue is automatically attributed when fans subscribe through your link",
          "Check this page weekly to see which marketing efforts are paying off",
        ]}
        storageKey="creator-marketing"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Tracking Links</h3>
          <p className="text-sm text-muted-foreground">
            {stats.total} links • {stats.totalClicks.toLocaleString()} clicks • {formatCurrency(stats.totalRevenue)} revenue
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tracking Link</DialogTitle>
              <DialogDescription>
                Create a new tracking link to measure campaign performance
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Instagram Bio Link"
                  value={newLink.name}
                  onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Tracking Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., ig-bio-jan"
                    value={newLink.code}
                    onChange={(e) => setNewLink({ ...newLink, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select
                    value={newLink.source}
                    onValueChange={(v) => setNewLink({ ...newLink, source: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="reddit">Reddit</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign</Label>
                <Input
                  id="campaign"
                  placeholder="e.g., January Promo"
                  value={newLink.campaign}
                  onChange={(e) => setNewLink({ ...newLink, campaign: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Full URL (optional)</Label>
                <Input
                  id="url"
                  placeholder="https://onlyfans.com/..."
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateLink} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Links</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/20">
                <Link2 className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Clicks</p>
                <p className="text-xl font-bold">{stats.totalClicks.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-accent/20">
                <MousePointerClick className="h-4 w-4 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conversions</p>
                <p className="text-xl font-bold">{stats.totalConversions}</p>
                <p className="text-xs text-muted-foreground">{stats.conversionRate.toFixed(1)}%</p>
              </div>
              <div className="p-2 rounded-lg bg-success/20">
                <Target className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/20">
                <DollarSign className="h-4 w-4 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Source Chart */}
      {revenueBySource.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueBySource}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="source" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tracking Links Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : trackingLinks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Link2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold">No tracking links yet</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Create your first tracking link to start measuring campaign performance
          </p>
        </div>
      ) : (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Conv.</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trackingLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{link.code}</code>
                  </TableCell>
                  <TableCell className="capitalize">{link.source || "-"}</TableCell>
                  <TableCell className="text-right">{link.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{link.conversions}</TableCell>
                  <TableCell className="text-right font-medium text-success">
                    {formatCurrency(Number(link.revenue))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={link.is_active ? "default" : "secondary"}>
                      {link.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {link.url && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(link.url)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(link.url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteTrackingLink(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
