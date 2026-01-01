import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo } from "react";

export type RecruitingStatus = "prospecting" | "contacted" | "interviewed" | "approved" | "rejected";

export interface RecruitingCreator {
  id: string;
  name: string;
  alias: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: RecruitingStatus;
  notes: string | null;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateRecruitingInput = Omit<RecruitingCreator, "id" | "created_at" | "updated_at" | "onboarded">;
export type UpdateRecruitingInput = Partial<CreateRecruitingInput>;

export function useRecruitingCreators() {
  const queryClient = useQueryClient();

  const { data: recruitingCreators = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["recruiting-creators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recruiting_creators")
        .select("*")
        .eq("onboarded", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RecruitingCreator[];
    },
  });

  const createRecruitingCreatorMutation = useMutation({
    mutationFn: async (input: CreateRecruitingInput) => {
      const { data, error } = await supabase
        .from("recruiting_creators")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as RecruitingCreator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiting-creators"] });
      toast.success("Prospect added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add prospect: " + error.message);
    },
  });

  const updateRecruitingCreatorMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRecruitingInput }) => {
      const { data, error } = await supabase
        .from("recruiting_creators")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as RecruitingCreator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiting-creators"] });
      toast.success("Prospect updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update prospect: " + error.message);
    },
  });

  const deleteRecruitingCreatorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recruiting_creators").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiting-creators"] });
      toast.success("Prospect removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove prospect: " + error.message);
    },
  });

  const onboardCreatorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("onboard_recruiting_creator", {
        recruiting_id: id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiting-creators"] });
      queryClient.invalidateQueries({ queryKey: ["creators"] });
      toast.success("Creator onboarded successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to onboard creator");
    },
  });

  const updateRecruitingCreator = async (id: string, input: UpdateRecruitingInput) => {
    return updateRecruitingCreatorMutation.mutateAsync({ id, input });
  };

  const stats = useMemo(() => ({
    total: recruitingCreators.length,
    prospecting: recruitingCreators.filter((r) => r.status === "prospecting").length,
    contacted: recruitingCreators.filter((r) => r.status === "contacted").length,
    interviewed: recruitingCreators.filter((r) => r.status === "interviewed").length,
    approved: recruitingCreators.filter((r) => r.status === "approved").length,
    rejected: recruitingCreators.filter((r) => r.status === "rejected").length,
  }), [recruitingCreators]);

  return {
    recruitingCreators,
    loading,
    stats,
    createRecruitingCreator: createRecruitingCreatorMutation.mutateAsync,
    updateRecruitingCreator,
    deleteRecruitingCreator: deleteRecruitingCreatorMutation.mutateAsync,
    onboardCreator: onboardCreatorMutation.mutateAsync,
    refetch,
  };
}
