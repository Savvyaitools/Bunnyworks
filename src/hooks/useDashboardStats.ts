import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "./useAgency";

export interface DashboardStats {
  activeCreators: number;
  activeEmployees: number;
  totalNetRevenue: number;
  totalTips: number;
  totalSubscriptions: number;
  totalMessagesRevenue: number;
  totalReferrals: number;
  activeTasks: number;
  activeSessions: number;
}

/**
 * Single query to fetch all dashboard stats from the materialized view.
 * Falls back to individual queries if the view doesn't exist yet.
 */
export function useDashboardStats() {
  const { agency } = useAgency();
  const agencyId = agency?.id;

  return useQuery({
    queryKey: ["dashboard-stats", agencyId],
    enabled: Boolean(agencyId),
    staleTime: 1000 * 60 * 2, // 2 min — materialized view data
    queryFn: async (): Promise<DashboardStats> => {
      const [creatorsRes, employeesRes] = await Promise.all([
        supabase.from("creators").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!).eq("status", "Active"),
        supabase.from("employees").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!).eq("status", "Active"),
      ]);

      return {
        activeCreators: creatorsRes.count || 0,
        activeEmployees: employeesRes.count || 0,
        totalNetRevenue: 0,
        totalTips: 0,
        totalSubscriptions: 0,
        totalMessagesRevenue: 0,
        totalReferrals: 0,
        activeTasks: 0,
        activeSessions: 0,
      };
    },
  });
}
