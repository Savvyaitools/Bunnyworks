import { useQuery } from "@tanstack/react-query";
import { TrendingUp, DollarSign, Users, Briefcase } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAgency } from "@/hooks/useAgency";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/shared/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DashboardTasks } from "@/components/dashboard/DashboardTasks";
import { LiveActivityFeed } from "@/components/dashboard/LiveActivityFeed";
import { DashboardAIInsights } from "@/components/dashboard/DashboardAIInsights";
import { formatCurrency } from "@/lib/formatters";

export default function Index() {
  const { agency } = useAgency();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ["dashboard-mtd-revenue", agency?.id],
    enabled: Boolean(agency?.id),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("agency_id", agency!.id);
      const ids = (creators ?? []).map((c: { id: string }) => c.id);
      if (ids.length === 0) return { net: 0, agency: 0 };
      const { data: earnings } = await supabase
        .from("creator_earnings")
        .select("amount")
        .in("creator_id", ids)
        .gte("period_start", start.toISOString().slice(0, 10));
      const net = (earnings ?? []).reduce(
        (s: number, r: { amount: number | string | null }) =>
          s + Number(r.amount ?? 0),
        0,
      );
      return { net, agency: net * 0.5 };
    },
  });

  const monthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Welcome back{agency?.name ? <>, <span className="gradient-text">{agency.name}</span></> : null}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Overview for {monthLabel}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Net Revenue (MTD)"
            value={formatCurrency(revenue?.net ?? 0)}
            subtitle="All creators"
            icon={DollarSign}
            loading={revLoading}
          />
          <StatCard
            title="Agency Cut (MTD)"
            value={formatCurrency(revenue?.agency ?? 0)}
            subtitle="Estimated 50%"
            icon={TrendingUp}
            loading={revLoading}
          />
          <StatCard
            title="Active Creators"
            value={stats?.activeCreators ?? 0}
            subtitle="Currently signed"
            icon={Users}
            loading={statsLoading}
          />
          <StatCard
            title="Team Members"
            value={stats?.activeEmployees ?? 0}
            subtitle="Active staff"
            icon={Briefcase}
            loading={statsLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart />
          <LiveActivityFeed />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardTasks />
          <DashboardAIInsights />
        </div>
      </div>
    </DashboardLayout>
  );
}
