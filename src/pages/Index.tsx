import { DollarSign, TrendingUp, Users, CheckSquare } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { CircularMetricCard, RevenueChart, ActivityFeed } from "@/components/dashboard";
import { TasksCompletionChart } from "@/components/dashboard/TasksCompletionChart";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { CreatorTaskProgress } from "@/components/dashboard/CreatorTaskProgress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";

const Index = () => {
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

  // Fetch total revenue from creator_earnings
  const { data: revenueData } = useQuery({
    queryKey: ["total-revenue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_earnings")
        .select("amount");
      if (error) throw error;
      const total = data?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;
      return total;
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

  // Calculate percentages for circular charts
  const revenueTarget = 100000; // Example target
  const revenuePercentage = Math.min(((revenueData || 0) / revenueTarget) * 100, 100);
  const agencyEarnings = (revenueData || 0) * 0.3;
  const agencyPercentage = Math.min((agencyEarnings / (revenueTarget * 0.3)) * 100, 100);
  const creatorsPercentage = totalCreators ? ((creatorsData || 0) / totalCreators) * 100 : 0;
  const tasksPercentage = tasksData ? (tasksData.completed / tasksData.total) * 100 : 0;

  const metrics = [
    {
      title: "Total Revenue",
      value: formatCompactCurrency(revenueData || 0),
      percentage: revenuePercentage,
      color: "hsl(217, 91%, 60%)", // Blue
      icon: DollarSign,
    },
    {
      title: "Agency Earnings",
      value: formatCompactCurrency(agencyEarnings),
      percentage: agencyPercentage,
      color: "hsl(32, 95%, 55%)", // Orange
      icon: TrendingUp,
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Agency Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time overview of your agency performance
          </p>
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
