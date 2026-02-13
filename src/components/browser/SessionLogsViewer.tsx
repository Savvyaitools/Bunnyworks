import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useSessionLogs } from "@/hooks/useBrowserFeatures";
import { Terminal, AlertCircle } from "lucide-react";

interface SessionLogsViewerProps {
  browserbaseSessionId: string;
  sessionLabel?: string;
  onClose?: () => void;
}

export function SessionLogsViewer({ browserbaseSessionId, sessionLabel, onClose }: SessionLogsViewerProps) {
  const { data: logs, isLoading, error } = useSessionLogs(browserbaseSessionId);

  const getSeverityColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "error": return "text-red-400";
      case "warning": case "warn": return "text-amber-400";
      case "info": return "text-blue-400";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          Session Logs
          {sessionLabel && <span className="text-sm font-normal text-muted-foreground">— {sessionLabel}</span>}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Logs not available. The session may still be running or logs haven't been processed yet.
            </p>
          </div>
        ) : logs && Array.isArray(logs) && logs.length > 0 ? (
          <ScrollArea className="h-80 border rounded-lg">
            <div className="p-3 space-y-1 font-mono text-xs">
              {logs.map((log: any, i: number) => {
                const message = typeof log === "string" ? log : log.message || log.text || JSON.stringify(log);
                const level = typeof log === "object" ? (log.level || log.type || "log") : "log";
                const timestamp = typeof log === "object" && log.timestamp 
                  ? new Date(log.timestamp).toLocaleTimeString() 
                  : "";

                return (
                  <div key={i} className="flex items-start gap-2 py-0.5 border-b border-border/30 last:border-0">
                    <Badge variant="outline" className={`text-[10px] px-1 py-0 shrink-0 ${getSeverityColor(level)}`}>
                      {level}
                    </Badge>
                    {timestamp && (
                      <span className="text-muted-foreground/50 shrink-0">{timestamp}</span>
                    )}
                    <span className="text-foreground/80 break-all">{message}</span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No logs recorded for this session.</p>
        )}
      </CardContent>
    </Card>
  );
}
