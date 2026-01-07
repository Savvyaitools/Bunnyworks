import { useState, useEffect } from "react";
import { Globe, Play, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmbeddedBrowser } from "./EmbeddedBrowser";
import { useHyperbeamSession } from "@/hooks/useHyperbeamSession";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SessionLinkAssignment {
  id: string;
  session_link_id: string;
  creator_session_links: {
    id: string;
    platform: string;
    session_status: string | null;
    creators: {
      id: string;
      name: string;
      alias: string | null;
    } | null;
  } | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  onlyfans: "OnlyFans",
  fansly: "Fansly",
  instagram: "Instagram",
  twitter: "Twitter/X",
};

interface ChatterSessionLauncherProps {
  chatterId: string;
  className?: string;
}

export function ChatterSessionLauncher({ chatterId, className }: ChatterSessionLauncherProps) {
  const hyperbeam = useHyperbeamSession();
  const [assignments, setAssignments] = useState<SessionLinkAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSessionLinkId, setActiveSessionLinkId] = useState<string | null>(null);
  const [launchingSession, setLaunchingSession] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("session_link_assignments")
          .select(`
            id,
            session_link_id,
            creator_session_links (
              id,
              platform,
              session_status,
              creators (
                id,
                name,
                alias
              )
            )
          `)
          .eq("chatter_id", chatterId);

        if (error) throw error;
        setAssignments(data || []);
      } catch (err) {
        console.error("Failed to fetch session assignments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [chatterId]);

  const handleLaunchSession = async (sessionLinkId: string) => {
    setLaunchingSession(true);
    setActiveSessionLinkId(sessionLinkId);

    try {
      await hyperbeam.launchChatterSession({
        sessionLinkId,
        chatterId,
      });
    } catch (err) {
      console.error("Failed to launch session:", err);
      setActiveSessionLinkId(null);
    } finally {
      setLaunchingSession(false);
    }
  };

  const handleDisconnect = () => {
    hyperbeam.disconnect();
    setActiveSessionLinkId(null);
  };

  const readySessions = assignments.filter(
    a => a.creator_session_links?.session_status === "ready"
  );

  if (loading) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Session Selection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Available Sessions
          </CardTitle>
          <CardDescription>
            Launch a browser session to start chatting
          </CardDescription>
        </CardHeader>
        <CardContent>
          {readySessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No sessions assigned</p>
              <p className="text-xs text-muted-foreground mt-1">
                Contact your manager to get access to creator sessions
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {readySessions.map(assignment => {
                const link = assignment.creator_session_links;
                if (!link) return null;

                const creator = link.creators;
                const isActive = activeSessionLinkId === link.id;

                return (
                  <div
                    key={assignment.id}
                    className={cn(
                      "p-4 rounded-lg border border-border bg-muted/30 transition-all",
                      isActive && "ring-2 ring-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {creator?.name || "Unknown Creator"}
                          </span>
                          {creator?.alias && (
                            <span className="text-sm text-muted-foreground">
                              ({creator.alias})
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {PLATFORM_LABELS[link.platform] || link.platform}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => isActive ? handleDisconnect() : handleLaunchSession(link.id)}
                        disabled={launchingSession || hyperbeam.isLoading}
                        variant={isActive ? "destructive" : "default"}
                        className="gap-2"
                      >
                        {launchingSession && activeSessionLinkId === link.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isActive ? (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            Disconnect
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Launch
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Embedded Browser */}
      {hyperbeam.embedUrl && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Active Session</CardTitle>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Connected</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EmbeddedBrowser
              embedUrl={hyperbeam.embedUrl}
              onReady={(hb) => hyperbeam.setHyperbeamInstance(hb)}
              onDisconnect={handleDisconnect}
              className="h-[600px]"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
