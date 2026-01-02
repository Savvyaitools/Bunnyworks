import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Agency {
  id: string;
  name: string;
  website: string | null;
  commission_rate: number;
  subscription_tier: string;
  max_creators: number;
  max_employees: number;
  created_at: string;
  updated_at: string;
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

  return {
    agency,
    isLoading,
    refetch,
    updateAgency: updateAgency.mutate,
    isUpdating: updateAgency.isPending,
  };
}

// Helper function to create an agency and link it to a profile
export async function createAgencyForUser(userId: string, agencyName: string) {
  // Create the agency
  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .insert({ name: agencyName })
    .select()
    .single();

  if (agencyError) {
    console.error("Error creating agency:", agencyError);
    throw agencyError;
  }

  // Link the profile to the agency
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ agency_id: agency.id })
    .eq("id", userId);

  if (profileError) {
    console.error("Error linking profile to agency:", profileError);
    throw profileError;
  }

  return agency;
}
