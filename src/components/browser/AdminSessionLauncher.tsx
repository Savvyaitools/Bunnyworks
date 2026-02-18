import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreators } from "@/hooks/useCreators";
import { useBrowserSessions } from "@/hooks/useBrowserSessions";
import { EmbeddedBrowserViewer } from "./EmbeddedBrowserViewer";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  Globe, Loader2, ShieldCheck, KeyRound, CheckCircle2,
  Clock, RotateCcw, Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AdminSessionLauncherProps {
  preselectedCreatorId?: string;
}

export function AdminSessionLauncher({ preselectedCreatorId }: AdminSessionLauncherProps) {
  const { creators } = useCreators();
  const { sessionLinks, createAdminSession, saveAndClose, terminateSession, launching, recoverStuckSessions } = useBrowserSessions();
  const recoveryRan = useRef(false);

  // Auto-recover stuck "authenticating" sessions on mount
  useEffect(() => {
    if (!recoveryRan.current && sessionLinks.length > 0) {
      const hasStuck = sessionLinks.some(
        (l) => l.session_status === "authenticating"
      );
      if (hasStuck) {
        recoveryRan.current = true;
        recoverStuckSessions();
      }
    }
  }, [sessionLinks]);

  const [selectedPlatform, setSelectedPlatform] = useState<string>("onlyfans");
  const [activeSession, setActiveSession] = useState<{
    embedUrl: string;
    sessionId: string;
    sessionLinkId: string;
    creatorId: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [launchingCreatorId, setLaunchingCreatorId] = useState<string | null>(null);

  const handleLaunch = async (creatorId: string) => {
    setLaunchingCreatorId(creatorId);
    const result = await createAdminSession(creatorId, selectedPlatform);
    setLaunchingCreatorId(null);
    if (result) {
      setActiveSession({
        embedUrl: result.embedUrl,
        sessionId: result.sessionId,
        sessionLinkId: result.sessionLinkId,
        creatorId,
      });
    }
  };

  const handleSaveAndClose = async () => {
    if (!activeSession) return;
    setSaving(true);
    await saveAndClose(activeSession.sessionLinkId, activeSession.sessionId);
    setActiveSession(null);
    setSaving(false);
  };

  const handleClose = async () => {
    if (activeSession) {
      // Auto-save the session context when closing (so it doesn't stay stuck at "authenticating")
      await saveAndClose(activeSession.sessionLinkId, activeSession.sessionId);
      setActiveSession(null);
    }
  };

  if (activeSession) {
    const creatorName = creators?.find((c) => c.id === activeSession.creatorId)?.name;
    return (
      <EmbeddedBrowserViewer
        embedUrl={activeSession.embedUrl}
        title={`Login — ${creatorName || "Creator"}`}
        platform={selectedPlatform}
        onClose={handleClose}
        onSaveAndClose={handleSaveAndClose}
        showSaveButton
        saving={saving}
        creatorId={activeSession.creatorId}
      />
    );
  }

  // Build a map of session links by creator_id + platform
  const linkMap = new Map<string, typeof sessionLinks[0]>();
  sessionLinks.forEach((l) => {
    const key = `${l.creator_id}:${l.platform}`;
    if (!linkMap.has(key) || l.session_status === "authenticated") {
      linkMap.set(key, l);
    }
  });

  const authenticatedCount = (creators ?? []).filter((c) => {
    const link = linkMap.get(`${c.id}:${selectedPlatform}`);
    return link?.session_status === "authenticated";
  }).length;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Account Authentication</CardTitle>
              <CardDescription>
                Log into each creator's platform account once. Your team can then launch sessions without needing credentials.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4">
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onlyfans">OnlyFans</SelectItem>
                <SelectItem value="fanvue">Fanvue</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>
                <span className="font-medium text-foreground">{authenticatedCount}</span> of{" "}
                {creators?.length ?? 0} creators authenticated
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creator list */}
      <div className="grid gap-3">
        {(creators ?? []).map((creator) => {
          const link = linkMap.get(`${creator.id}:${selectedPlatform}`);
          const isAuthenticated = link?.session_status === "authenticated";
          const isAuthenticating = link?.session_status === "authenticating";
          const isLaunchingThis = launchingCreatorId === creator.id && launching;

          return (
            <Card
              key={creator.id}
              className={isAuthenticated ? "border-primary/20" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={creator.name} className="h-10 w-10" />
                    <div className="min-w-0">
                      <span className="font-semibold text-sm truncate block">
                        {creator.name}
                        {creator.alias ? (
                          <span className="text-muted-foreground font-normal ml-1">
                            ({creator.alias})
                          </span>
                        ) : null}
                      </span>

                      {isAuthenticated && link?.last_saved_at ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge className="bg-primary/15 text-primary border-primary/30 text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Authenticated
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(link.last_saved_at), { addSuffix: true })}
                          </span>
                        </div>
                      ) : isAuthenticating ? (
                        <Badge variant="outline" className="text-xs gap-1 text-destructive border-destructive/30 mt-0.5">
                          <Clock className="h-3 w-3" /> Login in progress...
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground mt-0.5 block">
                          Not yet authenticated
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isAuthenticated ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLaunch(creator.id)}
                        disabled={isLaunchingThis}
                        className="gap-1.5"
                      >
                        {isLaunchingThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        Re-authenticate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleLaunch(creator.id)}
                        disabled={isLaunchingThis || isAuthenticating}
                        className="gap-1.5"
                      >
                        {isLaunchingThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        {isAuthenticating ? "In Progress..." : "Authenticate"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(creators ?? []).length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Creators Yet</h3>
              <p className="text-sm text-muted-foreground">
                Add creators to your agency first, then authenticate their platform accounts here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
