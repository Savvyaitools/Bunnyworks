import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useAgentRuns() {
  const { profile } = useAuth();
  const agencyId = profile?.agency_id;

  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ['agent-runs', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!agencyId,
  });

  const { data: actions, isLoading: actionsLoading } = useQuery({
    queryKey: ['agent-actions', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from('agent_actions')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!agencyId,
  });

  return {
    runs: runs || [],
    actions: actions || [],
    isLoading: runsLoading || actionsLoading,
  };
}
