import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface ActiveBrowserSession {
  embedUrl: string;
  sessionId: string;
  sessionLinkId: string;
  creatorId: string;
  creatorName?: string;
  platform: string;
}

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

export function ActiveBrowserSessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveBrowserSession | null>(null);
  const [minimized, setMinimized] = useState(false);

  const clearSession = useCallback(() => {
    setActiveSession(null);
    setMinimized(false);
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
