import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Link2,
  Plus,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  Target,
  Copy,
  ExternalLink,
  BarChart3,
  Loader2,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { useTrackingLinks, CreateTrackingLinkInput } from "@/hooks/useTrackingLinks";
import { useCreators } from "@/hooks/useCreators";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))"];

export default function MarketingAnalytics() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyNArx4w_f4mD1k9DPz0qgsKJFGDXw0gIJ8nvEuPHX_Wp6axJRs-P7T9pI2Y8LBeaJo5w/exec";

  const syncToGoogleSheet = async () => {
    if (trackingLinks.length === 0) {
      toast.error("No tracking links to sync");
      return;
    }

    setIsSyncing(true);
    try {
      const dataToSync = trackingLinks.map(link => ({
        name: link.name,
        code: link.code,
        source: link.source || "Direct",
        campaign: link.campaign || "No Campaign",
        clicks: link.clicks,
        conversions: link.conversions,
        revenue: Number(link.revenue),
        status: link.is_active ? "Active" : "Inactive",
        created_at: new Date(link.created_at).toLocaleDateString(),
      }));

      await fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "sync",
          data: dataToSync,
          stats: {
            totalLinks: stats.total,
            totalClicks: stats.totalClicks,
            totalConversions: stats.totalConversions,
            totalRevenue: stats.totalRevenue,
            conversionRate: stats.conversionRate.toFixed(2),
            syncedAt: new Date().toISOString(),
          },
        }),
      });

      toast.success("Data synced to Google Sheet");
    } catch (error) {
      console.error("Error syncing to Google Sheet:", error);
      toast.error("Failed to sync. Please check your Google Sheet setup.");
    } finally {
      setIsSyncing(false);
    }
  };

  const { trackingLinks, loading, stats, createTrackingLink, updateTrackingLink, deleteTrackingLink } =
    useTrackingLinks();
  const { creators } = useCreators();

  const [newLink, setNewLink] = useState({
    name: "",
    code: "",
    url: "",
    campaign: "",
    source: "",
    creator_id: "",
    of_account_id: null as string | null,
    is_active: true,
  });

  const handleCreateLink = async () => {
    if (!newLink.name || !newLink.code || !newLink.creator_id) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTrackingLink(newLink as CreateTrackingLinkInput);
      setDialogOpen(false);
      setNewLink({
        name: "",
        code: "",
        url: "",
        campaign: "",
        source: "",
        creator_id: "",
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

  // Chart data
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

  const revenueByCampaign = trackingLinks.reduce((acc, link) => {
    const campaign = link.campaign || "No Campaign";
    const existing = acc.find((a) => a.campaign === campaign);
    if (existing) {
      existing.revenue += Number(link.revenue);
    } else {
      acc.push({ campaign, revenue: Number(link.revenue) });
    }
    return acc;
  }, [] as { campaign: string; revenue: number }[]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Marketing Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track trial links, campaigns, and revenue attribution
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={syncToGoogleSheet}
              disabled={isSyncing || trackingLinks.length === 0}
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Sync to Google Sheet
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Tracking Link
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
                <div className="space-y-2">
                  <Label htmlFor="creator">Creator *</Label>
                  <Select
                    value={newLink.creator_id}
                    onValueChange={(v) => setNewLink({ ...newLink, creator_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select creator" />
                    </SelectTrigger>
                    <SelectContent>
                      {creators.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.alias || c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Link"}
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Links</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/20">
                  <Link2 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                  <p className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-accent/20">
                  <MousePointerClick className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold">{stats.totalConversions}</p>
                  <p className="text-xs text-muted-foreground">{stats.conversionRate.toFixed(1)}% rate</p>
                </div>
                <div className="p-2 rounded-lg bg-success/20">
                  <Target className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Attributed Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="p-2 rounded-lg bg-warning/20">
                  <DollarSign className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Revenue by Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueBySource.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
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
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Revenue by Campaign
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByCampaign.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={revenueByCampaign}
                      dataKey="revenue"
                      nameKey="campaign"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ campaign, percent }) =>
                        `${campaign} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {revenueByCampaign.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tracking Links Table */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Tracking Links</CardTitle>
            <CardDescription>Manage all your tracking links and trial URLs</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : trackingLinks.length === 0 ? (
              <div className="text-center py-12">
                <Link2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-semibold">No tracking links yet</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Create your first tracking link to start measuring campaign performance
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
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
                      <TableCell>{link.source || "-"}</TableCell>
                      <TableCell>{link.campaign || "-"}</TableCell>
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
                        <div className="flex items-center justify-end gap-2">
                          {link.url && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(link.url)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" asChild>
                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
