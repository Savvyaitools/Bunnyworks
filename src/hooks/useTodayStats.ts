import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";

interface TodayStatsData {
  todayRevenue: number;
  revenueTrend: number;
  messagesSent: number;
  activeChatters: number;
  totalChattersToday: number;
  avgResponseTime: number;
}

/**
 * Consolidated hook for today's real-time stats
 * Uses Promise.all to fetch all metrics in parallel
 */
export function useTodayStats() {
  const { agency } = useAgency();
  const agencyId = agency?.id;

  return useQuery({
    queryKey: ["today-ofm-stats", agencyId],
    enabled: Boolean(agencyId),
    staleTime: 1000 * 30, // 30 seconds for real-time feel
    refetchInterval: 30000, // Refresh every 30 seconds
    queryFn: async (): Promise<TodayStatsData> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Current month start for period-based earnings
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month

      // Get creator IDs for this agency first (needed for earnings filter)
      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("agency_id", agencyId);
      
      const creatorIds = creators?.map(c => c.id) || [];

      // Get chatter IDs for this agency
      const { data: chatters } = await supabase
        .from("chatters")
        .select("id")
        .eq("agency_id", agencyId);
      
      const chatterIds = chatters?.map(c => c.id) || [];

      // Run all queries in parallel
      const [
        todayEarningsResult,
        yesterdayEarningsResult,
        messageCountResult,
        activeLogsResult,
        allTodayLogsResult,
      ] = await Promise.all([
        // Current month's revenue (based on period_start, not created_at)
        creatorIds.length > 0
          ? supabase
              .from("creator_earnings")
              .select("amount")
              .in("creator_id", creatorIds)
              .gte("period_start", currentMonthStart.toISOString().split('T')[0])
          : Promise.resolve({ data: [] as { amount: number }[] }),
        
        // Last month's revenue for comparison
        creatorIds.length > 0
          ? supabase
              .from("creator_earnings")
              .select("amount")
              .in("creator_id", creatorIds)
              .gte("period_start", lastMonthStart.toISOString().split('T')[0])
              .lte("period_start", lastMonthEnd.toISOString().split('T')[0])
          : Promise.resolve({ data: [] as { amount: number }[] }),
        
        // Messages sent today
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("agency_id", agencyId)
          .gte("created_at", today.toISOString()),
        
        // Active chatters (clocked in today, not clocked out)
        chatterIds.length > 0
          ? supabase
              .from("chatter_time_logs")
              .select("chatter_id")
              .in("chatter_id", chatterIds)
              .gte("clock_in", today.toISOString())
              .is("clock_out", null)
          : Promise.resolve({ data: [] as { chatter_id: string }[] }),
        
        // Total chatters who worked today
        chatterIds.length > 0
          ? supabase
              .from("chatter_time_logs")
              .select("chatter_id")
              .in("chatter_id", chatterIds)
              .gte("clock_in", today.toISOString())
          : Promise.resolve({ data: [] as { chatter_id: string }[] }),
      ]);

      // Calculate metrics
      const todayRevenue = todayEarningsResult.data?.reduce(
        (sum: number, e: { amount: number }) => sum + Number(e.amount), 0
      ) || 0;

      const yesterdayRevenue = yesterdayEarningsResult.data?.reduce(
        (sum: number, e: { amount: number }) => sum + Number(e.amount), 0
      ) || 0;

      const uniqueActiveChatters = new Set(
        activeLogsResult.data?.map((l: { chatter_id: string }) => l.chatter_id) || []
      ).size;

      const totalChattersToday = new Set(
        allTodayLogsResult.data?.map((l: { chatter_id: string }) => l.chatter_id) || []
      ).size;

      // Revenue trend percentage (vs last month)
      const lastMonthRevenue = yesterdayEarningsResult.data?.reduce(
        (sum: number, e: { amount: number }) => sum + Number(e.amount), 0
      ) || 0;
      
      const revenueTrend = lastMonthRevenue > 0
        ? ((todayRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
        : (todayRevenue > 0 ? 100 : 0);

      return {
        todayRevenue,
        revenueTrend: Number(revenueTrend.toFixed(1)),
        messagesSent: messageCountResult.count || 0,
        activeChatters: uniqueActiveChatters,
        totalChattersToday,
        avgResponseTime: 3.5, // Mock - would need real OF API data
      };
    },
  });
}