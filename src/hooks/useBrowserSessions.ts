import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { toast } from "sonner";
import { invokeBrowserAction as invokeAction } from "@/lib/browserbase";

export interface SessionLink {
  id: string;
  creator_id: string;
  agency_id: string;
  platform: string;
  session_status: string | null;
  browserbase_context_id: string | null;
  browserbase_session_id: string | null;
  browserbase_live_url: string | null;
  is_active: boolean;
  expires_at: string;
  last_saved_at: string | null;
  created_at: string;
  updated_at: string;
  creator?: { id: string; name: string; alias: string | null; avatar_url: string | null };
}

export interface ActiveSession {
  id: string;
  session_link_id: string | null;
  chatter_id: string | null;
  agency_id: string;
  browserbase_session_id: string;
  browserbase_live_url: string | null;
  embed_url: string;
  session_type: string | null;
  is_active: boolean | null;
  started_at: string | null;
  ended_at: string | null;
  viewer_count: number;
  viewer_ids: string[];
}

export function useBrowserSessions() {
  const { agency } = useAgency();
  const queryClient = useQueryClient();
  const [launching, setLaunching] = useState(false);

  const agencyId = agency?.id;

  const { data: sessionLinks, isLoading: linksLoading } = useQuery({
    queryKey: ["browser-session-links", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_session_links")
        .select("*, creator:creators(id, name, alias, avatar_url)")
        .eq("agency_id", agencyId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SessionLink[];
    },
    enabled: !!agencyId,
  });

  const { data: activeSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["browser-active-sessions", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("active_browser_sessions")
        .select("*")
        .eq("agency_id", agencyId!)
        .eq("is_active", true)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActiveSession[];
    },
    enabled: !!agencyId,
    refetchInterval: 15000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["browser-session-links", agencyId] });
    queryClient.invalidateQueries({ queryKey: ["browser-active-sessions", agencyId] });
  };

  const createAdminSession = async (creatorId: string, platform: string) => {
    if (!agencyId) return null;
    setLaunching(true);
    try {
      const result = await invokeAction("create_admin_session", { creatorId, platform, agencyId });
      invalidate();
      return result as { embedUrl: string; sessionId: string; sessionLinkId: string; contextId: string };
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      if (msg.includes("BILLING:")) {
        toast.error(msg.replace("BILLING: ", ""), { duration: 8000 });
      } else {
        toast.error("Failed to create session: " + msg);
      }
      return null;
    } finally {
      setLaunching(false);
    }
  };

  const saveAndClose = async (sessionLinkId: string, browserbaseSessionId: string) => {
    try {
      await invokeAction("save_and_close", { sessionLinkId, browserbaseSessionId });
      toast.success("Login saved successfully. Chatters can now use this account.");
      invalidate();
    } catch (err: any) {
      toast.error("Failed to save session: " + (err.message || "Unknown error"));
    }
  };

  const launchChatterSession = async (sessionLinkId: string, chatterId: string) => {
    setLaunching(true);
    try {
      const result = await invokeAction("launch_chatter_session", { sessionLinkId, chatterId });
      invalidate();
      return result as { embedUrl: string; sessionId: string; platform: string; joined?: boolean; viewerCount?: number };
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      if (msg.includes("Session in use by")) {
        toast.error(msg, { duration: 5000 });
      } else {
        toast.error("Failed to launch session: " + msg);
      }
      return null;
    } finally {
      setLaunching(false);
    }
  };

  const terminateSession = async (browserbaseSessionId: string, chatterId?: string) => {
    try {
      await invokeAction("terminate_session", { browserbaseSessionId, chatterId });
      toast.success("Session closed");
      invalidate();
    } catch (err: any) {
      toast.error("Failed to terminate session: " + (err.message || "Unknown error"));
    }
  };

  const recoverStuckSessions = async () => {
    if (!agencyId) return;
    try {
      await invokeAction("check_and_recover_sessions", { agencyId });
      invalidate();
    } catch (err) {
      console.warn("Session recovery failed:", err);
    }
  };

  /** Get active session for a specific session link (for pooling UI) */
  const getActiveSessionForLink = (sessionLinkId: string): ActiveSession | undefined => {
    return (activeSessions ?? []).find(
      (s) => s.session_link_id === sessionLinkId && s.is_active && s.session_type === "chatter"
    );
  };

  return {
    sessionLinks: sessionLinks ?? [],
    activeSessions: activeSessions ?? [],
    linksLoading,
    sessionsLoading,
    launching,
    createAdminSession,
    saveAndClose,
    launchChatterSession,
    terminateSession,
    invalidate,
    recoverStuckSessions,
    getActiveSessionForLink,
  };
}
