import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { toast } from "sonner";
import { invokeBrowserAction as invokeAction } from "@/lib/browserbase";

export function useSessionRecording(browserbaseSessionId: string | null) {
  return useQuery({
    queryKey: ["session-recording", browserbaseSessionId],
    queryFn: async () => {
      const result = await invokeAction("get_session_recording", { browserbaseSessionId });
      return result.recording;
    },
    enabled: !!browserbaseSessionId,
    retry: false,
  });
}

export function useSessionLogs(browserbaseSessionId: string | null) {
  return useQuery({
    queryKey: ["session-logs", browserbaseSessionId],
    queryFn: async () => {
      const result = await invokeAction("get_session_logs", { browserbaseSessionId });
      return result.logs;
    },
    enabled: !!browserbaseSessionId,
    retry: false,
  });
}

export function useSessionDownloads(browserbaseSessionId: string | null) {
  return useQuery({
    queryKey: ["session-downloads", browserbaseSessionId],
    queryFn: async () => {
      const result = await invokeAction("get_session_downloads", { browserbaseSessionId });
      return result.downloads;
    },
    enabled: !!browserbaseSessionId,
    retry: false,
  });
}

export function useBrowserSessionEvents() {
  const { agency } = useAgency();
  const agencyId = agency?.id;

  const { data: events, isLoading } = useQuery({
    queryKey: ["browser-session-events", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("browser_session_events")
        .select("*")
        .eq("agency_id", agencyId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!agencyId,
    refetchInterval: 30000,
  });

  const markRead = async (eventId: string) => {
    await supabase
      .from("browser_session_events")
      .update({ is_read: true })
      .eq("id", eventId);
  };

  return { events: events ?? [], isLoading, markRead };
}

export function useCaptchaCheck() {
  const { agency } = useAgency();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ browserbaseSessionId, sessionLinkId }: { browserbaseSessionId: string; sessionLinkId?: string }) => {
      return await invokeAction("check_captcha_events", {
        browserbaseSessionId,
        agencyId: agency?.id,
        sessionLinkId,
      });
    },
    onSuccess: (data) => {
      if (data.count > 0) {
        toast.warning(`${data.count} CAPTCHA event(s) detected`);
      } else {
        toast.success("No CAPTCHA events found");
      }
      queryClient.invalidateQueries({ queryKey: ["browser-session-events"] });
    },
  });
}

export function useBrowserExtensions() {
  const { agency } = useAgency();
  const agencyId = agency?.id;

  const { data: extensions, isLoading } = useQuery({
    queryKey: ["browser-extensions", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("browser_extensions")
        .select("*")
        .eq("agency_id", agencyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  return { extensions: extensions ?? [], isLoading };
}

export function useExtensionUpload() {
  const { agency } = useAgency();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: "permission_guard" | "analytics_scraper") => {
      const { data, error } = await supabase.functions.invoke("upload-browserbase-extension", {
        body: { type, agencyId: agency?.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.name} extension activated successfully`);
      queryClient.invalidateQueries({ queryKey: ["browser-extensions"] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to upload extension: ${err.message}`);
    },
  });
}
