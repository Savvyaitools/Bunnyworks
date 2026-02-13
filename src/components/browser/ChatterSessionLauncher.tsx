import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrowserSessions } from "@/hooks/useBrowserSessions";
import { EmbeddedBrowserViewer } from "./EmbeddedBrowserViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Globe, Loader2 } from "lucide-react";

interface ChatterSessionLauncherProps {
  chatterId: string;
}

interface AssignedSession {
  id: string;
  session_link_id: string;
  chatter_id: string;
  session_link: {
    id: string;
    platform: string;
    session_status: string | null;
    is_active: boolean;
    browserbase_context_id: string | null;
    creator: {
      id: string;
      name: string;
      alias: string | null;
      avatar_url: string | null;
    };
  };
}

export function ChatterSessionLauncher({ chatterId }: ChatterSessionLauncherProps) {
  const { launchChatterSession, terminateSession, launching } = useBrowserSessions();
  const [activeSession, setActiveSession] = useState<{
    embedUrl: string;
    sessionId: string;
    platform: string;
    creatorName: string;
  } | null>(null);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["chatter-session-assignments", chatterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_link_assignments")
        .select("*, session_link:creator_session_links(id, platform, session_status, is_active, browserbase_context_id, creator:creators(id, name, alias, avatar_url))")
        .eq("chatter_id", chatterId);
      if (error) throw error;
      return (data ?? []) as AssignedSession[];
    },
    enabled: !!chatterId,
  });

  const readySessions = assignments?.filter(
    (a) =>
      a.session_link?.is_active &&
      a.session_link?.session_status === "authenticated" &&
      a.session_link?.browserbase_context_id
  ) ?? [];

  const handleLaunch = async (assignment: AssignedSession) => {
    const result = await launchChatterSession(assignment.session_link_id, chatterId);
    if (result) {
      setActiveSession({
        embedUrl: result.embedUrl,
        sessionId: result.sessionId,
        platform: result.platform,
        creatorName: assignment.session_link.creator?.name || "Creator",
      });
    }
  };

  const handleClose = async () => {
    if (activeSession) {
      await terminateSession(activeSession.sessionId);
      setActiveSession(null);
    }
  };

  if (activeSession) {
    return (
      <EmbeddedBrowserViewer
        embedUrl={activeSession.embedUrl}
        title={`${activeSession.creatorName} — ${activeSession.platform}`}
        platform={activeSession.platform}
        onClose={handleClose}
      />
    );
  }

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  if (readySessions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Live Browser Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {readySessions.map((assignment) => (
          <div
            key={assignment.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <UserAvatar name={assignment.session_link.creator?.name || "?"} className="h-8 w-8" />
              <div>
                <span className="font-medium text-sm">
                  {assignment.session_link.creator?.name}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-xs capitalize">
                    {assignment.session_link.platform}
                  </Badge>
                  <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
                    Ready
                  </Badge>
                </div>
              </div>
            </div>
            <Button size="sm" onClick={() => handleLaunch(assignment)} disabled={launching}>
              {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Open"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
