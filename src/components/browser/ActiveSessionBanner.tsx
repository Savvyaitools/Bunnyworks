import { useActiveBrowserSession } from "@/contexts/ActiveBrowserSessionContext";
import { useBrowserSessions } from "@/hooks/useBrowserSessions";
import { EmbeddedBrowserViewer } from "./EmbeddedBrowserViewer";
import { Button } from "@/components/ui/button";
import { Monitor, X, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ActiveSessionBanner() {
  const { activeSession, minimized, setMinimized, clearSession } = useActiveBrowserSession();
  const { saveAndClose, invalidate } = useBrowserSessions();
  const [saving, setSaving] = useState(false);
  const [sessionDead, setSessionDead] = useState(false);
  const checkInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Periodically check if the Browserbase session is still alive
  useEffect(() => {
    if (!activeSession?.sessionId) {
      setSessionDead(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const { data } = await supabase.functions.invoke("browserbase-session", {
          body: { action: "get_session_status", browserbaseSessionId: activeSession.sessionId },
        });
        if (data && !data.active) {
          setSessionDead(true);
          // Auto-save when session dies (timeout/completed)
          if (activeSession.sessionLinkId) {
            await saveAndClose(activeSession.sessionLinkId, activeSession.sessionId);
          }
          if (checkInterval.current) clearInterval(checkInterval.current);
          toast.warning("Browser session expired. Login has been saved automatically.");
        }
      } catch {
        // ignore check errors
      }
    };

    // Check every 30 seconds
    checkInterval.current = setInterval(checkStatus, 30000);
    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [activeSession?.sessionId]);

  if (!activeSession) return null;

  const handleMinimize = () => {
    setMinimized(true);
  };

  const handleSaveAndClose = async () => {
    setSaving(true);
    await saveAndClose(activeSession.sessionLinkId, activeSession.sessionId);
    clearSession();
    setSaving(false);
    setSessionDead(false);
  };

  const handleEnd = () => {
    const session = activeSession;
    clearSession();
    setSessionDead(false);
    saveAndClose(session.sessionLinkId, session.sessionId).catch(() => {
      invalidate();
    });
  };

  // Show full-screen viewer overlay when not minimized
  if (!minimized && !sessionDead) {
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
        sessionLinkId={activeSession.sessionLinkId}
        browserbaseSessionId={activeSession.sessionId}
      />
    );
  }

  // Session died — show warning banner
  if (sessionDead) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-destructive text-destructive-foreground rounded-lg shadow-lg px-4 py-2.5 animate-in slide-in-from-bottom-4">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Session expired — login saved</span>
        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => { clearSession(); setSessionDead(false); }}>
          Dismiss
        </Button>
      </div>
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
