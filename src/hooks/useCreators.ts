import { useAgencyScopedCRUD } from "./useAgencyScopedCRUD";
import { supabase } from "@/integrations/supabase/client";
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
  persona: string | null;
  agency_id: string | null;
  commission_rate: number | null;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateCreatorInput = Omit<Creator, "id" | "created_at" | "updated_at" | "agency_id">;
export type UpdateCreatorInput = Partial<CreateCreatorInput>;

export function useCreators() {
  const crud = useAgencyScopedCRUD<Creator>({
    table: "creators",
    queryKey: "creators",
    orderBy: { column: "created_at", ascending: false },
    limitType: "creator",
    messages: {
      createSuccess: "Creator added successfully",
      updateSuccess: "Creator updated successfully",
      deleteSuccess: "Creator deleted successfully",
    },
  });

  const getCreatorById = useCallback(
    async (id: string): Promise<Creator | null> => {
      if (!crud.agencyId) return null;

      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .eq("id", id)
        .eq("agency_id", crud.agencyId)
        .single();

      if (error) {
        console.error("Error fetching creator:", error);
        return null;
      }
      return data as Creator;
    },
    [crud.agencyId]
  );

  const stats = useMemo(() => ({
    total: crud.items.length,
    active: crud.items.filter((c) => c.status === "Active").length,
    onboarding: crud.items.filter((c) => c.status === "Onboarding").length,
    paused: crud.items.filter((c) => c.status === "Paused").length,
    totalRevenue: crud.items.reduce((sum, c) => sum + Number(c.revenue), 0),
  }), [crud.items]);

  return {
    creators: crud.items,
    loading: crud.loading,
    stats,
    limits: crud.limits,
    getCreatorById,
    createCreator: crud.create,
    updateCreator: crud.update,
    deleteCreator: crud.remove,
  };
}
