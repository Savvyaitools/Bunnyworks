import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Users, AlertTriangle, RotateCcw, Globe, Lock, ChevronLeft, ChevronRight, RotateCw, LogIn } from "lucide-react";
import { IzzyOverlay } from "./IzzyOverlay";
import { useSessionHeartbeat } from "@/hooks/useSessionHeartbeat";
import { useIsMobile } from "@/hooks/use-mobile";
import { invokeBrowserAction } from "@/lib/browserbase";
import { toast } from "sonner";

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
  browserbaseSessionId?: string;
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
  browserbaseSessionId,
}: EmbeddedBrowserViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const [stuckDetected, setStuckDetected] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMobile = useIsMobile();
  const injectedRef = useRef(false);

  // Derive the browserbase session ID from the embed URL if not provided
  const bbSessionId = browserbaseSessionId || (() => {
    const match = embedUrl.match(/\/debug\/([^/]+)\//);
    return match ? match[1] : undefined;
  })();

  useEffect(() => {
    if (!loaded) {
      loadTimerRef.current = setTimeout(() => setStuckDetected(true), 30000);
    } else {
      setStuckDetected(false);
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    }
    return () => { if (loadTimerRef.current) clearTimeout(loadTimerRef.current); };
  }, [loaded]);

  // Auto-inject sidebar restrictions when iframe loads
  useEffect(() => {
    if (!loaded || !bbSessionId || injectedRef.current) return;
    // Only inject if permissions indicate non-admin (at least one earning flag is false)
    if (permissions && permissions.can_view_earnings === false) {
      injectedRef.current = true;
      invokeBrowserAction("inject_sidebar_restrictions", {
        browserbaseSessionId: bbSessionId,
        hideStatements: true,
        hideStatistics: true,
        hideMore: true,
      }).catch((err) => {
        console.warn("Failed to inject sidebar restrictions:", err);
      });
    }
  }, [loaded, bbSessionId, permissions]);

  const handleRetryLoad = useCallback(() => {
    setLoaded(false);
    setStuckDetected(false);
    if (iframeRef.current) iframeRef.current.src = embedUrl;
  }, [embedUrl]);

  useSessionHeartbeat(sessionId || null, chatterId);

  const handleCdpNav = useCallback(async (command: "back" | "forward" | "reload") => {
    if (!bbSessionId) return;
    setNavLoading(true);
    try {
      await invokeBrowserAction("navigate_in_session", { browserbaseSessionId: bbSessionId, command });
    } catch (err: any) {
      toast.error("Navigation failed: " + (err.message || "Unknown error"));
    } finally {
      setNavLoading(false);
    }
  }, [bbSessionId]);

  // Derive display URL from platform
  const displayUrl = platform?.toLowerCase() === "fansly" 
    ? "fansly.com" 
    : "onlyfans.com";

  return (
    <div className="fixed inset-0 z-[60] bg-[#202124] flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      {/* Combined compact header on mobile, separate title bar + toolbar on desktop */}
      {isMobile ? (
        /* Single compact toolbar for mobile */
        <div className="flex items-center bg-[#292a2d] px-1.5 py-1 gap-1 border-b border-[#3c4043] shrink-0">
          {/* Nav buttons */}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#9aa0a6] hover:bg-[#3c4043]" disabled={navLoading} onClick={() => handleCdpNav("back")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#9aa0a6] hover:bg-[#3c4043]" disabled={navLoading} onClick={() => handleCdpNav("forward")}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* URL bar */}
          <div className="flex-1 flex items-center bg-[#35363a] rounded-full px-2.5 py-1 gap-1.5 min-w-0">
            <Lock className="h-3 w-3 text-[#9aa0a6] shrink-0" />
            <span className="text-xs text-[#e8eaed] truncate">{displayUrl}</span>
          </div>

          {/* Actions */}
          <Badge variant="outline" className="text-[9px] h-5 border-green-500/30 bg-green-500/10 text-green-400 shrink-0 px-1.5">
            Live
          </Badge>
          {showSaveButton && onSaveAndClose && (
            <Button
              size="sm"
              onClick={onSaveAndClose}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white text-[11px] h-7 px-2"
            >
              {saving ? "..." : "Save"}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: Chrome-like title bar */}
          <div className="flex items-center bg-[#35363a] px-2 py-1 gap-1 shrink-0">
            <div className="flex items-center gap-1.5 bg-[#202124] rounded-t-lg px-3 py-1.5 max-w-[240px] min-w-0">
              <Globe className="h-3.5 w-3.5 text-[#9aa0a6] shrink-0" />
              <span className="text-xs text-[#e8eaed] truncate">{title}</span>
              {platform && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-[#35363a] text-[#9aa0a6] border-0 shrink-0 capitalize">
                  {platform}
                </Badge>
              )}
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              {viewerCount > 1 && (
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30 h-5 shrink-0">
                  <Users className="h-3 w-3 mr-1" />
                  {viewerCount}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] h-5 border-green-500/30 bg-green-500/10 text-green-400 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />
                Live
              </Badge>
              {showSaveButton && onSaveAndClose && (
                <Button
                  size="sm"
                  onClick={onSaveAndClose}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-3"
                >
                  {saving ? "Saving..." : "Save & Close"}
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Desktop: Chrome-like toolbar */}
          <div className="flex items-center bg-[#292a2d] px-2 py-1.5 gap-1.5 border-b border-[#3c4043] shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#9aa0a6] hover:bg-[#3c4043]" disabled={navLoading} onClick={() => handleCdpNav("back")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#9aa0a6] hover:bg-[#3c4043]" disabled={navLoading} onClick={() => handleCdpNav("forward")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#9aa0a6] hover:bg-[#3c4043]" disabled={navLoading} onClick={() => handleCdpNav("reload")}>
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
            <div className="flex-1 flex items-center bg-[#35363a] rounded-full px-3 py-1 gap-2 min-w-0">
              <Lock className="h-3 w-3 text-[#9aa0a6] shrink-0" />
              <span className="text-xs text-[#e8eaed] truncate">{displayUrl}</span>
            </div>
          </div>
        </>
      )}

      {/* Main content: full-width iframe — uses flex-1 + min-h-0 for proper mobile sizing */}
      <div className="flex-1 relative bg-[#202124] min-h-0">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3 px-4">
              {stuckDetected ? (
                <>
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
                  <p className="text-sm font-medium text-[#e8eaed]">Session is taking longer than expected</p>
                  <p className="text-xs text-[#9aa0a6] max-w-xs mx-auto">
                    The browser may be stuck on a security check or CAPTCHA.
                  </p>
                  <div className="flex gap-2 justify-center pt-1">
                    <Button size="sm" variant="outline" onClick={handleRetryLoad} className="gap-1.5 border-[#3c4043] text-[#e8eaed] hover:bg-[#3c4043]">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retry
                    </Button>
                    {showSaveButton && onSaveAndClose && (
                      <Button size="sm" variant="destructive" onClick={onClose}>Close</Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Skeleton className="h-8 w-48 mx-auto bg-[#35363a]" />
                  <p className="text-sm text-[#9aa0a6]">Loading browser session...</p>
                </>
              )}
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

      {/* Jodie AI Floating Overlay */}
      {creatorId && (
        <IzzyOverlay creatorId={creatorId} creatorName={title} iframeRef={iframeRef} browserbaseSessionId={bbSessionId} />
      )}
    </div>
  );
}
