import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "./useAgency";

export interface ChatterProfile {
  id: string;
  name: string;
  email: string | null;
  skill_grade: string;
  timezone: string | null;
  is_active: boolean | null;
  avatar_seed: string | null;
  agency_id: string | null;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch chatters directly from the public.chatters table.
 * Use this for shift scheduling to ensure correct foreign key references.
 */
export function useChatterProfiles() {
  const { agencyId } = useAgency();

  const { data: chatters = [], isLoading, refetch } = useQuery({
    queryKey: ["chatter-profiles", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from("chatters")
        .select("*")
        .eq("agency_id", agencyId)
        .order("name", { ascending: true });

      if (error) throw error;

      // Deduplicate by email (prefer records with auth_user_id, then most recent)
      const emailMap = new Map<string, ChatterProfile>();
      for (const chatter of data || []) {
        const emailKey = (chatter.email || chatter.id).toLowerCase();
        const existing = emailMap.get(emailKey);
        
        if (!existing) {
          emailMap.set(emailKey, chatter as ChatterProfile);
        } else {
          // Prefer the one with auth_user_id set
          if (chatter.auth_user_id && !existing.auth_user_id) {
            emailMap.set(emailKey, chatter as ChatterProfile);
          } else if (!chatter.auth_user_id && existing.auth_user_id) {
            // Keep existing
          } else if (new Date(chatter.created_at) > new Date(existing.created_at)) {
            // If both have or both lack auth_user_id, prefer newer
            emailMap.set(emailKey, chatter as ChatterProfile);
          }
        }
      }

      return Array.from(emailMap.values());
    },
    enabled: !!agencyId,
  });

  return {
    chatters,
    loading: isLoading,
    refetch,
  };
}
