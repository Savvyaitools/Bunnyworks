import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Monitor, PanelRightOpen, PanelRightClose, Users, AlertTriangle, RotateCcw } from "lucide-react";
import { BrowserSessionPanel } from "./BrowserSessionPanel";
import { IzzyOverlay } from "./IzzyOverlay";
import { useSessionHeartbeat } from "@/hooks/useSessionHeartbeat";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
  const [stuckDetected, setStuckDetected] = useState(false);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMobile = useIsMobile();

  // Detect if iframe hasn't loaded after 30 seconds (likely stuck)
  useEffect(() => {
    if (!loaded) {
      loadTimerRef.current = setTimeout(() => {
        setStuckDetected(true);
      }, 30000);
    } else {
      setStuckDetected(false);
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    }
    return () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    };
  }, [loaded]);

  const handleRetryLoad = useCallback(() => {
    setLoaded(false);
    setStuckDetected(false);
    if (iframeRef.current) {
      iframeRef.current.src = embedUrl;
    }
  }, [embedUrl]);

  // Heartbeat: keeps session alive while this viewer has the tab open
  useSessionHeartbeat(sessionId || null, chatterId);

  const panelContent = (
    <BrowserSessionPanel
      creatorName={title}
      platform={platform || "onlyfans"}
      collapsed={false}
      onToggle={() => setPanelOpen(!panelOpen)}
      iframeRef={iframeRef}
    />
  );

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b bg-card shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
          <Monitor className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium text-sm truncate">{title}</span>
          {!isMobile && platform && (
            <Badge variant="secondary" className="text-xs capitalize shrink-0">
              {platform}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs shrink-0">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 inline-block animate-pulse" />
            Live
          </Badge>
          {!isMobile && viewerCount > 1 && (
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30 shrink-0">
              <Users className="h-3 w-3 mr-1" />
              {viewerCount} viewing
            </Badge>
          )}
          {!isMobile && permissions && (
            <Badge
              variant="outline"
              className="text-xs bg-primary/10 text-primary border-primary/30 shrink-0"
            >
              {getPermissionSummary(permissions)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {showSaveButton && onSaveAndClose && (
            <Button
              size="sm"
              onClick={onSaveAndClose}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
            >
              {saving ? "Saving..." : isMobile ? "Save" : "Save Login & Close"}
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
                {stuckDetected ? (
                  <>
                    <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
                    <p className="text-sm font-medium text-foreground">
                      Session is taking longer than expected
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      The browser may be stuck. This can happen if the platform is running a security check or CAPTCHA.
                    </p>
                    <div className="flex gap-2 justify-center pt-1">
                      <Button size="sm" variant="outline" onClick={handleRetryLoad} className="gap-1.5">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retry Connection
                      </Button>
                      {showSaveButton && onSaveAndClose && (
                        <Button size="sm" variant="destructive" onClick={onClose}>
                          Close Session
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Skeleton className="h-8 w-48 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Loading browser session...
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          {/* Login guidance banner */}
          {loaded && showSaveButton && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-card/95 backdrop-blur border border-border rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 max-w-md animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
              <p className="text-xs text-muted-foreground">
                After logging in, click <span className="font-semibold text-foreground">"Save Login & Close"</span> to save the session for your team.
              </p>
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

        {/* Side panel — desktop: inline, mobile: sheet */}
        {isMobile ? (
          <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
            <SheetContent side="right" className="p-0 w-[85vw] max-w-sm">
              <div className="h-full overflow-auto">{panelContent}</div>
            </SheetContent>
          </Sheet>
        ) : (
          panelOpen && (
            <BrowserSessionPanel
              creatorName={title}
              platform={platform || "onlyfans"}
              collapsed={!panelOpen}
              onToggle={() => setPanelOpen(!panelOpen)}
              iframeRef={iframeRef}
            />
          )
        )}
        {!isMobile && !panelOpen && (
          <BrowserSessionPanel
            creatorName={title}
            platform={platform || "onlyfans"}
            collapsed={true}
            onToggle={() => setPanelOpen(true)}
            iframeRef={iframeRef}
          />
        )}
      </div>

      {/* Jodie AI Floating Overlay */}
      {creatorId && (
        <IzzyOverlay creatorId={creatorId} creatorName={title} iframeRef={iframeRef} />
      )}
    </div>
  );
}
