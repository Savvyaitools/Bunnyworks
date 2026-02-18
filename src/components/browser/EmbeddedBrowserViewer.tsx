import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Monitor, PanelRightOpen, PanelRightClose, Users } from "lucide-react";
import { BrowserSessionPanel } from "./BrowserSessionPanel";
import { IzzyOverlay } from "./IzzyOverlay";
import { useSessionHeartbeat } from "@/hooks/useSessionHeartbeat";

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
  creatorId?: string;
  viewerCount?: number;
  sessionId?: string;
  chatterId?: string;
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
  creatorId,
  viewerCount = 1,
  sessionId,
  chatterId,
}: EmbeddedBrowserViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Heartbeat: keeps session alive while this viewer has the tab open
  useSessionHeartbeat(sessionId || null, chatterId);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card shrink-0">
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
          {viewerCount > 1 && (
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
              <Users className="h-3 w-3 mr-1" />
              {viewerCount} viewing
            </Badge>
          )}
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
            onClick={() => setPanelOpen(!panelOpen)}
            className="h-8 w-8"
            title={panelOpen ? "Hide panel" : "Show panel"}
          >
            {panelOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content: iframe + side panel */}
      <div className="flex-1 flex min-h-0">
        {/* Browser iframe */}
        <div className="flex-1 relative bg-muted">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Skeleton className="h-8 w-48 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Loading browser session...
                </p>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write"
            onLoad={() => setLoaded(true)}
            style={{ opacity: loaded ? 1 : 0 }}
          />
        </div>

        {/* Side panel */}
        <BrowserSessionPanel
          creatorName={title}
          platform={platform || "onlyfans"}
          collapsed={!panelOpen}
          onToggle={() => setPanelOpen(!panelOpen)}
          iframeRef={iframeRef}
        />
      </div>

      {/* Jodie AI Floating Overlay */}
      {creatorId && (
        <IzzyOverlay creatorId={creatorId} creatorName={title} iframeRef={iframeRef} />
      )}
    </div>
  );
}
