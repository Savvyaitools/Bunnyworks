import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";

interface DashboardStats {
  creatorsCount: number;
  employeesCount: number;
  tasksCompleted: number;
  tasksPending: number;
  tasksTotal: number;
  grossRevenue: number;
  netRevenue: number;
  agencyEarnings: number;
}

/**
 * Consolidated dashboard stats hook that fetches all metrics in parallel
 * Eliminates the N+1 query pattern from the original Index.tsx
 */
export function useDashboardStats() {
  const { agency } = useAgency();
  const agencyId = agency?.id;
  const commissionRate = agency?.commission_rate ?? 0.3;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard-stats", agencyId],
    enabled: Boolean(agencyId),
    staleTime: 1000 * 60, // 1 minute for dashboard (more frequent updates)
    queryFn: async (): Promise<DashboardStats> => {
      // Run all queries in parallel using Promise.all
      const [creatorsResult, employeesResult, tasksResult, earningsResult, extractedResult] = 
        await Promise.all([
          // Creators count
          supabase
            .from("creators")
            .select("*", { count: "exact", head: true })
            .eq("agency_id", agencyId)
            .eq("status", "Active"),
          
          // Employees count
          supabase
            .from("employees")
            .select("*", { count: "exact", head: true })
            .eq("agency_id", agencyId)
            .eq("status", "Active"),
          
          // Tasks data
          supabase
            .from("tasks")
            .select("status")
            .eq("agency_id", agencyId),
          
          // Creator earnings (net)
          supabase
            .from("creator_earnings")
            .select("amount, creator_id")
            .in("creator_id", 
              (await supabase
                .from("creators")
                .select("id")
                .eq("agency_id", agencyId)
              ).data?.map(c => c.id) || []
            ),
          
          // Extracted data for gross earnings
          supabase
            .from("extracted_data")
            .select("value, raw_text")
            .eq("data_type", "earnings")
        ]);

      // Process creators count
      const creatorsCount = creatorsResult.count || 0;
      
      // Process employees count
      const employeesCount = employeesResult.count || 0;
      
      // Process tasks
      const tasks = tasksResult.data || [];
      const tasksCompleted = tasks.filter(t => t.status === "Completed").length;
      const tasksPending = tasks.filter(t => t.status === "Pending" || t.status === "In Progress").length;
      const tasksTotal = tasks.length || 1;
      
      // Process revenue
      const netRevenue = earningsResult.data?.reduce(
        (sum, earning) => sum + Number(earning.amount), 0
      ) || 0;
      
      const grossRevenue = extractedResult.data?.reduce((sum, item) => {
        if (item.raw_text?.toLowerCase().includes("gross")) {
          return sum + Number(item.value);
        }
        return sum;
      }, 0) || 0;
      
      const agencyEarnings = grossRevenue > 0 
        ? grossRevenue - netRevenue 
        : netRevenue * commissionRate;

      return {
        creatorsCount,
        employeesCount,
        tasksCompleted,
        tasksPending,
        tasksTotal,
        grossRevenue: grossRevenue || netRevenue,
        netRevenue,
        agencyEarnings,
      };
    },
  });

  return {
    stats: data,
    loading: isLoading,
    refetch,
    commissionRate,
  };
}