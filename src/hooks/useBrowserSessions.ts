import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { toast } from "sonner";

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
}

async function invokeAction(action: string, params: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("browserbase-session", {
    body: { action, ...params },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useBrowserSessions() {
  const { agency } = useAgency();
  const queryClient = useQueryClient();
  const [launching, setLaunching] = useState(false);

  const agencyId = agency?.id;

  // Fetch all session links for the agency
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

  // Fetch active sessions
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
    refetchInterval: 30000,
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
      return result as { embedUrl: string; sessionId: string; platform: string };
    } catch (err: any) {
      toast.error("Failed to launch session: " + (err.message || "Unknown error"));
      return null;
    } finally {
      setLaunching(false);
    }
  };

  const terminateSession = async (browserbaseSessionId: string) => {
    try {
      await invokeAction("terminate_session", { browserbaseSessionId });
      toast.success("Session terminated");
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
  };
}
