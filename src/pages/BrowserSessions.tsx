import { useState } from "react";
import { Globe, Plus, Play, Save, StopCircle, Trash2, Users, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmbeddedBrowser, SessionAssignmentPanel } from "@/components/browser";
import { useCreators } from "@/hooks/useCreators";
import { useCreatorSessionLinks } from "@/hooks/useCreatorSessionLinks";
import { useHyperbeamSession } from "@/hooks/useHyperbeamSession";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { value: "onlyfans", label: "OnlyFans", url: "https://onlyfans.com" },
  { value: "fansly", label: "Fansly", url: "https://fansly.com" },
  { value: "instagram", label: "Instagram", url: "https://instagram.com" },
  { value: "twitter", label: "Twitter/X", url: "https://x.com" },
];

export default function BrowserSessions() {
  const { creators, loading: loadingCreators } = useCreators();
  const { sessionLinks, loading: loadingLinks, createSessionLink, deleteSessionLink, refetch } = useCreatorSessionLinks();
  const hyperbeam = useHyperbeamSession();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [activeSessionLinkId, setActiveSessionLinkId] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);

  const activeCreators = creators.filter(c => c.status === "Active");

  const handleCreateSessionLink = async () => {
    if (!selectedCreatorId || !selectedPlatform) return;

    try {
      await createSessionLink({
        creator_id: selectedCreatorId,
        platform: selectedPlatform,
        notes: notes || null,
      });
      setCreateDialogOpen(false);
      setSelectedCreatorId("");
      setSelectedPlatform("");
      setNotes("");
    } catch (err) {
      console.error("Failed to create session link:", err);
    }
  };

  const handleStartAdminSession = async (sessionLinkId: string, platform: string) => {
    setCreatingSession(true);
    setActiveSessionLinkId(sessionLinkId);

    try {
      await hyperbeam.createAdminSession({
        sessionLinkId,
        platform,
      });
    } catch (err) {
      console.error("Failed to start session:", err);
      setActiveSessionLinkId(null);
    } finally {
      setCreatingSession(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!activeSessionLinkId) return;

    try {
      await hyperbeam.saveProfile({ sessionLinkId: activeSessionLinkId });
      refetch();
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  const handleTerminateSession = async () => {
    if (!activeSessionLinkId) return;

    try {
      await hyperbeam.terminateSession({ sessionLinkId: activeSessionLinkId });
      setActiveSessionLinkId(null);
      refetch();
    } catch (err) {
      console.error("Failed to terminate session:", err);
    }
  };

  const handleDeleteSessionLink = async (id: string) => {
    if (activeSessionLinkId === id) {
      await hyperbeam.terminateSession({ sessionLinkId: id });
      setActiveSessionLinkId(null);
    }
    await deleteSessionLink(id);
  };

  const getStatusBadge = (link: typeof sessionLinks[0]) => {
    if (link.session_status === "ready" && link.hyperbeam_profile_id) {
      return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Ready</Badge>;
    }
    if (link.session_status === "active") {
      return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Active</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground">Pending Setup</Badge>;
  };

  const getCreatorName = (creatorId: string) => {
    return creators.find(c => c.id === creatorId)?.name || "Unknown Creator";
  };

  const isLoading = loadingCreators || loadingLinks;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Browser Sessions</h1>
            <p className="text-muted-foreground mt-1">Manage cloud browser sessions for your creators</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Browser Session</DialogTitle>
                <DialogDescription>
                  Set up a new cloud browser session for a creator platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Creator</Label>
                  <Select value={selectedCreatorId} onValueChange={setSelectedCreatorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a creator" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCreators.map(creator => (
                        <SelectItem key={creator.id} value={creator.id}>
                          {creator.name} {creator.alias && `(${creator.alias})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map(platform => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this session..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSessionLink}
                  disabled={!selectedCreatorId || !selectedPlatform}
                >
                  Create Session
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Links List */}
          <Card className="glass-card animate-fade-in" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Session Links
              </CardTitle>
              <CardDescription>
                Manage browser sessions for your creators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sessionLinks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Globe className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No session links yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create one to get started</p>
                </div>
              ) : (
                sessionLinks.map(link => (
                  <div 
                    key={link.id}
                    className={cn(
                      "p-4 rounded-lg border border-border bg-muted/30 transition-all",
                      activeSessionLinkId === link.id && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground truncate">
                            {getCreatorName(link.creator_id)}
                          </span>
                          {getStatusBadge(link)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {PLATFORMS.find(p => p.value === link.platform)?.label || link.platform}
                          </Badge>
                          {link.last_saved_at && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              Saved
                            </span>
                          )}
                        </div>
                        {link.notes && (
                          <p className="text-xs text-muted-foreground mt-2 truncate">{link.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {link.session_status === "ready" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartAdminSession(link.id, link.platform)}
                            disabled={hyperbeam.isLoading || creatingSession}
                            title="Launch Session"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-500"
                            onClick={() => handleStartAdminSession(link.id, link.platform)}
                            disabled={hyperbeam.isLoading || creatingSession}
                            title="Setup Session"
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteSessionLink(link.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Embedded Browser */}
          <Card className="glass-card animate-fade-in" style={{ animationDelay: "200ms" }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Cloud Browser
                  </CardTitle>
                  <CardDescription>
                    {hyperbeam.isConnected 
                      ? "Log in to the platform, then save the profile"
                      : "Select a session to start"
                    }
                  </CardDescription>
                </div>
                {hyperbeam.isConnected && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={hyperbeam.isLoading}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Profile
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleTerminateSession}
                      disabled={hyperbeam.isLoading}
                      className="gap-2"
                    >
                      <StopCircle className="h-4 w-4" />
                      End Session
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {hyperbeam.embedUrl ? (
                <EmbeddedBrowser
                  embedUrl={hyperbeam.embedUrl}
                  onReady={(hb) => hyperbeam.setHyperbeamInstance(hb)}
                  onDisconnect={() => hyperbeam.disconnect()}
                  className="h-[500px]"
                />
              ) : (
                <div className="h-[500px] rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center">
                  {creatingSession || hyperbeam.isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Starting browser session...</p>
                    </div>
                  ) : (
                    <>
                      <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <p className="text-sm text-muted-foreground">No active session</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click the play button on a session link to start
                      </p>
                    </>
                  )}
                </div>
              )}
              {hyperbeam.error && (
                <p className="text-xs text-destructive mt-2">{hyperbeam.error}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session Assignments */}
        <SessionAssignmentPanel 
          sessionLinks={sessionLinks} 
          getCreatorName={getCreatorName} 
        />
      </div>
    </DashboardLayout>
  );
}
