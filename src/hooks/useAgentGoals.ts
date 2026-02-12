import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useAgentGoals() {
  const { profile } = useAuth();
  const agencyId = profile?.agency_id;
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ['agent-goals', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from('agent_goals')
        .select('*')
        .eq('agency_id', agencyId)
        .order('priority', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!agencyId,
  });

  const { data: feedback } = useQuery({
    queryKey: ['agent-feedback', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from('agent_feedback')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!agencyId,
  });

  const submitFeedback = useMutation({
    mutationFn: async ({ actionId, rating, comment }: { actionId: string; rating: number; comment?: string }) => {
      if (!agencyId) throw new Error('No agency');
      const { error } = await supabase.from('agent_feedback').insert({
        action_id: actionId,
        agency_id: agencyId,
        rating,
        comment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-feedback'] });
      toast.success('Feedback submitted');
    },
  });

  return {
    goals: goals || [],
    feedback: feedback || [],
    isLoading,
    submitFeedback,
  };
}
