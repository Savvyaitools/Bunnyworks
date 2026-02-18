import { useState } from "react";
import { useBrowserSessions, SessionLink } from "@/hooks/useBrowserSessions";
import { useCaptchaCheck } from "@/hooks/useBrowserFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Monitor, Trash2, RefreshCw, Film, Terminal, ShieldAlert, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SessionRecordingViewer } from "./SessionRecordingViewer";
import { SessionLogsViewer } from "./SessionLogsViewer";
import { SessionDownloadsViewer } from "./SessionDownloadsViewer";

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
  const captchaCheck = useCaptchaCheck();
  const [viewerPanel, setViewerPanel] = useState<ViewerPanel | null>(null);

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
      <CardContent className="p-0">
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
              const linkActiveSessions = activeSessions.filter(
                (s) => s.session_link_id === link.id
              );
              const creatorLabel = link.creator?.name || "Unknown";

              return (
                <TableRow key={link.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserAvatar name={link.creator?.name || "?"} className="h-8 w-8" />
                      <div>
                        <span className="font-medium text-sm">
                          {link.creator?.name || "Unknown"}
                        </span>
                        {link.creator?.alias && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({link.creator.alias})
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {link.platform}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {statusBadge(link.session_status)}
                  </TableCell>
                  <TableCell>
                    {activeCount > 0 ? (
                      <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                        {activeCount} active
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {link.last_saved_at
                      ? formatDistanceToNow(new Date(link.last_saved_at), { addSuffix: true })
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {/* Session inspection buttons for completed sessions */}
                      {link.browserbase_session_id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewerPanel({ type: "recording", sessionId: link.browserbase_session_id!, label: creatorLabel })}
                            className="h-7 text-xs"
                            title="View Recording"
                          >
                            <Film className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewerPanel({ type: "logs", sessionId: link.browserbase_session_id!, label: creatorLabel })}
                            className="h-7 text-xs"
                            title="View Logs"
                          >
                            <Terminal className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewerPanel({ type: "downloads", sessionId: link.browserbase_session_id!, label: creatorLabel })}
                            className="h-7 text-xs"
                            title="View Downloads"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => captchaCheck.mutate({ browserbaseSessionId: link.browserbase_session_id!, sessionLinkId: link.id })}
                            className="h-7 text-xs"
                            title="Check CAPTCHA Events"
                            disabled={captchaCheck.isPending}
                          >
                            <ShieldAlert className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {linkActiveSessions.map((s) => (
                        <Button
                          key={s.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => terminateSession(s.browserbase_session_id)}
                          className="text-destructive h-7 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Kill
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
