import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { format } from "date-fns";

export function DailyBriefingCard() {
  const { profile } = useAuth();
  const agencyId = profile?.agency_id;

  const { data: briefing } = useQuery({
    queryKey: ['latest-briefing', agencyId],
    queryFn: async () => {
      if (!agencyId) return null;
      const { data, error } = await supabase
        .from('felix_briefings')
        .select('*')
        .eq('agency_id', agencyId)
        .order('briefing_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!agencyId,
  });

  if (!briefing) return null;

  const metrics = briefing.key_metrics as any;
  const alerts = (briefing.alerts as any[]) || [];
  const recommendations = (briefing.recommendations as any[]) || [];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Daily Briefing</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {format(new Date(briefing.briefing_date), 'MMM d')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{briefing.summary}</p>

        {metrics && (
          <div className="grid grid-cols-3 gap-2">
            {metrics.total_revenue != null && (
              <div className="text-center p-2 rounded bg-muted/30">
                <TrendingUp className="h-3.5 w-3.5 mx-auto mb-1 text-success" />
                <p className="text-xs font-medium">${metrics.total_revenue}</p>
                <p className="text-[10px] text-muted-foreground">Revenue</p>
              </div>
            )}
            {metrics.pending_tasks != null && (
              <div className="text-center p-2 rounded bg-muted/30">
                <p className="text-xs font-medium">{metrics.pending_tasks}</p>
                <p className="text-[10px] text-muted-foreground">Pending</p>
              </div>
            )}
            {metrics.active_creators != null && (
              <div className="text-center p-2 rounded bg-muted/30">
                <p className="text-xs font-medium">{metrics.active_creators}</p>
                <p className="text-[10px] text-muted-foreground">Creators</p>
              </div>
            )}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-1.5">
            {recommendations.slice(0, 2).map((rec: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-accent shrink-0" />
                <span className="text-muted-foreground">{rec.title || rec.description}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
