import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface AgentMemory {
  id: string;
  agency_id: string;
  agent_type: string;
  category: string;
  content: string;
  metadata: Record<string, unknown>;
  importance: number;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
}

export function useAgentMemories(agentType?: string) {
  const { profile } = useAuth();
  const agencyId = profile?.agency_id;
  const queryClient = useQueryClient();

  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['agent-memories', agencyId, agentType],
    queryFn: async () => {
      if (!agencyId) return [];
      let query = supabase
        .from('agent_memories')
        .select('*')
        .eq('agency_id', agencyId)
        .order('importance', { ascending: false })
        .order('updated_at', { ascending: false });
      if (agentType) query = query.eq('agent_type', agentType);
      const { data, error } = await query.limit(200);
      if (error) throw error;
      return (data || []) as AgentMemory[];
    },
    enabled: !!agencyId,
  });

  const addMemory = useMutation({
    mutationFn: async (memory: { agent_type: string; category: string; content: string; importance?: number; metadata?: Record<string, unknown> }) => {
      if (!agencyId) throw new Error('No agency');
      const { error } = await supabase.from('agent_memories').insert([{
        agency_id: agencyId,
        agent_type: memory.agent_type,
        category: memory.category,
        content: memory.content,
        importance: memory.importance ?? 5,
        metadata: (memory.metadata ?? {}) as Record<string, string>,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-memories'] });
      toast.success('Memory added');
    },
    onError: () => toast.error('Failed to add memory'),
  });

  const updateMemory = useMutation({
    mutationFn: async ({ id, content, category, importance }: { id: string; content?: string; category?: string; importance?: number }) => {
      const updates: Record<string, unknown> = {};
      if (content !== undefined) updates.content = content;
      if (category !== undefined) updates.category = category;
      if (importance !== undefined) updates.importance = importance;
      const { error } = await supabase.from('agent_memories').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-memories'] });
      toast.success('Memory updated');
    },
    onError: () => toast.error('Failed to update memory'),
  });

  const deleteMemory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agent_memories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-memories'] });
      toast.success('Memory deleted');
    },
    onError: () => toast.error('Failed to delete memory'),
  });

  return { memories, isLoading, addMemory, updateMemory, deleteMemory };
}
