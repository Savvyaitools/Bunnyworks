import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  created_at: string;
  updated_at: string;
}

export type CreateCreatorInput = Omit<Creator, "id" | "created_at" | "updated_at">;
export type UpdateCreatorInput = Partial<CreateCreatorInput>;

export function useCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreators = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCreators(data as Creator[]);
    } catch (error) {
      console.error("Error fetching creators:", error);
      toast.error("Failed to load creators");
    } finally {
      setLoading(false);
    }
  }, []);

  const getCreatorById = useCallback(async (id: string): Promise<Creator | null> => {
    try {
      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Creator;
    } catch (error) {
      console.error("Error fetching creator:", error);
      return null;
    }
  }, []);

  const createCreator = async (input: CreateCreatorInput) => {
    try {
      const { data, error } = await supabase
        .from("creators")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      setCreators((prev) => [data as Creator, ...prev]);
      toast.success("Creator added successfully");
      return data as Creator;
    } catch (error) {
      console.error("Error creating creator:", error);
      toast.error("Failed to add creator");
      return null;
    }
  };

  const updateCreator = async (id: string, input: UpdateCreatorInput) => {
    try {
      const { data, error } = await supabase
        .from("creators")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setCreators((prev) => prev.map((c) => (c.id === id ? (data as Creator) : c)));
      toast.success("Creator updated successfully");
      return data as Creator;
    } catch (error) {
      console.error("Error updating creator:", error);
      toast.error("Failed to update creator");
      return null;
    }
  };

  const deleteCreator = async (id: string) => {
    try {
      const { error } = await supabase.from("creators").delete().eq("id", id);

      if (error) throw error;
      setCreators((prev) => prev.filter((c) => c.id !== id));
      toast.success("Creator deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting creator:", error);
      toast.error("Failed to delete creator");
      return false;
    }
  };

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const stats = {
    total: creators.length,
    active: creators.filter((c) => c.status === "Active").length,
    onboarding: creators.filter((c) => c.status === "Onboarding").length,
    paused: creators.filter((c) => c.status === "Paused").length,
    totalRevenue: creators.reduce((sum, c) => sum + Number(c.revenue), 0),
  };

  return {
    creators,
    loading,
    stats,
    getCreatorById,
    createCreator,
    updateCreator,
    deleteCreator,
    refetch: fetchCreators,
  };
}
