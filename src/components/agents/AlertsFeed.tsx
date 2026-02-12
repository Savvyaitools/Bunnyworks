import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, XCircle, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AlertsFeedProps {
  alerts: any[];
  onDismiss: (id: string) => void;
}

const severityConfig: Record<string, { icon: any; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  critical: { icon: XCircle, variant: 'destructive' },
  warning: { icon: AlertTriangle, variant: 'default' },
  info: { icon: Info, variant: 'secondary' },
};

export function AlertsFeed({ alerts, onDismiss }: AlertsFeedProps) {
  const activeAlerts = alerts.filter(a => !a.is_dismissed);

  if (activeAlerts.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base">Agent Alerts</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">No active alerts. All systems normal. ✅</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Agent Alerts</CardTitle>
          <Badge variant="destructive" className="text-xs">{activeAlerts.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {activeAlerts.map((alert) => {
          const config = severityConfig[alert.severity] || severityConfig.info;
          const Icon = config.icon;
          return (
            <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{alert.title}</span>
                  <Badge variant={config.variant} className="text-[10px]">{alert.severity}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onDismiss(alert.id)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
