import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Maximize2, Minimize2, Monitor } from "lucide-react";

export interface BrowserPermissions {
  can_view_chats: boolean;
  can_send_messages: boolean;
  can_send_mass_messages: boolean;
  can_view_fans: boolean;
  can_view_posts: boolean;
  can_create_posts: boolean;
  can_view_vault: boolean;
  can_view_earnings: boolean;
  can_view_notifications: boolean;
}

interface EmbeddedBrowserViewerProps {
  embedUrl: string;
  title?: string;
  platform?: string;
  onClose: () => void;
  onSaveAndClose?: () => void;
  showSaveButton?: boolean;
  saving?: boolean;
  permissions?: BrowserPermissions;
}

function getPermissionSummary(perms: BrowserPermissions): string {
  const labels: string[] = [];
  if (perms.can_view_chats || perms.can_send_messages) labels.push("Chats");
  if (perms.can_view_fans) labels.push("Fans");
  if (perms.can_view_posts || perms.can_create_posts) labels.push("Posts");
  if (perms.can_view_vault) labels.push("Vault");
  if (perms.can_view_earnings) labels.push("Earnings");
  if (labels.length === 5) return "Full Access";
  if (labels.length === 0) return "View Only";
  return labels.join(" · ");
}

export function EmbeddedBrowserViewer({
  embedUrl,
  title = "Browser Session",
  platform,
  onClose,
  onSaveAndClose,
  showSaveButton = false,
  saving = false,
  permissions,
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
          {permissions && (
            <Badge 
              variant="outline" 
              className="text-xs bg-primary/10 text-primary border-primary/30"
            >
              {getPermissionSummary(permissions)}
            </Badge>
          )}
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
