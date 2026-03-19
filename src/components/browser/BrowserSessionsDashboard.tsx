import { useState } from "react";
import { useBrowserSessions, SessionLink } from "@/hooks/useBrowserSessions";
import { useCaptchaCheck } from "@/hooks/useBrowserFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Monitor, Trash2, RefreshCw, Film, Terminal, ShieldAlert, Download, ExternalLink, Users, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SessionRecordingViewer } from "./SessionRecordingViewer";
import { SessionLogsViewer } from "./SessionLogsViewer";
import { SessionDownloadsViewer } from "./SessionDownloadsViewer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActiveBrowserSession } from "@/contexts/ActiveBrowserSessionContext";
import { invokeBrowserAction } from "@/lib/browserbase";
import { useAgency } from "@/hooks/useAgency";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

function statusBadge(status: string | null) {
  switch (status) {
    case "authenticated":
      return <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Authenticated</Badge>;
    case "authenticating":
      return <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30">In Progress</Badge>;
    case "expired":
      return <Badge variant="destructive">Expired</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}

type ViewerPanel = {
  type: "recording" | "logs" | "downloads";
  sessionId: string;
  label: string;
};

export function BrowserSessionsDashboard() {
  const { sessionLinks, activeSessions, linksLoading, terminateSession, invalidate } = useBrowserSessions();
  const { setActiveSession, setMinimized } = useActiveBrowserSession();
  const captchaCheck = useCaptchaCheck();
  const [viewerPanel, setViewerPanel] = useState<ViewerPanel | null>(null);
  const isMobile = useIsMobile();
  const { agencyId } = useAgency();

  const scrapeFans = useMutation({
    mutationFn: async ({ browserbaseSessionId, creatorId }: { browserbaseSessionId: string; creatorId?: string }) => {
      return await invokeBrowserAction("scrape_fan_analytics", {
        browserbaseSessionId,
        creatorId,
        agencyId,
      });
    },
    onSuccess: (data) => {
      toast.success(`Fan analytics scraped: ${data.fansUpserted || 0} fans, ${data.chatsUpserted || 0} chats extracted`);
    },
    onError: (err: Error) => {
      toast.error(`Fan scrape failed: ${err.message}`);
    },
  });

  const handleRejoinSession = (activeSessionRow: any, link: any) => {
    setActiveSession({
      embedUrl: activeSessionRow.embed_url,
      sessionId: activeSessionRow.browserbase_session_id,
      sessionLinkId: link.id,
      creatorId: link.creator_id,
      creatorName: link.creator?.name,
      platform: link.platform,
    });
    setMinimized(false);
  };

  if (linksLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Saved Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  if (viewerPanel) {
    if (viewerPanel.type === "recording") {
      return <SessionRecordingViewer browserbaseSessionId={viewerPanel.sessionId} sessionLabel={viewerPanel.label} onClose={() => setViewerPanel(null)} />;
    }
    if (viewerPanel.type === "logs") {
      return <SessionLogsViewer browserbaseSessionId={viewerPanel.sessionId} sessionLabel={viewerPanel.label} onClose={() => setViewerPanel(null)} />;
    }
    if (viewerPanel.type === "downloads") {
      return <SessionDownloadsViewer browserbaseSessionId={viewerPanel.sessionId} sessionLabel={viewerPanel.label} onClose={() => setViewerPanel(null)} />;
    }
  }

  if (sessionLinks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Saved Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No sessions yet. Use the launcher above to create your first browser session.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeSessionMap = new Map<string, number>();
  activeSessions.forEach((s) => {
    if (s.session_link_id) {
      activeSessionMap.set(s.session_link_id, (activeSessionMap.get(s.session_link_id) || 0) + 1);
    }
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          Saved Sessions
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={invalidate} className="h-8 w-8">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className={isMobile ? "px-3 pb-3" : "p-0"}>
        {isMobile ? (
          <MobileSessionList
            sessionLinks={sessionLinks}
            activeSessions={activeSessions}
            activeSessionMap={activeSessionMap}
            terminateSession={terminateSession}
            captchaCheck={captchaCheck}
            setViewerPanel={setViewerPanel}
            onRejoinSession={handleRejoinSession}
            scrapeFans={scrapeFans}
          />
        ) : (
          <DesktopSessionTable
            sessionLinks={sessionLinks}
            activeSessions={activeSessions}
            activeSessionMap={activeSessionMap}
            terminateSession={terminateSession}
            captchaCheck={captchaCheck}
            setViewerPanel={setViewerPanel}
            onRejoinSession={handleRejoinSession}
            scrapeFans={scrapeFans}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Shared props interface
interface SessionListProps {
  sessionLinks: any[];
  activeSessions: any[];
  activeSessionMap: Map<string, number>;
  terminateSession: (id: string) => void;
  captchaCheck: any;
  setViewerPanel: (panel: ViewerPanel | null) => void;
  onRejoinSession: (activeSession: any, link: any) => void;
  scrapeFans: any;
}

function MobileSessionList({ sessionLinks, activeSessions, activeSessionMap, terminateSession, captchaCheck, setViewerPanel, onRejoinSession, scrapeFans }: SessionListProps) {
  return (
    <div className="space-y-3">
      {sessionLinks.map((link) => {
        const activeCount = activeSessionMap.get(link.id) || 0;
        const linkActiveSessions = activeSessions.filter((s: any) => s.session_link_id === link.id);
        const creatorLabel = link.creator?.name || "Unknown";

        return (
          <div key={link.id} className="rounded-lg border bg-muted/30 p-3 space-y-3">
            {/* Header: avatar + name + status */}
            <div className="flex items-center gap-3">
              <UserAvatar name={link.creator?.name || "?"} className="h-9 w-9" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm truncate block">
                  {link.creator?.name || "Unknown"}
                  {link.creator?.alias && (
                    <span className="text-muted-foreground font-normal ml-1">({link.creator.alias})</span>
                  )}
                </span>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge variant="outline" className="capitalize text-xs">{link.platform}</Badge>
                  {statusBadge(link.session_status)}
                </div>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {link.last_saved_at
                  ? formatDistanceToNow(new Date(link.last_saved_at), { addSuffix: true })
                  : "Never used"}
              </span>
              {activeCount > 0 && (
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs">
                  {activeCount} active
                </Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              {link.browserbase_session_id && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setViewerPanel({ type: "recording", sessionId: link.browserbase_session_id!, label: creatorLabel })} className="h-8 text-xs gap-1">
                    <Film className="h-3.5 w-3.5" /> Recording
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setViewerPanel({ type: "logs", sessionId: link.browserbase_session_id!, label: creatorLabel })} className="h-8 text-xs gap-1">
                    <Terminal className="h-3.5 w-3.5" /> Logs
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setViewerPanel({ type: "downloads", sessionId: link.browserbase_session_id!, label: creatorLabel })} className="h-8 text-xs gap-1">
                    <Download className="h-3.5 w-3.5" /> Files
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => captchaCheck.mutate({ browserbaseSessionId: link.browserbase_session_id!, sessionLinkId: link.id })} className="h-8 text-xs gap-1" disabled={captchaCheck.isPending}>
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              {linkActiveSessions.map((s: any) => (
                <div key={s.id} className="flex items-center gap-1">
                  <Button size="sm" onClick={() => onRejoinSession(s, link)} className="h-8 text-xs gap-1">
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => scrapeFans.mutate({ browserbaseSessionId: s.browserbase_session_id, creatorId: link.creator_id })} className="h-8 text-xs gap-1" disabled={scrapeFans.isPending}>
                    {scrapeFans.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />} Scrape Fans
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => terminateSession(s.browserbase_session_id)} className="text-destructive h-8 text-xs gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Kill
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DesktopSessionTable({ sessionLinks, activeSessions, activeSessionMap, terminateSession, captchaCheck, setViewerPanel, onRejoinSession, scrapeFans }: SessionListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Creator</TableHead>
          <TableHead>Platform</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Active Sessions</TableHead>
          <TableHead>Last Used</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessionLinks.map((link) => {
          const activeCount = activeSessionMap.get(link.id) || 0;
          const linkActiveSessions = activeSessions.filter((s: any) => s.session_link_id === link.id);
          const creatorLabel = link.creator?.name || "Unknown";

          return (
            <TableRow key={link.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <UserAvatar name={link.creator?.name || "?"} className="h-8 w-8" />
                  <div>
                    <span className="font-medium text-sm">{link.creator?.name || "Unknown"}</span>
                    {link.creator?.alias && (
                      <span className="text-xs text-muted-foreground ml-1">({link.creator.alias})</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">{link.platform}</Badge>
              </TableCell>
              <TableCell>{statusBadge(link.session_status)}</TableCell>
              <TableCell>
                {activeCount > 0 ? (
                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">{activeCount} active</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {link.last_saved_at ? formatDistanceToNow(new Date(link.last_saved_at), { addSuffix: true }) : "Never"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 flex-wrap">
                  {link.browserbase_session_id && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setViewerPanel({ type: "recording", sessionId: link.browserbase_session_id!, label: creatorLabel })} className="h-7 text-xs" title="View Recording">
                        <Film className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setViewerPanel({ type: "logs", sessionId: link.browserbase_session_id!, label: creatorLabel })} className="h-7 text-xs" title="View Logs">
                        <Terminal className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setViewerPanel({ type: "downloads", sessionId: link.browserbase_session_id!, label: creatorLabel })} className="h-7 text-xs" title="View Downloads">
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => captchaCheck.mutate({ browserbaseSessionId: link.browserbase_session_id!, sessionLinkId: link.id })} className="h-7 text-xs" title="Check CAPTCHA Events" disabled={captchaCheck.isPending}>
                        <ShieldAlert className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {linkActiveSessions.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-1">
                      <Button size="sm" onClick={() => onRejoinSession(s, link)} className="h-7 text-xs gap-1">
                        <ExternalLink className="h-3 w-3" /> Open
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => scrapeFans.mutate({ browserbaseSessionId: s.browserbase_session_id, creatorId: link.creator_id })} className="h-7 text-xs gap-1" title="Scrape Fan Analytics" disabled={scrapeFans.isPending}>
                        {scrapeFans.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Users className="h-3 w-3" />} Fans
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => terminateSession(s.browserbase_session_id)} className="text-destructive h-7 text-xs">
                        <Trash2 className="h-3 w-3 mr-1" /> Kill
                      </Button>
                    </div>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
