import { useSupabaseCRUD } from "./useSupabaseCRUD";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo, useCallback } from "react";
import { useAgency } from "./useAgency";

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
  country: string | null;
  agency_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateRecruitingInput = Omit<RecruitingCreator, "id" | "created_at" | "updated_at" | "agency_id">;
export type UpdateRecruitingInput = Partial<Omit<RecruitingCreator, "id" | "created_at" | "updated_at" | "agency_id">>;

export function useRecruitingCreators() {
  const queryClient = useQueryClient();
  const { agencyId } = useAgency();

  const crud = useSupabaseCRUD<RecruitingCreator>({
    table: "recruiting_creators",
    queryKey: "recruiting-creators",
    orderBy: { column: "created_at", ascending: false },
    filter: { column: "onboarded", value: false },
    messages: {
      createSuccess: "Prospect added successfully",
      updateSuccess: "Prospect updated successfully",
      deleteSuccess: "Prospect removed successfully",
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

  const stats = useMemo(() => ({
    total: crud.items.length,
    prospecting: crud.items.filter((r) => r.status === "prospecting").length,
    contacted: crud.items.filter((r) => r.status === "contacted").length,
    interviewed: crud.items.filter((r) => r.status === "interviewed").length,
    approved: crud.items.filter((r) => r.status === "approved").length,
    rejected: crud.items.filter((r) => r.status === "rejected").length,
  }), [crud.items]);

  // Wrapper that adds agency_id when creating
  const createRecruitingCreator = useCallback(async (input: CreateRecruitingInput) => {
    return crud.create({ ...input, agency_id: agencyId });
  }, [crud, agencyId]);

  return {
    recruitingCreators: crud.items,
    loading: crud.loading,
    stats,
    createRecruitingCreator,
    updateRecruitingCreator: crud.update,
    deleteRecruitingCreator: crud.remove,
    onboardCreator: onboardCreatorMutation.mutateAsync,
    refetch: crud.refetch,
  };
}
