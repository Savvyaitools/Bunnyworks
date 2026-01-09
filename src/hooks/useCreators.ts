import { useSupabaseCRUD } from "./useSupabaseCRUD";
import { useAgency } from "./useAgency";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useCallback } from "react";
import { toast } from "sonner";

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
  agency_id: string | null;
  commission_rate: number | null;
  created_at: string;
  updated_at: string;
}

export type CreateCreatorInput = Omit<Creator, "id" | "created_at" | "updated_at" | "agency_id">;
export type UpdateCreatorInput = Partial<CreateCreatorInput>;

export function useCreators() {
  const { agencyId, limits, invalidateLimits } = useAgency();

  const crud = useSupabaseCRUD<Creator>({
    table: "creators",
    queryKey: "creators",
    enabled: Boolean(agencyId),
    filter: agencyId ? { column: "agency_id", value: agencyId } : undefined,
    orderBy: { column: "created_at", ascending: false },
    messages: {
      createSuccess: "Creator added successfully",
      updateSuccess: "Creator updated successfully",
      deleteSuccess: "Creator deleted successfully",
    },
  });

  const getCreatorById = useCallback(
    async (id: string): Promise<Creator | null> => {
      if (!agencyId) return null;

      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .eq("id", id)
        .eq("agency_id", agencyId)
        .single();

      if (error) {
        console.error("Error fetching creator:", error);
        return null;
      }
      return data as Creator;
    },
    [agencyId]
  );

  const stats = useMemo(() => ({
    total: crud.items.length,
    active: crud.items.filter((c) => c.status === "Active").length,
    onboarding: crud.items.filter((c) => c.status === "Onboarding").length,
    paused: crud.items.filter((c) => c.status === "Paused").length,
    totalRevenue: crud.items.reduce((sum, c) => sum + Number(c.revenue), 0),
  }), [crud.items]);

  // Wrapper that adds agency_id and checks limits
  const createCreator = useCallback(async (input: CreateCreatorInput) => {
    if (!agencyId) {
      toast.error("Agency not found. Please log in again.");
      throw new Error("Agency ID not found");
    }

    // Check limit before creating
    if (limits && !limits.canAddCreator) {
      toast.error(`Creator limit reached (${limits.currentCreators}/${limits.maxCreators}). Upgrade your plan to add more creators.`);
      throw new Error("Creator limit reached");
    }

    const result = await crud.create({ ...input, agency_id: agencyId });
    invalidateLimits();
    return result;
  }, [crud, agencyId, limits, invalidateLimits]);

  // Wrapper for delete to update limits
  const deleteCreator = useCallback(async (id: string) => {
    const result = await crud.remove(id);
    invalidateLimits();
    return result;
  }, [crud, invalidateLimits]);

  return {
    creators: crud.items,
    loading: crud.loading,
    stats,
    limits,
    getCreatorById,
    createCreator,
    updateCreator: crud.update,
    deleteCreator,
  };
}
