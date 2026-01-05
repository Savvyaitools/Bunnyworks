import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Agency {
  id: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  commission_rate: number;
  subscription_tier: string;
  max_creators: number;
  max_employees: number;
  onboarding_completed: boolean;
  browser_sync_enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

interface AgencyLimits {
  currentCreators: number;
  maxCreators: number;
  currentEmployees: number;
  maxEmployees: number;
  canAddCreator: boolean;
  canAddEmployee: boolean;
}

interface UpdateAgencyData {
  name?: string;
  website?: string | null;
  commission_rate?: number;
}

export function useAgency() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const agencyId = profile?.agency_id;

  const { data: agency, isLoading, refetch } = useQuery({
    queryKey: ["agency", agencyId],
    queryFn: async () => {
      if (!agencyId) return null;

      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", agencyId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching agency:", error);
        return null;
      }

      return data as Agency | null;
    },
    enabled: !!agencyId,
  });

  // Fetch current counts for limit checking
  const { data: limits } = useQuery({
    queryKey: ["agency-limits", agencyId],
    queryFn: async (): Promise<AgencyLimits | null> => {
      if (!agencyId || !agency) return null;

      // Get creator count
      const { count: creatorCount } = await supabase
        .from("creators")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agencyId);

      // Get employee count
      const { count: employeeCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agencyId);

      const currentCreators = creatorCount || 0;
      const currentEmployees = employeeCount || 0;

      return {
        currentCreators,
        maxCreators: agency.max_creators,
        currentEmployees,
        maxEmployees: agency.max_employees,
        canAddCreator: currentCreators < agency.max_creators,
        canAddEmployee: currentEmployees < agency.max_employees,
      };
    },
    enabled: !!agencyId && !!agency,
  });

  const updateAgency = useMutation({
    mutationFn: async (updates: UpdateAgencyData) => {
      if (!agency?.id) throw new Error("No agency found");

      const { data, error } = await supabase
        .from("agencies")
        .update(updates)
        .eq("id", agency.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency"] });
      toast.success("Agency settings updated");
    },
    onError: (error) => {
      console.error("Error updating agency:", error);
      toast.error("Failed to update agency settings");
    },
  });

  const invalidateLimits = () => {
    queryClient.invalidateQueries({ queryKey: ["agency-limits"] });
  };

  return {
    agency,
    agencyId,
    isLoading,
    refetch,
    limits,
    invalidateLimits,
    updateAgency: updateAgency.mutate,
    isUpdating: updateAgency.isPending,
  };
}
