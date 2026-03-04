import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, ExternalLink } from "lucide-react";

interface TrackingLink {
  id: string;
  name: string;
  url: string;
  campaign: string | null;
  source: string | null;
  clicks: number | null;
  conversions: number | null;
  revenue: number | null;
  is_active: boolean | null;
}

interface MarketingLinkPerformanceProps {
  links: TrackingLink[];
  loading?: boolean;
}

export function MarketingLinkPerformance({ links, loading }: MarketingLinkPerformanceProps) {
  const sorted = [...links].sort((a, b) => (b.revenue || 0) - (a.revenue || 0));

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center gap-2">
        <Link2 className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg">Marketing Link Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No tracking links yet</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Link</span>
              <span className="text-right">Clicks</span>
              <span className="text-right">Conv.</span>
              <span className="text-right">Revenue</span>
              <span className="text-right">ROI</span>
            </div>
            {sorted.slice(0, 10).map((link) => {
              const convRate = (link.clicks || 0) > 0
                ? (((link.conversions || 0) / (link.clicks || 1)) * 100).toFixed(1)
                : "0.0";
              return (
                <div key={link.id} className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 items-center p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{link.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {link.campaign && (
                        <Badge variant="secondary" className="text-[10px]">{link.campaign}</Badge>
                      )}
                      {link.source && (
                        <Badge variant="outline" className="text-[10px]">{link.source}</Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-foreground text-right tabular-nums">{(link.clicks || 0).toLocaleString()}</span>
                  <span className="text-sm text-foreground text-right tabular-nums">{link.conversions || 0}</span>
                  <span className="text-sm font-semibold text-foreground text-right tabular-nums">${(link.revenue || 0).toFixed(0)}</span>
                  <span className="text-sm text-muted-foreground text-right tabular-nums">{convRate}%</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
