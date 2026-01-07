import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SessionAction = 
  | "create_admin_session" 
  | "save_profile" 
  | "launch_chatter_session" 
  | "terminate_session" 
  | "get_session_status";

interface SessionState {
  isLoading: boolean;
  isConnected: boolean;
  embedUrl: string | null;
  sessionId: string | null;
  contextId: string | null;
  error: string | null;
}

interface CreateAdminSessionParams {
  sessionLinkId: string;
  platform: string;
}

interface LaunchChatterSessionParams {
  sessionLinkId: string;
  chatterId: string;
}

interface SaveProfileParams {
  sessionLinkId: string;
}

interface TerminateSessionParams {
  sessionLinkId: string;
}

interface GetSessionStatusParams {
  sessionLinkId: string;
}

export function useBrowserbaseSession() {
  const [state, setState] = useState<SessionState>({
    isLoading: false,
    isConnected: false,
    embedUrl: null,
    sessionId: null,
    contextId: null,
    error: null,
  });

  const invokeEdgeFunction = useCallback(async (action: SessionAction, params: Record<string, string>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke("browserbase-session", {
        body: { action, ...params },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Unknown error");

      return data;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to invoke session action";
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      throw err;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const createAdminSession = useCallback(async ({ sessionLinkId, platform }: CreateAdminSessionParams) => {
    const data = await invokeEdgeFunction("create_admin_session", {
      session_link_id: sessionLinkId,
      platform,
    });

    setState(prev => ({
      ...prev,
      embedUrl: data.embedUrl,
      sessionId: data.sessionId,
      contextId: data.contextId,
      isConnected: true,
    }));

    toast.success("Browser session started. Please log in to the platform.");
    return data;
  }, [invokeEdgeFunction]);

  const launchChatterSession = useCallback(async ({ sessionLinkId, chatterId }: LaunchChatterSessionParams) => {
    const data = await invokeEdgeFunction("launch_chatter_session", {
      session_link_id: sessionLinkId,
      chatter_id: chatterId,
    });

    setState(prev => ({
      ...prev,
      embedUrl: data.embedUrl,
      sessionId: data.sessionId,
      isConnected: true,
    }));

    toast.success("Session launched successfully");
    return data;
  }, [invokeEdgeFunction]);

  const saveProfile = useCallback(async ({ sessionLinkId }: SaveProfileParams) => {
    const data = await invokeEdgeFunction("save_profile", {
      session_link_id: sessionLinkId,
    });

    setState(prev => ({
      ...prev,
      embedUrl: null,
      sessionId: null,
      isConnected: false,
    }));

    toast.success("Session profile saved successfully");
    return data;
  }, [invokeEdgeFunction]);

  const terminateSession = useCallback(async ({ sessionLinkId }: TerminateSessionParams) => {
    const data = await invokeEdgeFunction("terminate_session", {
      session_link_id: sessionLinkId,
    });

    setState({
      isLoading: false,
      isConnected: false,
      embedUrl: null,
      sessionId: null,
      contextId: null,
      error: null,
    });

    toast.success("Session terminated");
    return data;
  }, [invokeEdgeFunction]);

  const getSessionStatus = useCallback(async ({ sessionLinkId }: GetSessionStatusParams) => {
    return await invokeEdgeFunction("get_session_status", {
      session_link_id: sessionLinkId,
    });
  }, [invokeEdgeFunction]);

  const disconnect = useCallback(() => {
    setState({
      isLoading: false,
      isConnected: false,
      embedUrl: null,
      sessionId: null,
      contextId: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    createAdminSession,
    launchChatterSession,
    saveProfile,
    terminateSession,
    getSessionStatus,
    disconnect,
  };
}
