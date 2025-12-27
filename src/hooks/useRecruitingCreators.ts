import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [recruitingCreators, setRecruitingCreators] = useState<RecruitingCreator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecruitingCreators = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("recruiting_creators")
        .select("*")
        .eq("onboarded", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecruitingCreators(data as RecruitingCreator[]);
    } catch (error) {
      console.error("Error fetching recruiting creators:", error);
      toast.error("Failed to load recruiting creators");
    } finally {
      setLoading(false);
    }
  }, []);

  const createRecruitingCreator = async (input: CreateRecruitingInput) => {
    try {
      const { data, error } = await supabase
        .from("recruiting_creators")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      setRecruitingCreators((prev) => [data as RecruitingCreator, ...prev]);
      toast.success("Prospect added successfully");
      return data as RecruitingCreator;
    } catch (error) {
      console.error("Error creating recruiting creator:", error);
      toast.error("Failed to add prospect");
      return null;
    }
  };

  const updateRecruitingCreator = async (id: string, input: UpdateRecruitingInput) => {
    try {
      const { data, error } = await supabase
        .from("recruiting_creators")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setRecruitingCreators((prev) => prev.map((r) => (r.id === id ? (data as RecruitingCreator) : r)));
      toast.success("Prospect updated successfully");
      return data as RecruitingCreator;
    } catch (error) {
      console.error("Error updating recruiting creator:", error);
      toast.error("Failed to update prospect");
      return null;
    }
  };

  const deleteRecruitingCreator = async (id: string) => {
    try {
      const { error } = await supabase.from("recruiting_creators").delete().eq("id", id);

      if (error) throw error;
      setRecruitingCreators((prev) => prev.filter((r) => r.id !== id));
      toast.success("Prospect removed successfully");
      return true;
    } catch (error) {
      console.error("Error deleting recruiting creator:", error);
      toast.error("Failed to remove prospect");
      return false;
    }
  };

  const onboardCreator = async (id: string) => {
    try {
      const { data, error } = await supabase.rpc("onboard_recruiting_creator", {
        recruiting_id: id,
      });

      if (error) throw error;
      setRecruitingCreators((prev) => prev.filter((r) => r.id !== id));
      toast.success("Creator onboarded successfully!");
      return data;
    } catch (error: any) {
      console.error("Error onboarding creator:", error);
      toast.error(error.message || "Failed to onboard creator");
      return null;
    }
  };

  useEffect(() => {
    fetchRecruitingCreators();
  }, [fetchRecruitingCreators]);

  const stats = {
    total: recruitingCreators.length,
    prospecting: recruitingCreators.filter((r) => r.status === "prospecting").length,
    contacted: recruitingCreators.filter((r) => r.status === "contacted").length,
    interviewed: recruitingCreators.filter((r) => r.status === "interviewed").length,
    approved: recruitingCreators.filter((r) => r.status === "approved").length,
    rejected: recruitingCreators.filter((r) => r.status === "rejected").length,
  };

  return {
    recruitingCreators,
    loading,
    stats,
    createRecruitingCreator,
    updateRecruitingCreator,
    deleteRecruitingCreator,
    onboardCreator,
    refetch: fetchRecruitingCreators,
  };
}
