import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useSessionDownloads } from "@/hooks/useBrowserFeatures";
import { Download, AlertCircle, FileDown } from "lucide-react";

interface SessionDownloadsViewerProps {
  browserbaseSessionId: string;
  sessionLabel?: string;
  onClose?: () => void;
}

export function SessionDownloadsViewer({ browserbaseSessionId, sessionLabel, onClose }: SessionDownloadsViewerProps) {
  const { data: downloads, isLoading, error } = useSessionDownloads(browserbaseSessionId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Session Downloads
          {sessionLabel && <span className="text-sm font-normal text-muted-foreground">— {sessionLabel}</span>}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Downloads not available for this session.
            </p>
          </div>
        ) : downloads && Array.isArray(downloads) && downloads.length > 0 ? (
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {downloads.map((dl: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <FileDown className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{dl.name || dl.filename || `File ${i + 1}`}</p>
                      {dl.size && (
                        <p className="text-xs text-muted-foreground">
                          {(dl.size / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                  </div>
                  {dl.url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={dl.url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No files were downloaded during this session.</p>
        )}
      </CardContent>
    </Card>
  );
}
