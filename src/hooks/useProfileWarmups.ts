import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { toast } from "sonner";
import { useEffect } from "react";

async function invokeAction(action: string, params: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("browserbase-session", {
    body: { action, ...params },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export interface ProfileWarmup {
  id: string;
  creator_id: string | null;
  agency_id: string;
  browserbase_context_id: string;
  status: string;
  warmup_type: string;
  sites_visited: number;
  total_sites: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface WarmupIntelligence {
  id: string;
  warmup_id: string | null;
  agency_id: string;
  source_url: string | null;
  page_title: string | null;
  extracted_text: string | null;
  category: string;
  keywords: string[] | null;
  created_at: string;
}

export interface PreWarmedProfile {
  id: string;
  agency_id: string;
  browserbase_context_id: string;
  warmup_count: number;
  last_warmed_at: string | null;
  assigned_creator_id: string | null;
  status: string;
  created_at: string;
}

export function useProfileWarmups() {
  const { agency } = useAgency();
  const agencyId = agency?.id;
  const queryClient = useQueryClient();

  const { data: warmups, isLoading: warmupsLoading } = useQuery({
    queryKey: ["profile-warmups", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_profile_warmups")
        .select("*")
        .eq("agency_id", agencyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProfileWarmup[];
    },
    enabled: !!agencyId,
  });

  // Realtime subscription for warmup progress
  useEffect(() => {
    if (!agencyId) return;
    const channel = supabase
      .channel("warmup-progress")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "creator_profile_warmups",
        filter: `agency_id=eq.${agencyId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["profile-warmups", agencyId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [agencyId, queryClient]);

  const { data: preWarmed, isLoading: preWarmedLoading } = useQuery({
    queryKey: ["pre-warmed-profiles", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pre_warmed_profiles")
        .select("*")
        .eq("agency_id", agencyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PreWarmedProfile[];
    },
    enabled: !!agencyId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["profile-warmups", agencyId] });
    queryClient.invalidateQueries({ queryKey: ["pre-warmed-profiles", agencyId] });
    queryClient.invalidateQueries({ queryKey: ["warmup-intelligence", agencyId] });
  };

  const warmupSingle = useMutation({
    mutationFn: async ({ creatorId, warmupType = "generic", contextId, keywords }: {
      creatorId?: string; warmupType?: string; contextId?: string; keywords?: string[];
    }) => {
      return invokeAction("warmup_single_profile", { creatorId, agencyId, warmupType, contextId, keywords });
    },
    onSuccess: (data) => {
      toast.success(`Warmup ${data.status}: ${data.sitesVisited} sites visited`);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(`Warmup failed: ${err.message}`);
      invalidate();
    },
  });

  const warmupBatch = useMutation({
    mutationFn: async ({ creatorIds, warmupType = "generic", keywords }: {
      creatorIds?: string[]; warmupType?: string; keywords?: string[];
    }) => {
      return invokeAction("warmup_profiles", { creatorIds, agencyId, warmupType, keywords });
    },
  });

  const extendedWarmup = useMutation({
    mutationFn: async ({ creatorId, contextId, durationHours = 4 }: {
      creatorId?: string; contextId?: string; durationHours?: number;
    }) => {
      return invokeAction("extended_warmup", { creatorId, agencyId, contextId, durationHours });
    },
    onSuccess: (data) => {
      toast.success(`Extended warmup complete: ${data.sitesVisited} sites visited over ${data.durationHours}h`);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(`Extended warmup failed: ${err.message}`);
      invalidate();
    },
  });

  const createPreWarm = useMutation({
    mutationFn: async ({ warmupType = "full", keywords }: { warmupType?: string; keywords?: string[] }) => {
      return invokeAction("create_pre_warm_profile", { agencyId, warmupType, keywords });
    },
    onSuccess: () => {
      toast.success("Pre-warm profile created");
      invalidate();
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  });

  const assignPreWarm = useMutation({
    mutationFn: async ({ profileId, creatorId }: { profileId: string; creatorId: string }) => {
      return invokeAction("assign_pre_warm_profile", { profileId, creatorId, agencyId });
    },
    onSuccess: () => {
      toast.success("Pre-warmed profile assigned to creator");
      invalidate();
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  });

  // Helper: get latest warmup for a creator
  const getLatestWarmup = (creatorId: string) => {
    return (warmups ?? []).find(w => w.creator_id === creatorId);
  };

  return {
    warmups: warmups ?? [],
    preWarmed: preWarmed ?? [],
    warmupsLoading,
    preWarmedLoading,
    warmupSingle,
    warmupBatch,
    extendedWarmup,
    createPreWarm,
    assignPreWarm,
    getLatestWarmup,
    invalidate,
  };
}

export function useWarmupIntelligence() {
  const { agency } = useAgency();
  const agencyId = agency?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["warmup-intelligence", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("warmup_intelligence")
        .select("*")
        .eq("agency_id", agencyId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as WarmupIntelligence[];
    },
    enabled: !!agencyId,
  });

  return { intelligence: data ?? [], isLoading };
}
