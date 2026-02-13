import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreators } from "@/hooks/useCreators";
import { useBrowserSessions } from "@/hooks/useBrowserSessions";
import { EmbeddedBrowserViewer } from "./EmbeddedBrowserViewer";
import { Globe, Loader2 } from "lucide-react";

interface AdminSessionLauncherProps {
  preselectedCreatorId?: string;
}

export function AdminSessionLauncher({ preselectedCreatorId }: AdminSessionLauncherProps) {
  const { creators } = useCreators();
  const { createAdminSession, saveAndClose, terminateSession, launching } = useBrowserSessions();

  const [selectedCreator, setSelectedCreator] = useState<string>(preselectedCreatorId || "");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("onlyfans");
  const [activeSession, setActiveSession] = useState<{
    embedUrl: string;
    sessionId: string;
    sessionLinkId: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleLaunch = async () => {
    if (!selectedCreator) return;
    const result = await createAdminSession(selectedCreator, selectedPlatform);
    if (result) {
      setActiveSession({
        embedUrl: result.embedUrl,
        sessionId: result.sessionId,
        sessionLinkId: result.sessionLinkId,
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
      await terminateSession(activeSession.sessionId);
      setActiveSession(null);
    }
  };

  const selectedCreatorName = creators?.find((c) => c.id === selectedCreator)?.name;

  if (activeSession) {
    return (
      <EmbeddedBrowserViewer
        embedUrl={activeSession.embedUrl}
        title={`Admin Login — ${selectedCreatorName || "Creator"}`}
        platform={selectedPlatform}
        onClose={handleClose}
        onSaveAndClose={handleSaveAndClose}
        showSaveButton
        saving={saving}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Launch Admin Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Open a browser session to log into a creator's platform account. After logging in, save the
          session so your chatters can access it without needing credentials.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedCreator} onValueChange={setSelectedCreator}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a creator..." />
            </SelectTrigger>
            <SelectContent>
              {creators?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {c.alias ? `(${c.alias})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="onlyfans">OnlyFans</SelectItem>
              <SelectItem value="fanvue">Fanvue</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleLaunch} disabled={!selectedCreator || launching}>
            {launching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Launching...
              </>
            ) : (
              "Launch Session"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
