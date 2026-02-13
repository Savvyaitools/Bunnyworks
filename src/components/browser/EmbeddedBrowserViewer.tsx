import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Maximize2, Minimize2, Monitor } from "lucide-react";

interface EmbeddedBrowserViewerProps {
  embedUrl: string;
  title?: string;
  platform?: string;
  onClose: () => void;
  onSaveAndClose?: () => void;
  showSaveButton?: boolean;
  saving?: boolean;
}

export function EmbeddedBrowserViewer({
  embedUrl,
  title = "Browser Session",
  platform,
  onClose,
  onSaveAndClose,
  showSaveButton = false,
  saving = false,
}: EmbeddedBrowserViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const containerClass = fullscreen
    ? "fixed inset-0 z-50 bg-background flex flex-col"
    : "flex flex-col h-[calc(100vh-200px)] min-h-[500px]";

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-3">
          <Monitor className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{title}</span>
          {platform && (
            <Badge variant="secondary" className="text-xs capitalize">
              {platform}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 inline-block animate-pulse" />
            Live
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {showSaveButton && onSaveAndClose && (
            <Button
              size="sm"
              onClick={onSaveAndClose}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? "Saving..." : "Save Login & Close"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullscreen(!fullscreen)}
            className="h-8 w-8"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-destructive">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* iframe */}
      <div className="flex-1 relative bg-muted">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Skeleton className="h-8 w-48 mx-auto" />
              <p className="text-sm text-muted-foreground">Loading browser session...</p>
            </div>
          </div>
        )}
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          allow="clipboard-read; clipboard-write"
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      </div>
    </div>
  );
}
