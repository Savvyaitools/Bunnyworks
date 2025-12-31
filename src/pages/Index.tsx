import { DollarSign, TrendingUp, Users, CheckSquare } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { MetricCard, RevenueChart, ActivityFeed } from "@/components/dashboard";
import { TasksCompletionChart } from "@/components/dashboard/TasksCompletionChart";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { CreatorTaskProgress } from "@/components/dashboard/CreatorTaskProgress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch tasks completed this month
  const { data: tasksData } = useQuery({
    queryKey: ["tasks-completed"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "Completed");
      if (error) throw error;
      return count || 0;
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

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toLocaleString()}`;
  };

  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(revenueData || 0),
      change: "—",
      changeType: "neutral" as const,
      icon: DollarSign,
    },
    {
      title: "Agency Earnings",
      value: formatCurrency((revenueData || 0) * 0.3), // Assuming 30% agency cut
      change: "—",
      changeType: "neutral" as const,
      icon: TrendingUp,
    },
    {
      title: "Active Creators",
      value: String(creatorsData || 0),
      change: "—",
      changeType: "neutral" as const,
      icon: Users,
    },
    {
      title: "Tasks Completed",
      value: String(tasksData || 0),
      change: "—",
      changeType: "neutral" as const,
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

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <MetricCard
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
