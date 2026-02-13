import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBrowserSessionEvents } from "@/hooks/useBrowserFeatures";
import { ShieldAlert, Bell, CheckCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function CaptchaAlertsFeed() {
  const { events, isLoading } = useBrowserSessionEvents();

  const captchaEvents = events.filter(
    (e: any) => e.event_type === "captcha_detected" || e.event_type === "captcha_solved"
  );

  const severityIcon = (severity: string) => {
    switch (severity) {
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case "error": return <ShieldAlert className="h-4 w-4 text-red-400" />;
      default: return <CheckCircle className="h-4 w-4 text-green-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          CAPTCHA Events
          {captchaEvents.length > 0 && (
            <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30 ml-2">
              {captchaEvents.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : captchaEvents.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-10 w-10 text-green-500/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No CAPTCHA events detected. Sessions are running smoothly.</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {captchaEvents.map((event: any) => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                  {severityIcon(event.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{event.title}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {event.event_type.replace("_", " ")}
                      </Badge>
                    </div>
                    {event.message && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{event.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
