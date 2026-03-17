import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrowserSessions } from "@/hooks/useBrowserSessions";
import { EmbeddedBrowserViewer, type BrowserPermissions } from "./EmbeddedBrowserViewer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  Globe, Loader2, Monitor, AlertCircle, Users,
} from "lucide-react";

interface ChatterSessionLauncherProps {
  chatterId?: string;
}

export function ChatterSessionLauncher({ chatterId }: ChatterSessionLauncherProps) {
  const { launchChatterSession, terminateSession, launching, activeSessions } = useBrowserSessions();
  const [activeSession, setActiveSession] = useState<{
    embedUrl: string;
    sessionId: string;
    platform: string;
    creatorName: string;
    creatorId?: string;
    permissions?: BrowserPermissions;
    viewerCount?: number;
    sessionLinkId: string;
    browserbaseSessionId: string;
  } | null>(null);
  const [launchingCreatorId, setLaunchingCreatorId] = useState<string | null>(null);

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

  const { data: permissionsData } = useQuery({
    queryKey: ["permitted-creator-permissions", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from("employee_of_permissions")
        .select("*")
        .eq("employee_id", employeeId);
      if (error) return [];
      return data;
    },
    enabled: !!employeeId,
  });

  const { data: assignedCreatorIds } = useQuery({
    queryKey: ["chatter-assigned-creators", chatterId],
    queryFn: async () => {
      if (!chatterId) return [];
      const { data, error } = await supabase
        .from("creator_assignments")
        .select("creator_id")
        .eq("chatter_id", chatterId);
      if (error) return [];
      return data.map(d => d.creator_id);
    },
    enabled: !!chatterId,
  });

  const permittedCreatorIds = permissionsData?.map((p) => p.creator_id) ?? [];
  const allCreatorIds = [...new Set([...permittedCreatorIds, ...(assignedCreatorIds ?? [])])];

  const { data: creators, isLoading: creatorsLoading } = useQuery({
    queryKey: ["chatter-creators-full", allCreatorIds],
    queryFn: async () => {
      if (allCreatorIds.length === 0) return [];
      const { data, error } = await supabase
        .from("creators")
        .select("id, name, alias, avatar_url")
        .in("id", allCreatorIds);
      if (error) return [];
      return data ?? [];
    },
    enabled: allCreatorIds.length > 0,
  });

  const { data: sessionLinks, isLoading: linksLoading } = useQuery({
    queryKey: ["chatter-session-links-ready", allCreatorIds],
    queryFn: async () => {
      if (allCreatorIds.length === 0) return [];
      const { data, error } = await supabase
        .from("creator_session_links")
        .select("id, creator_id, platform, session_status, is_active, browserbase_context_id")
        .in("creator_id", allCreatorIds)
        .eq("is_active", true);
      if (error) return [];
      return data ?? [];
    },
    enabled: allCreatorIds.length > 0,
    refetchInterval: 15000,
  });

  // Helper: find active chatter session for a session link
  const getActiveViewers = (sessionLinkId: string) => {
    return (activeSessions ?? []).find(
      (s) => s.session_link_id === sessionLinkId && s.is_active && s.session_type === "chatter"
    );
  };

  const readyCreators: { creator: typeof creators extends (infer T)[] ? T : never; link: NonNullable<typeof sessionLinks>[0]; perms: any }[] = [];
  const notReadyCreators: { creator: typeof creators extends (infer T)[] ? T : never; reason: string }[] = [];

  (creators ?? []).forEach((c) => {
    const link = (sessionLinks ?? []).find(
      (l) => l.creator_id === c.id && l.session_status === "authenticated" && !!l.browserbase_context_id
    );
    const perms = permissionsData?.find((p) => p.creator_id === c.id);
    if (link) {
      readyCreators.push({ creator: c, link, perms });
    } else {
      const pendingLink = (sessionLinks ?? []).find((l) => l.creator_id === c.id);
      const reason = pendingLink?.session_status === "authenticating"
        ? "Admin is logging in..."
        : "Awaiting admin authentication";
      notReadyCreators.push({ creator: c, reason });
    }
  });

  const handleLaunch = async (creatorId: string, sessionLinkId: string, creatorName: string) => {
    let resolvedChatterId = chatterId;
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

    setLaunchingCreatorId(creatorId);
    const result = await launchChatterSession(sessionLinkId, resolvedChatterId);
    setLaunchingCreatorId(null);

    if (result) {
      const perms = permissionsData?.find((p) => p.creator_id === creatorId);
      setActiveSession({
        embedUrl: result.embedUrl,
        sessionId: result.sessionId,
        platform: result.platform,
        creatorName,
        creatorId,
        viewerCount: result.viewerCount ?? 1,
        sessionLinkId,
        browserbaseSessionId: result.sessionId,
        permissions: perms ? {
          can_view_chats: perms.can_view_chats ?? false,
          can_send_messages: perms.can_send_messages ?? false,
          can_send_mass_messages: perms.can_send_mass_messages ?? false,
          can_view_fans: perms.can_view_fans ?? false,
          can_view_posts: perms.can_view_posts ?? false,
          can_create_posts: perms.can_create_posts ?? false,
          can_view_vault: perms.can_view_vault ?? false,
          can_view_earnings: perms.can_view_earnings ?? false,
          can_view_notifications: perms.can_view_notifications ?? false,
        } : undefined,
      });
    }
  };

  const handleClose = async () => {
    if (activeSession) {
      await terminateSession(activeSession.sessionId, chatterId);
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
        permissions={activeSession.permissions}
        creatorId={activeSession.creatorId}
        viewerCount={activeSession.viewerCount}
        sessionId={activeSession.sessionId}
        sessionLinkId={activeSession.sessionLinkId}
        browserbaseSessionId={activeSession.browserbaseSessionId}
        chatterId={chatterId}
      />
    );
  }

  if (creatorsLoading || linksLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (readyCreators.length === 0 && notReadyCreators.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Creators Assigned</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            You haven't been assigned to any creators yet. Contact your manager to get access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {readyCreators.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Ready to Launch ({readyCreators.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {readyCreators.map(({ creator, link }) => {
              const isLaunching = launchingCreatorId === creator.id && launching;
              const activeViewerSession = getActiveViewers(link.id);
              const hasActiveViewers = !!activeViewerSession && (activeViewerSession.viewer_count ?? 0) > 0;
              const viewerCount = activeViewerSession?.viewer_count ?? 0;

              return (
                <Card
                  key={creator.id}
                  className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group"
                  onClick={() => !isLaunching && handleLaunch(creator.id, link.id, creator.name)}
                >
                  <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                    <UserAvatar name={creator.name} className="h-14 w-14" />
                    <div>
                      <span className="font-semibold text-sm block">{creator.name}</span>
                      <Badge variant="outline" className="text-xs capitalize mt-1">
                        {link.platform}
                      </Badge>
                    </div>
                    {hasActiveViewers && (
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                        <Users className="h-3 w-3 mr-1" />
                        {viewerCount} active
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      disabled={isLaunching}
                      className="w-full mt-auto gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunch(creator.id, link.id, creator.name);
                      }}
                    >
                      {isLaunching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : hasActiveViewers ? (
                        <>
                          <Users className="h-4 w-4" />
                          Join Session ({viewerCount} active)
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4" />
                          Launch Session
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {notReadyCreators.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Awaiting Setup ({notReadyCreators.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notReadyCreators.map(({ creator, reason }) => (
              <Card key={creator.id} className="opacity-60">
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <UserAvatar name={creator.name} className="h-14 w-14" />
                  <div>
                    <span className="font-semibold text-sm block">{creator.name}</span>
                    <span className="text-xs text-muted-foreground mt-1 block">{reason}</span>
                  </div>
                  <Button size="sm" variant="outline" disabled className="w-full mt-auto">
                    Not Available
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
