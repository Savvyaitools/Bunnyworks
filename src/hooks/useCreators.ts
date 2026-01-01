import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo, useCallback } from "react";

export interface Creator {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_seed: string | null;
  avatar_url: string | null;
  status: "Active" | "Onboarding" | "Paused" | "Offboarded";
  revenue: number;
  platform: string | null;
  followers: string | null;
  notes: string | null;
  alias: string | null;
  online_status: boolean | null;
  manager_id: string | null;
  onlyfans_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  snapchat_url: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateCreatorInput = Omit<Creator, "id" | "created_at" | "updated_at">;
export type UpdateCreatorInput = Partial<CreateCreatorInput>;

export function useCreators() {
  const queryClient = useQueryClient();

  const { data: creators = [], isLoading: loading } = useQuery({
    queryKey: ["creators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Creator[];
    },
  });

  const getCreatorById = useCallback(async (id: string): Promise<Creator | null> => {
    const { data, error } = await supabase
      .from("creators")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching creator:", error);
      return null;
    }
    return data as Creator;
  }, []);

  const createCreator = useMutation({
    mutationFn: async (input: CreateCreatorInput) => {
      const { data, error } = await supabase
        .from("creators")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as Creator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creators"] });
      toast.success("Creator added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add creator: " + error.message);
    },
  });

  const updateCreatorMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCreatorInput }) => {
      const { data, error } = await supabase
        .from("creators")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Creator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creators"] });
      toast.success("Creator updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update creator: " + error.message);
    },
  });

  const updateCreator = async (id: string, input: UpdateCreatorInput) => {
    return updateCreatorMutation.mutateAsync({ id, input });
  };

  const deleteCreator = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("creators").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creators"] });
      toast.success("Creator deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete creator: " + error.message);
    },
  });

  const stats = useMemo(() => ({
    total: creators.length,
    active: creators.filter((c) => c.status === "Active").length,
    onboarding: creators.filter((c) => c.status === "Onboarding").length,
    paused: creators.filter((c) => c.status === "Paused").length,
    totalRevenue: creators.reduce((sum, c) => sum + Number(c.revenue), 0),
  }), [creators]);

  return {
    creators,
    loading,
    stats,
    getCreatorById,
    createCreator: createCreator.mutateAsync,
    updateCreator,
    deleteCreator: deleteCreator.mutateAsync,
  };
}
