import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";

export interface ActiveBrowserSession {
  embedUrl: string;
  sessionId: string;
  sessionLinkId: string;
  creatorId: string;
  creatorName?: string;
  platform: string;
}

const STORAGE_KEY = "active-browser-session";

interface ActiveBrowserSessionContextType {
  activeSession: ActiveBrowserSession | null;
  setActiveSession: (session: ActiveBrowserSession | null) => void;
  clearSession: () => void;
  minimized: boolean;
  setMinimized: (v: boolean) => void;
}

const ActiveBrowserSessionContext = createContext<ActiveBrowserSessionContextType>({
  activeSession: null,
  setActiveSession: () => {},
  clearSession: () => {},
  minimized: false,
  setMinimized: () => {},
});

function loadPersistedSession(): ActiveBrowserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ActiveBrowserSession;
  } catch {}
  return null;
}

export function ActiveBrowserSessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSessionState] = useState<ActiveBrowserSession | null>(loadPersistedSession);
  const [minimized, setMinimized] = useState(() => !!loadPersistedSession());

  const setActiveSession = useCallback((session: ActiveBrowserSession | null) => {
    setActiveSessionState(session);
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearSession = useCallback(() => {
    setActiveSessionState(null);
    setMinimized(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ActiveBrowserSessionContext.Provider value={{ activeSession, setActiveSession, clearSession, minimized, setMinimized }}>
      {children}
    </ActiveBrowserSessionContext.Provider>
  );
}

export function useActiveBrowserSession() {
  return useContext(ActiveBrowserSessionContext);
}
