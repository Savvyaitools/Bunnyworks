import { useState } from "react";
import { DollarSign, TrendingUp, Users, CheckSquare, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { CircularMetricCard, RevenueChart, ActivityFeed } from "@/components/dashboard";
import { TasksCompletionChart } from "@/components/dashboard/TasksCompletionChart";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { CreatorTaskProgress } from "@/components/dashboard/CreatorTaskProgress";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { useAgency } from "@/hooks/useAgency";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();
  const { agency } = useAgency();
  const commissionRate = agency?.commission_rate ?? 0.3;
  // Fetch creators count
  const { data: creatorsData } = useQuery({
    queryKey: ["creators-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("creators")
        .select("*", { count: "exact", head: true })
        .eq("status", "Active");
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch tasks data
  const { data: tasksData } = useQuery({
    queryKey: ["tasks-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("status");
      if (error) throw error;
      const completed = data?.filter(t => t.status === "Completed").length || 0;
      const total = data?.length || 1;
      return { completed, total };
    },
  });

  // Fetch total revenue from creator_earnings (NET amounts) and extracted_data for GROSS
  const { data: revenueData } = useQuery({
    queryKey: ["total-revenue"],
    queryFn: async () => {
      // Get NET earnings from creator_earnings
      const { data: netData, error: netError } = await supabase
        .from("creator_earnings")
        .select("amount");
      if (netError) throw netError;
      const netTotal = netData?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;
      
      // Get GROSS from extracted_data for calculating agency cut
      const { data: extractedData, error: extractedError } = await supabase
        .from("extracted_data")
        .select("value, raw_text")
        .eq("data_type", "earnings");
      if (extractedError) throw extractedError;
      
      // Sum up GROSS values
      const grossTotal = extractedData?.reduce((sum, item) => {
        if (item.raw_text?.toLowerCase().includes("gross")) {
          return sum + Number(item.value);
        }
        return sum;
      }, 0) || 0;
      
      // If we have both GROSS and NET, agency earnings = GROSS - NET
      // Otherwise estimate agency cut using commission rate
      const agencyEarnings = grossTotal > 0 ? grossTotal - netTotal : netTotal * commissionRate;
      
      return {
        netTotal,      // Creator's take-home
        grossTotal,    // Total before platform fees
        agencyEarnings // Agency's cut
      };
    },
  });

  // Fetch total creators for percentage
  const { data: totalCreators } = useQuery({
    queryKey: ["total-creators"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("creators")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 1;
    },
  });

  // Use compact format for dashboard metrics
  const formatCompactCurrency = (value: number) => formatCurrency(value, true);

  // Extract revenue figures
  const grossRevenue = revenueData?.grossTotal || revenueData?.netTotal || 0;
  const netRevenue = revenueData?.netTotal || 0;
  const agencyEarnings = revenueData?.agencyEarnings || 0;

  // Calculate percentages for circular charts
  const revenueTarget = 100000; // Example target
  const revenuePercentage = Math.min((grossRevenue / revenueTarget) * 100, 100);
  const agencyPercentage = Math.min((agencyEarnings / (revenueTarget * 0.2)) * 100, 100);
  const creatorsPercentage = totalCreators ? ((creatorsData || 0) / totalCreators) * 100 : 0;
  const tasksPercentage = tasksData ? (tasksData.completed / tasksData.total) * 100 : 0;

  const metrics = [
    {
      title: "Gross Revenue",
      value: formatCompactCurrency(grossRevenue),
      percentage: revenuePercentage,
      color: "hsl(217, 91%, 60%)", // Blue
      icon: DollarSign,
    },
    {
      title: "Creator Net",
      value: formatCompactCurrency(netRevenue),
      percentage: Math.min((netRevenue / (revenueTarget * 0.8)) * 100, 100),
      color: "hsl(142, 71%, 45%)", // Green
      icon: TrendingUp,
    },
    {
      title: "Agency Earnings",
      value: formatCompactCurrency(agencyEarnings),
      percentage: agencyPercentage,
      color: "hsl(32, 95%, 55%)", // Orange
      icon: DollarSign,
    },
    {
      title: "Active Creators",
      value: String(creatorsData || 0),
      percentage: creatorsPercentage,
      color: "hsl(142, 71%, 45%)", // Green
      icon: Users,
    },
    {
      title: "Tasks Completed",
      value: String(tasksData?.completed || 0),
      percentage: tasksPercentage,
      color: "hsl(0, 84%, 60%)", // Red
      icon: CheckSquare,
    },
  ];

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-onlyfans-earnings");
      
      if (error) throw error;
      
      toast.success(`Sync complete: ${data.success} accounts synced`);
      
      // Refresh revenue data
      queryClient.invalidateQueries({ queryKey: ["total-revenue"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Agency Command Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time overview of your agency performance
            </p>
          </div>
          <Button
            onClick={handleSyncNow}
            disabled={syncing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Earnings"}
          </Button>
        </div>

        {/* Circular Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <CircularMetricCard
              key={metric.title}
              {...metric}
              delay={index * 100}
            />
          ))}
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RevenueChart />
          </div>
          <div>
            <ActivityFeed />
          </div>
        </div>

        {/* Tasks Analytics & Goals */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <TasksCompletionChart />
          </div>
          <div>
            <GoalProgress />
          </div>
        </div>

        {/* Creator Task Progress */}
        <CreatorTaskProgress />
      </div>
    </DashboardLayout>
  );
};

export default Index;
