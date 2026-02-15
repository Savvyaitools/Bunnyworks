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
import { Globe, Loader2, MessageSquare, Users, Eye, DollarSign, Image } from "lucide-react";

interface ChatterSessionLauncherProps {
  chatterId?: string;
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

export function ChatterSessionLauncher({ chatterId }: ChatterSessionLauncherProps) {
  const { launchChatterSession, terminateSession, launching } = useBrowserSessions();
  const [activeSession, setActiveSession] = useState<{
    embedUrl: string;
    sessionId: string;
    platform: string;
    creatorName: string;
    permissions?: BrowserPermissions;
  } | null>(null);

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

  // Get creator IDs from employee_of_permissions (with full permission data)
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

  const permittedCreatorIds = permissionsData?.map((p) => p.creator_id) ?? [];

  // Also check creator_assignments for chatters who might not have employee_of_permissions
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

  // Merge both sources of creator IDs
  const allCreatorIds = [...new Set([...permittedCreatorIds, ...(assignedCreatorIds ?? [])])];

  // Get authenticated session links for permitted/assigned creators
  const { data: sessionLinks, isLoading } = useQuery({
    queryKey: ["chatter-available-sessions", allCreatorIds],
    queryFn: async () => {
      if (allCreatorIds.length === 0) return [];
      const { data, error } = await supabase
        .from("creator_session_links")
        .select("id, platform, session_status, is_active, browserbase_context_id, creator:creators(id, name, alias, avatar_url)")
        .in("creator_id", allCreatorIds)
        .eq("is_active", true)
        .eq("session_status", "authenticated");
      if (error) return [];
      return data ?? [];
    },
    enabled: allCreatorIds.length > 0,
  });

  const readySessions = sessionLinks?.filter(
    (s) => s.browserbase_context_id
  ) ?? [];

  const getPermissionsForCreator = (creatorId: string) => {
    return permissionsData?.find((p) => p.creator_id === creatorId);
  };

  const handleLaunch = async (session: (typeof readySessions)[0]) => {
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

    const result = await launchChatterSession(session.id, resolvedChatterId);
    if (result) {
      const creator = session.creator as { id?: string; name?: string } | null;
      const creatorId = creator?.id || "";
      const perms = getPermissionsForCreator(creatorId);
      
      setActiveSession({
        embedUrl: result.embedUrl,
        sessionId: result.sessionId,
        platform: result.platform,
        creatorName: creator?.name || "Creator",
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
      />
    );
  }

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  if (readySessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Sessions Available Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Your manager needs to set up browser sessions for your assigned creators first.
            Once they authenticate a creator account, you'll see it here ready to launch.
          </p>
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>✓ You are assigned to {allCreatorIds.length} creator{allCreatorIds.length !== 1 ? "s" : ""}</p>
            <p>✗ No authenticated browser sessions found</p>
          </div>
        </CardContent>
      </Card>
    );
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
          const creator = session.creator as { id?: string; name?: string; alias?: string | null } | null;
          const perms = getPermissionsForCreator(creator?.id || "");
          const access = getAccessLabel(perms);
          
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
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <Badge variant="outline" className="text-xs capitalize">
                      {session.platform}
                    </Badge>
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
                      Ready
                    </Badge>
                    <Badge variant={access.variant} className="text-xs">
                      {access.label}
                    </Badge>
                  </div>
                  {/* Permission icons */}
                  {perms && (
                    <div className="flex items-center gap-1 mt-1">
                      {(perms.can_view_chats || perms.can_send_messages) && (
                        <span className="text-muted-foreground" aria-label="Chats"><MessageSquare className="h-3 w-3" /></span>
                      )}
                      {perms.can_view_fans && (
                        <span className="text-muted-foreground" aria-label="Fans"><Users className="h-3 w-3" /></span>
                      )}
                      {(perms.can_view_posts || perms.can_create_posts) && (
                        <span className="text-muted-foreground" aria-label="Posts"><Image className="h-3 w-3" /></span>
                      )}
                      {perms.can_view_earnings && (
                        <span className="text-muted-foreground" aria-label="Earnings"><DollarSign className="h-3 w-3" /></span>
                      )}
                      {perms.can_view_vault && (
                        <span className="text-muted-foreground" aria-label="Vault"><Eye className="h-3 w-3" /></span>
                      )}
                    </div>
                  )}
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
