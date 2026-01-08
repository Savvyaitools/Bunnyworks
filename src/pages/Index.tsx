import { useState } from "react";
import { RefreshCw, Users, DollarSign, CheckSquare, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { ActivityFeed, RevenueChart } from "@/components/dashboard";
import { TasksCompletionChart } from "@/components/dashboard/TasksCompletionChart";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { CreatorTaskProgress } from "@/components/dashboard/CreatorTaskProgress";
import { MiniSparklineCard } from "@/components/dashboard/MiniSparklineCard";
import { CreatorRevenueChart } from "@/components/dashboard/CreatorRevenueChart";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { CircularMetricCard } from "@/components/dashboard/CircularMetricCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { useAgency } from "@/hooks/useAgency";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
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
      const { data, error } = await supabase.from("tasks").select("status");
      if (error) throw error;
      const completed = data?.filter((t) => t.status === "Completed").length || 0;
      const pending = data?.filter((t) => t.status === "Pending" || t.status === "In Progress").length || 0;
      const total = data?.length || 1;
      return { completed, pending, total };
    },
  });

  // Fetch total revenue
  const { data: revenueData } = useQuery({
    queryKey: ["total-revenue"],
    queryFn: async () => {
      const { data: netData, error: netError } = await supabase
        .from("creator_earnings")
        .select("amount");
      if (netError) throw netError;
      const netTotal = netData?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;

      const { data: extractedData, error: extractedError } = await supabase
        .from("extracted_data")
        .select("value, raw_text")
        .eq("data_type", "earnings");
      if (extractedError) throw extractedError;

      const grossTotal =
        extractedData?.reduce((sum, item) => {
          if (item.raw_text?.toLowerCase().includes("gross")) {
            return sum + Number(item.value);
          }
          return sum;
        }, 0) || 0;

      const agencyEarnings = grossTotal > 0 ? grossTotal - netTotal : netTotal * commissionRate;

      return { netTotal, grossTotal, agencyEarnings };
    },
  });

  // Fetch employees count
  const { data: employeesCount } = useQuery({
    queryKey: ["employees-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("status", "Active");
      if (error) throw error;
      return count || 0;
    },
  });

  const formatCompactCurrency = (value: number) => formatCurrency(value, true);

  const grossRevenue = revenueData?.grossTotal || revenueData?.netTotal || 0;
  const netRevenue = revenueData?.netTotal || 0;
  const agencyEarnings = revenueData?.agencyEarnings || 0;

  const generateSparklineData = (base: number) => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: base * (0.6 + Math.random() * 0.8) * (1 + i * 0.05),
    }));
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-onlyfans-earnings");
      if (error) throw error;
      toast.success(`Sync complete: ${data.success} accounts synced`);
      queryClient.invalidateQueries({ queryKey: ["total-revenue"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  };

  // Metrics for Performance tab
  const revenueTarget = 100000;
  const performanceMetrics = [
    {
      title: "Total Revenue",
      value: formatCompactCurrency(grossRevenue),
      percentage: Math.min((grossRevenue / revenueTarget) * 100, 100),
      color: "hsl(217, 91%, 60%)",
      icon: DollarSign,
    },
    {
      title: "Agency Earnings",
      value: formatCompactCurrency(agencyEarnings),
      percentage: Math.min((agencyEarnings / (revenueTarget * 0.3)) * 100, 100),
      color: "hsl(142, 71%, 45%)",
      icon: TrendingUp,
    },
    {
      title: "Active Creators",
      value: String(creatorsData || 0),
      percentage: Math.min(((creatorsData || 0) / 10) * 100, 100),
      color: "hsl(330, 85%, 60%)",
      icon: Users,
    },
    {
      title: "Tasks Completed",
      value: String(tasksData?.completed || 0),
      percentage: tasksData ? (tasksData.completed / tasksData.total) * 100 : 0,
      color: "hsl(32, 95%, 55%)",
      icon: CheckSquare,
    },
  ];

  const renderOverviewTab = () => (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-foreground">{formatCompactCurrency(grossRevenue)}</p>
        </div>
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <p className="text-sm text-muted-foreground mb-1">Active Creators</p>
          <p className="text-2xl font-bold text-foreground">{creatorsData || 0}</p>
        </div>
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <p className="text-sm text-muted-foreground mb-1">Team Members</p>
          <p className="text-2xl font-bold text-foreground">{employeesCount || 0}</p>
        </div>
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <p className="text-sm text-muted-foreground mb-1">Tasks Completed</p>
          <p className="text-2xl font-bold text-foreground">{tasksData?.completed || 0}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>

      {/* Goals */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CreatorTaskProgress />
        </div>
        <div>
          <GoalProgress />
        </div>
      </div>
    </>
  );

  const renderBusinessTab = () => (
    <>
      {/* Main Content - Reference Layout */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <h2 className="text-lg font-semibold text-foreground mb-6">Financial Overview</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Mini Sparkline Cards */}
          <div className="space-y-8">
            <MiniSparklineCard
              title="Total Revenue"
              value={formatCompactCurrency(grossRevenue)}
              change="+12.5%"
              changeType="positive"
              data={generateSparklineData(grossRevenue || 10000)}
              color="hsl(var(--primary))"
              delay={150}
            />
            <MiniSparklineCard
              title="Agency Earnings"
              value={formatCompactCurrency(agencyEarnings)}
              change="+8.2%"
              changeType="positive"
              data={generateSparklineData(agencyEarnings || 3000)}
              color="hsl(var(--success))"
              delay={200}
            />
            <MiniSparklineCard
              title="Creator Net"
              value={formatCompactCurrency(netRevenue)}
              change="+15.3%"
              changeType="positive"
              data={generateSparklineData(netRevenue || 7000)}
              color="hsl(var(--accent))"
              delay={250}
            />
          </div>

          {/* Right Column - Main Chart */}
          <div className="lg:col-span-2 h-[350px]">
            <CreatorRevenueChart />
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <p className="text-sm text-muted-foreground mb-1">Active Creators</p>
          <p className="text-2xl font-bold text-foreground">{creatorsData || 0}</p>
        </div>
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: "350ms" }}>
          <p className="text-sm text-muted-foreground mb-1">Commission Rate</p>
          <p className="text-2xl font-bold text-foreground">{(commissionRate * 100).toFixed(0)}%</p>
        </div>
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <p className="text-sm text-muted-foreground mb-1">Avg Per Creator</p>
          <p className="text-2xl font-bold text-foreground">
            {formatCompactCurrency(creatorsData ? grossRevenue / creatorsData : 0)}
          </p>
        </div>
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: "450ms" }}>
          <p className="text-sm text-muted-foreground mb-1">Growth</p>
          <p className="text-2xl font-bold text-success">+12.5%</p>
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeed />
    </>
  );

  const renderPerformanceTab = () => (
    <>
      {/* Circular Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <CircularMetricCard key={metric.title} {...metric} delay={index * 100} />
        ))}
      </div>

      {/* Tasks Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <TasksCompletionChart />
        </div>
        <div>
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Task Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="text-xl font-bold text-success">{tasksData?.completed || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">In Progress</span>
                <span className="text-xl font-bold text-warning">{tasksData?.pending || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-foreground">{tasksData?.total || 0}</span>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="text-xl font-bold text-primary">
                    {tasksData ? Math.round((tasksData.completed / tasksData.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Progress */}
      <CreatorTaskProgress />

      {/* Goals */}
      <GoalProgress />
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {activeTab === "overview" && "Overview Dashboard"}
              {activeTab === "business" && "Business Analytics"}
              {activeTab === "performance" && "Performance Metrics"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker />
            <Button
              onClick={handleSyncNow}
              disabled={syncing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{syncing ? "Syncing..." : "Sync"}</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "business" && renderBusinessTab()}
        {activeTab === "performance" && renderPerformanceTab()}
      </div>
    </DashboardLayout>
  );
};

export default Index;
