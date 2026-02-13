import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessionRecording } from "@/hooks/useBrowserFeatures";
import { Film, Play, AlertCircle } from "lucide-react";

interface SessionRecordingViewerProps {
  browserbaseSessionId: string;
  sessionLabel?: string;
  onClose?: () => void;
}

export function SessionRecordingViewer({ browserbaseSessionId, sessionLabel, onClose }: SessionRecordingViewerProps) {
  const { data: recording, isLoading, error } = useSessionRecording(browserbaseSessionId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          Session Recording
          {sessionLabel && <span className="text-sm font-normal text-muted-foreground">— {sessionLabel}</span>}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Recording not available. Sessions must be completed before recordings can be accessed.
            </p>
          </div>
        ) : recording ? (
          <div className="space-y-4">
            {/* If recording is a URL, show video player */}
            {typeof recording === "string" ? (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  src={recording}
                  controls
                  className="w-full h-full"
                  poster=""
                />
              </div>
            ) : Array.isArray(recording) ? (
              /* rrweb events array — display info about the recording */
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                    {recording.length} events captured
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  This session has an rrweb DOM recording with {recording.length} events. 
                  The recording captures all user interactions and page changes.
                </p>
                <ScrollArea className="h-48 border rounded-lg p-3">
                  <div className="space-y-1 font-mono text-xs">
                    {recording.slice(0, 50).map((event: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-primary/60">{i + 1}.</span>
                        <span>type: {event.type}</span>
                        {event.timestamp && (
                          <span className="text-muted-foreground/60">
                            @ {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    ))}
                    {recording.length > 50 && (
                      <div className="text-muted-foreground/50 pt-2">
                        ... and {recording.length - 50} more events
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <pre className="bg-muted/50 p-4 rounded-lg overflow-auto text-xs max-h-64">
                  {JSON.stringify(recording, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No recording data found.</p>
        )}
      </CardContent>
    </Card>
  );
}
