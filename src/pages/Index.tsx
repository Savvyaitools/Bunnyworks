import { useState } from "react";
import { PushNotificationPrompt } from "@/components/shared/PushNotificationPrompt";
import { RefreshCw, Users, DollarSign, CheckSquare, TrendingUp, BarChart3, Eye, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { RevenueChart } from "@/components/dashboard";
import { TasksCompletionChart } from "@/components/dashboard/TasksCompletionChart";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { CreatorTaskProgress } from "@/components/dashboard/CreatorTaskProgress";
import { MiniSparklineCard } from "@/components/dashboard/MiniSparklineCard";
import { CreatorRevenueChart } from "@/components/dashboard/CreatorRevenueChart";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { CircularMetricCard } from "@/components/dashboard/CircularMetricCard";
import { ChatterLeaderboard } from "@/components/dashboard/ChatterLeaderboard";
import { LiveActivityFeed } from "@/components/dashboard/LiveActivityFeed";
import { TodayStats } from "@/components/dashboard/TodayStats";
import { EconomicValueCard } from "@/components/dashboard/EconomicValueCard";
import { RevenueSourceBreakdown } from "@/components/dashboard/RevenueSourceBreakdown";
import { CreatorPlatformCards } from "@/components/dashboard/CreatorPlatformCards";
import { FeatureGuide } from "@/components/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { useAgency } from "@/hooks/useAgency";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const dashboardGuideSteps = [
  {
    icon: <Eye className="h-4 w-4" />,
    title: "View Today's Stats",
    description: "Check revenue, messages sent, and active chatters at a glance",
  },
  {
    icon: <BarChart3 className="h-4 w-4" />,
    title: "Switch Dashboard Tabs",
    description: "Use Overview, Business, or Performance tabs for different insights",
  },
  {
    icon: <RefreshCw className="h-4 w-4" />,
    title: "Sync OnlyFans Data",
    description: "Click 'Sync' to refresh earnings and stats from connected accounts",
  },
  {
    icon: <Clock className="h-4 w-4" />,
    title: "Review Activity Feed",
    description: "See recent actions and events across your agency",
  },
];
const Index = () => {
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();
  const { agency } = useAgency();
  const commissionRate = agency?.commission_rate ?? 0.3;

  const agencyId = agency?.id;

  // Fetch creators count - scoped by agency
  const { data: creatorsData } = useQuery({
    queryKey: ["creators-count", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("creators")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agencyId)
        .eq("status", "Active");
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch tasks data - scoped by agency
  const { data: tasksData } = useQuery({
    queryKey: ["tasks-stats", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("status")
        .eq("agency_id", agencyId);
      if (error) throw error;
      const completed = data?.filter((t) => t.status === "Completed").length || 0;
      const pending = data?.filter((t) => t.status === "Pending" || t.status === "In Progress").length || 0;
      const total = data?.length || 1;
      return { completed, pending, total };
    },
  });

  // Fetch total revenue - scoped by agency's creators
  const { data: revenueData } = useQuery({
    queryKey: ["total-revenue", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      // Get creator IDs for this agency
      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("agency_id", agencyId);
      const creatorIds = creators?.map(c => c.id) || [];

      // Fetch earnings for agency's creators (with breakdown)
      let netTotal = 0;
      let tipsTotal = 0;
      let subsTotal = 0;
      let messagesTotal = 0;
      let referralsTotal = 0;
      if (creatorIds.length > 0) {
        const { data: earningsData, error: earningsError } = await supabase
          .from("creator_earnings")
          .select("amount, tips, subscriptions, messages_revenue, referrals")
          .in("creator_id", creatorIds);
        if (earningsError) throw earningsError;
        earningsData?.forEach(e => {
          netTotal += Number(e.amount) || 0;
          tipsTotal += Number(e.tips) || 0;
          subsTotal += Number(e.subscriptions) || 0;
          messagesTotal += Number(e.messages_revenue) || 0;
          referralsTotal += Number(e.referrals) || 0;
        });
      }

      // Fetch extracted data for agency's imports
      const { data: extractedData, error: extractedError } = await supabase
        .from("extracted_data")
        .select("value, raw_text, import_id")
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

      return { netTotal, grossTotal, agencyEarnings, tipsTotal, subsTotal, messagesTotal, referralsTotal };
    },
  });

  // Fetch employees count - scoped by agency
  const { data: employeesCount } = useQuery({
    queryKey: ["employees-count", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agencyId)
        .eq("status", "Active");
      if (error) throw error;
      return count || 0;
    },
  });

  const formatCompactCurrency = (value: number) => formatCurrency(value, true);

  const grossRevenue = revenueData?.grossTotal || revenueData?.netTotal || 0;
  const netRevenue = revenueData?.netTotal || 0;
  const agencyEarnings = revenueData?.agencyEarnings || 0;

  // Generate deterministic sparkline data based on base value (seeded, not random)
  const generateSparklineData = (base: number) => {
    return Array.from({ length: 12 }, (_, i) => {
      // Use a deterministic pattern instead of Math.random()
      const seed = ((i * 7 + 3) % 10) / 10; // 0.3, 0.0, 0.7, 0.4, 0.1, 0.8, 0.5, 0.2, 0.9, 0.6, 0.3, 0.0
      return {
        value: base * (0.6 + seed * 0.8) * (1 + i * 0.05),
      };
    });
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-onlyfans-earnings");
      if (error) throw error;
      toast.success(`Sync complete: ${data.success} accounts synced`);
      // Invalidate all revenue and stats queries
      queryClient.invalidateQueries({ queryKey: ["total-revenue", agencyId] });
      queryClient.invalidateQueries({ queryKey: ["today-ofm-stats", agencyId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats", agencyId] });
      queryClient.invalidateQueries({ queryKey: ["creators-count", agencyId] });
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
      {/* Push Notification Prompt */}
      <PushNotificationPrompt />

      {/* Feature Guide */}
      <FeatureGuide
        title="How to Use the Dashboard"
        description="Your command center for tracking agency performance and daily operations."
        steps={dashboardGuideSteps}
        tips={[
          "Check the dashboard first thing each day to spot trends",
          "Use date range picker to compare different time periods",
          "Set up goals to track progress toward monthly targets",
        ]}
        storageKey="dashboard"
      />

      {/* OFM Today Stats */}
      <TodayStats />

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <RevenueSourceBreakdown 
            grossRevenue={grossRevenue} 
            tips={revenueData?.tipsTotal || 0}
            subscriptions={revenueData?.subsTotal || 0}
            messagesRevenue={revenueData?.messagesTotal || 0}
            referrals={revenueData?.referralsTotal || 0}
            delay={200} 
          />
        </div>
      </div>

      {/* Economic Value & Leaderboard */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div>
          <EconomicValueCard 
            grossRevenue={grossRevenue}
            netRevenue={netRevenue}
            agencyEarnings={agencyEarnings}
            commissionRate={commissionRate}
            tips={revenueData?.tipsTotal || 0}
            subscriptions={revenueData?.subsTotal || 0}
            messagesRevenue={revenueData?.messagesTotal || 0}
            referrals={revenueData?.referralsTotal || 0}
            delay={100}
          />
        </div>
        <div className="xl:col-span-2">
          <ChatterLeaderboard />
        </div>
      </div>

      {/* Creator Platform Cards */}
      <CreatorPlatformCards />

      {/* Live Activity & Tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CreatorTaskProgress />
        </div>
        <div>
          <LiveActivityFeed />
        </div>
      </div>

      {/* Goals */}
      <GoalProgress />
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
              change={grossRevenue > 0 ? "Active" : "No data"}
              changeType={grossRevenue > 0 ? "positive" : "negative"}
              data={generateSparklineData(grossRevenue || 10000)}
              color="hsl(var(--primary))"
              delay={150}
            />
            <MiniSparklineCard
              title="Agency Earnings"
              value={formatCompactCurrency(agencyEarnings)}
              change={agencyEarnings > 0 ? "Active" : "No data"}
              changeType={agencyEarnings > 0 ? "positive" : "negative"}
              data={generateSparklineData(agencyEarnings || 3000)}
              color="hsl(var(--success))"
              delay={200}
            />
            <MiniSparklineCard
              title="Creator Net"
              value={formatCompactCurrency(netRevenue)}
              change={netRevenue > 0 ? "Active" : "No data"}
              changeType={netRevenue > 0 ? "positive" : "negative"}
              data={generateSparklineData(netRevenue || 7000)}
              color="hsl(var(--accent))"
              delay={250}
            />
          </div>

          {/* Right Column - Main Chart */}
          <div className="lg:col-span-2 h-[250px] lg:h-[350px]">
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
          <p className="text-2xl font-bold text-muted-foreground">—</p>
          <p className="text-xs text-muted-foreground mt-1">Sync to track</p>
        </div>
      </div>

      {/* Live Activity Feed */}
      <LiveActivityFeed />
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {activeTab === "overview" && "Overview Dashboard"}
              {activeTab === "business" && "Revenue Analytics"}
              {activeTab === "performance" && "Team Performance"}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
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
