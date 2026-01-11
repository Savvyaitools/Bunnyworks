import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "./useAgency";

export interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  role: string;
  type: "employee" | "chatter";
  avatarSeed: string | null;
  isActive: boolean;
  skillGrade?: string;
  timezone?: string | null;
}

/**
 * Hook to fetch all team members (employees + chatters) for Team Chat.
 * Returns unified list with type indicator for proper message routing.
 */
export function useTeamMembers() {
  const { agencyId } = useAgency();

  const { data: teamMembers = [], isLoading, refetch } = useQuery({
    queryKey: ["team-members", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      // Fetch employees (non-chatters)
      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("id, name, email, role, avatar_seed, status, is_chatter")
        .eq("agency_id", agencyId)
        .eq("is_chatter", false)
        .order("name", { ascending: true });

      if (empError) throw empError;

      // Fetch chatters from chatters table
      const { data: chatters, error: chatError } = await supabase
        .from("chatters")
        .select("id, name, email, avatar_seed, is_active, skill_grade, timezone")
        .eq("agency_id", agencyId)
        .order("name", { ascending: true });

      if (chatError) throw chatError;

      // Map employees to TeamMember format
      const employeeMembers: TeamMember[] = (employees || []).map((emp) => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        type: "employee" as const,
        avatarSeed: emp.avatar_seed,
        isActive: emp.status === "Active",
      }));

      // Map chatters to TeamMember format
      const chatterMembers: TeamMember[] = (chatters || []).map((ch) => ({
        id: ch.id,
        name: ch.name,
        email: ch.email,
        role: "Chatter",
        type: "chatter" as const,
        avatarSeed: ch.avatar_seed,
        isActive: ch.is_active ?? false,
        skillGrade: ch.skill_grade,
        timezone: ch.timezone,
      }));

      // Combine and sort by name
      return [...employeeMembers, ...chatterMembers].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    },
    enabled: !!agencyId,
  });

  return {
    teamMembers,
    loading: isLoading,
    refetch,
  };
}
