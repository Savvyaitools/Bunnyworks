import { useActiveBrowserSession } from "@/contexts/ActiveBrowserSessionContext";
import { useBrowserSessions } from "@/hooks/useBrowserSessions";
import { EmbeddedBrowserViewer } from "./EmbeddedBrowserViewer";
import { Button } from "@/components/ui/button";
import { Monitor, X } from "lucide-react";
import { useState } from "react";

export function ActiveSessionBanner() {
  const { activeSession, minimized, setMinimized, clearSession } = useActiveBrowserSession();
  const { saveAndClose, invalidate } = useBrowserSessions();
  const [saving, setSaving] = useState(false);

  if (!activeSession) return null;

  const handleMinimize = () => {
    setMinimized(true);
  };

  const handleSaveAndClose = async () => {
    setSaving(true);
    await saveAndClose(activeSession.sessionLinkId, activeSession.sessionId);
    clearSession();
    setSaving(false);
  };

  const handleEnd = () => {
    const session = activeSession;
    clearSession();
    saveAndClose(session.sessionLinkId, session.sessionId).catch(() => {
      invalidate();
    });
  };

  // Show full-screen viewer overlay when not minimized (returned to session)
  if (!minimized) {
    return (
      <EmbeddedBrowserViewer
        embedUrl={activeSession.embedUrl}
        title={`Login — ${activeSession.creatorName || "Creator"}`}
        platform={activeSession.platform}
        onClose={handleMinimize}
        onSaveAndClose={handleSaveAndClose}
        showSaveButton
        saving={saving}
        creatorId={activeSession.creatorId}
      />
    );
  }

  // Minimized: show floating banner
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground rounded-lg shadow-lg px-4 py-2.5 animate-in slide-in-from-bottom-4">
      <Monitor className="h-4 w-4 shrink-0 animate-pulse" />
      <span className="text-sm font-medium truncate max-w-[200px]">
        Session: {activeSession.creatorName || "Creator"}
      </span>
      <Button size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={() => setMinimized(false)}>
        Return
      </Button>
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-primary-foreground/20" onClick={handleEnd}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
