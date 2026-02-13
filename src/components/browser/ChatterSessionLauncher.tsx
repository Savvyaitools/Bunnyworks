import { useState, useEffect } from "react";
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
  chatterId?: string;
}

export function ChatterSessionLauncher({ chatterId }: ChatterSessionLauncherProps) {
  const { launchChatterSession, terminateSession, launching } = useBrowserSessions();
  const [activeSession, setActiveSession] = useState<{
    embedUrl: string;
    sessionId: string;
    platform: string;
    creatorName: string;
  } | null>(null);

  // Get employee_id for current user to look up permissions
  const { data: employeeId } = useQuery({
    queryKey: ["my-employee-id-for-sessions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("employees")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      return data?.id ?? null;
    },
  });

  // Get creator IDs from employee_of_permissions
  const { data: permittedCreatorIds } = useQuery({
    queryKey: ["permitted-creator-ids", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from("employee_of_permissions")
        .select("creator_id")
        .eq("employee_id", employeeId);
      if (error) return [];
      return data.map((p) => p.creator_id);
    },
    enabled: !!employeeId,
  });

  // Get authenticated session links for permitted creators
  const { data: sessionLinks, isLoading } = useQuery({
    queryKey: ["chatter-available-sessions", permittedCreatorIds],
    queryFn: async () => {
      if (!permittedCreatorIds || permittedCreatorIds.length === 0) return [];
      const { data, error } = await supabase
        .from("creator_session_links")
        .select("id, platform, session_status, is_active, browserbase_context_id, creator:creators(id, name, alias, avatar_url)")
        .in("creator_id", permittedCreatorIds)
        .eq("is_active", true)
        .eq("session_status", "authenticated");
      if (error) return [];
      return data ?? [];
    },
    enabled: !!permittedCreatorIds && permittedCreatorIds.length > 0,
  });

  const readySessions = sessionLinks?.filter(
    (s) => s.browserbase_context_id
  ) ?? [];

  const handleLaunch = async (session: (typeof readySessions)[0]) => {
    const effectiveChatterId = chatterId;
    // If no chatterId provided, try to find it from chatters table
    let resolvedChatterId = effectiveChatterId;
    if (!resolvedChatterId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("chatters")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        resolvedChatterId = data?.id ?? undefined;
      }
    }
    if (!resolvedChatterId) return;

    const result = await launchChatterSession(session.id, resolvedChatterId);
    if (result) {
      const creator = session.creator as { name?: string } | null;
      setActiveSession({
        embedUrl: result.embedUrl,
        sessionId: result.sessionId,
        platform: result.platform,
        creatorName: creator?.name || "Creator",
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
        {readySessions.map((session) => {
          const creator = session.creator as { name?: string; alias?: string | null } | null;
          return (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <UserAvatar name={creator?.name || "?"} className="h-8 w-8" />
                <div>
                  <span className="font-medium text-sm">
                    {creator?.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="text-xs capitalize">
                      {session.platform}
                    </Badge>
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
                      Ready
                    </Badge>
                  </div>
                </div>
              </div>
              <Button size="sm" onClick={() => handleLaunch(session)} disabled={launching}>
                {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Open"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
