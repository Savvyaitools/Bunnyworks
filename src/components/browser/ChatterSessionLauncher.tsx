import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrowserSessions } from "@/hooks/useBrowserSessions";
import { EmbeddedBrowserViewer, type BrowserPermissions } from "./EmbeddedBrowserViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  Globe, Loader2, MessageSquare, Users, Eye, DollarSign, Image,
  AlertCircle, Clock, CheckCircle2, Wifi, WifiOff,
} from "lucide-react";

interface ChatterSessionLauncherProps {
  chatterId?: string;
}

interface CreatorSessionInfo {
  creatorId: string;
  creatorName: string;
  creatorAlias?: string | null;
  creatorAvatar?: string | null;
  sessionLinkId?: string;
  platform?: string;
  sessionStatus?: string | null;
  hasContext?: boolean;
  permissions?: any;
}

function getAccessLabel(perms: any): { label: string; variant: "default" | "secondary" | "outline" } {
  const flags = [
    perms?.can_view_chats, perms?.can_send_messages, perms?.can_view_fans,
    perms?.can_view_posts, perms?.can_create_posts, perms?.can_view_vault,
    perms?.can_view_earnings,
  ];
  const trueCount = flags.filter(Boolean).length;
  if (trueCount >= 6) return { label: "Full Access", variant: "default" };
  if (trueCount >= 3) return { label: "Limited Access", variant: "secondary" };
  if (trueCount >= 1) return { label: "Chat Only", variant: "outline" };
  return { label: "View Only", variant: "outline" };
}

function SessionStatusBadge({ status }: { status?: string | null }) {
  if (status === "authenticated") {
    return (
      <Badge className="bg-primary/15 text-primary border-primary/30 text-xs gap-1">
        <CheckCircle2 className="h-3 w-3" /> Ready
      </Badge>
    );
  }
  if (status === "authenticating") {
    return (
      <Badge variant="outline" className="text-xs gap-1 text-amber-500 border-amber-500/30">
        <Clock className="h-3 w-3" /> Authenticating
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
      <WifiOff className="h-3 w-3" /> Not Set Up
    </Badge>
  );
}

export function ChatterSessionLauncher({ chatterId }: ChatterSessionLauncherProps) {
  const { launchChatterSession, terminateSession, launching } = useBrowserSessions();
  const [activeSession, setActiveSession] = useState<{
    embedUrl: string;
    sessionId: string;
    platform: string;
    creatorName: string;
    creatorId?: string;
    permissions?: BrowserPermissions;
  } | null>(null);
  const [launchingCreatorId, setLaunchingCreatorId] = useState<string | null>(null);

  // Get employee_id for current user
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

  // Get permissions data
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

  // Also check creator_assignments
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

  // Get ALL creators the chatter is assigned to (not just those with sessions)
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

  // Get ALL session links for assigned creators (any status)
  const { data: sessionLinks, isLoading: linksLoading } = useQuery({
    queryKey: ["chatter-session-links-all", allCreatorIds],
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
    refetchInterval: 15000, // Poll for status changes
  });

  // Build combined creator-session info
  const creatorSessions: CreatorSessionInfo[] = (creators ?? []).map((c) => {
    const link = (sessionLinks ?? []).find((l) => l.creator_id === c.id);
    const perms = permissionsData?.find((p) => p.creator_id === c.id);
    return {
      creatorId: c.id,
      creatorName: c.name,
      creatorAlias: c.alias,
      creatorAvatar: c.avatar_url,
      sessionLinkId: link?.id,
      platform: link?.platform,
      sessionStatus: link?.session_status,
      hasContext: !!link?.browserbase_context_id,
      permissions: perms,
    };
  });

  // Sort: authenticated first, then authenticating, then no session
  const sorted = [...creatorSessions].sort((a, b) => {
    const order = (s?: string | null) => s === "authenticated" ? 0 : s === "authenticating" ? 1 : 2;
    return order(a.sessionStatus) - order(b.sessionStatus);
  });

  const isLoading = creatorsLoading || linksLoading;

  const getPermissionsForCreator = (creatorId: string) => {
    return permissionsData?.find((p) => p.creator_id === creatorId);
  };

  const handleLaunch = async (info: CreatorSessionInfo) => {
    if (!info.sessionLinkId) return;

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

    setLaunchingCreatorId(info.creatorId);
    const result = await launchChatterSession(info.sessionLinkId, resolvedChatterId);
    setLaunchingCreatorId(null);

    if (result) {
      const perms = getPermissionsForCreator(info.creatorId);
      setActiveSession({
        embedUrl: result.embedUrl,
        sessionId: result.sessionId,
        platform: result.platform,
        creatorName: info.creatorName,
        creatorId: info.creatorId,
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
        permissions={activeSession.permissions}
        creatorId={activeSession.creatorId}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (sorted.length === 0) {
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

  const readyCount = sorted.filter(s => s.sessionStatus === "authenticated").length;
  const pendingCount = sorted.filter(s => s.sessionStatus === "authenticating").length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Wifi className="h-4 w-4 text-primary" />
          <span className="font-medium">{readyCount} ready</span>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 text-amber-500">
            <Clock className="h-4 w-4" />
            <span>{pendingCount} pending</span>
          </div>
        )}
        <span className="text-muted-foreground">
          {sorted.length} creator{sorted.length !== 1 ? "s" : ""} assigned
        </span>
      </div>

      {/* Creator cards */}
      <div className="grid gap-3">
        {sorted.map((info) => {
          const access = info.permissions ? getAccessLabel(info.permissions) : null;
          const canLaunch = info.sessionStatus === "authenticated" && !!info.sessionLinkId;
          const isLaunching = launchingCreatorId === info.creatorId && launching;

          return (
            <Card
              key={info.creatorId}
              className={canLaunch ? "border-primary/20 bg-primary/[0.02]" : "opacity-80"}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={info.creatorName} className="h-10 w-10" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">
                          {info.creatorName}
                        </span>
                        {info.platform && (
                          <Badge variant="outline" className="text-xs capitalize shrink-0">
                            {info.platform}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <SessionStatusBadge status={info.sessionStatus || (info.sessionLinkId ? undefined : null)} />
                        {access && (
                          <Badge variant={access.variant} className="text-xs">
                            {access.label}
                          </Badge>
                        )}
                      </div>

                      {/* Permission icons */}
                      {info.permissions && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {(info.permissions.can_view_chats || info.permissions.can_send_messages) && (
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                          )}
                          {info.permissions.can_view_fans && (
                            <Users className="h-3 w-3 text-muted-foreground" />
                          )}
                          {(info.permissions.can_view_posts || info.permissions.can_create_posts) && (
                            <Image className="h-3 w-3 text-muted-foreground" />
                          )}
                          {info.permissions.can_view_earnings && (
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                          )}
                          {info.permissions.can_view_vault && (
                            <Eye className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {canLaunch ? (
                      <Button
                        onClick={() => handleLaunch(info)}
                        disabled={isLaunching}
                        size="sm"
                        className="min-w-[80px]"
                      >
                        {isLaunching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Globe className="h-3.5 w-3.5 mr-1.5" />
                            Launch
                          </>
                        )}
                      </Button>
                    ) : info.sessionStatus === "authenticating" ? (
                      <div className="text-xs text-amber-500 text-right max-w-[120px]">
                        <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                        Admin is setting up
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground text-right max-w-[120px]">
                        <WifiOff className="h-3.5 w-3.5 inline mr-1" />
                        No session yet
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
