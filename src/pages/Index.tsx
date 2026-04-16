import { DollarSign, Users, UserCog, TrendingUp, ArrowUpRight, Activity, BarChart3, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LiveActivityFeed } from "@/components/dashboard/LiveActivityFeed";
import { DashboardTasks } from "@/components/dashboard/DashboardTasks";
import { DashboardAIInsights } from "@/components/dashboard/DashboardAIInsights";
import { RevenueSourceBreakdown } from "@/components/dashboard/RevenueSourceBreakdown";
import { CreatorEarningsBreakdown } from "@/components/dashboard/CreatorEarningsBreakdown";
import { MonthlyComparison } from "@/components/dashboard/MonthlyComparison";
import { GettingStartedChecklist } from "@/components/dashboard/GettingStartedChecklist";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { useAgency } from "@/hooks/useAgency";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Link } from "react-router-dom";
import type { CreatorEarningsSummary } from "@/components/dashboard/CreatorEarningsBreakdown";
import { memo } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: "spring" as const, stiffness: 140, damping: 20 },
  },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface QuickStatProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: typeof DollarSign;
  color: "success" | "primary" | "accent" | "warning";
  href?: string;
  trend?: { value: string; positive: boolean };
}

const QuickStat = memo(function QuickStat({ title, value, subtext, icon: Icon, color, href, trend }: QuickStatProps) {
  const colorMap = {
    success: {
      icon: "bg-success/12 text-success",
      border: "hover:border-success/30",
      glow: "group-hover:shadow-[0_4px_20px_hsl(var(--success)/0.12)]",
      bar: "bg-success",
    },
    primary: {
      icon: "bg-primary/12 text-primary",
      border: "hover:border-primary/30",
      glow: "group-hover:shadow-[0_4px_20px_hsl(var(--primary)/0.12)]",
      bar: "bg-primary",
    },
    accent: {
      icon: "bg-accent/12 text-accent",
      border: "hover:border-accent/30",
      glow: "group-hover:shadow-[0_4px_20px_hsl(var(--accent)/0.12)]",
      bar: "bg-accent",
    },
    warning: {
      icon: "bg-warning/12 text-warning",
      border: "hover:border-warning/30",
      glow: "group-hover:shadow-[0_4px_20px_hsl(var(--warning)/0.12)]",
      bar: "bg-warning",
    },
  };

  const content = (
    <motion.div
      variants={itemVariants}
      className={`relative overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 group cursor-default transition-all duration-300 ${colorMap[color].border} ${colorMap[color].glow}`}
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${colorMap[color].bar} opacity-40`} />
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{title}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight leading-none">{value}</p>
          <div className="flex items-center gap-2 mt-2">
            {subtext && (
              <p className="text-xs text-muted-foreground">{subtext}</p>
            )}
            {trend && (
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${trend.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {trend.positive ? "↑" : "↓"} {trend.value}
              </span>
            )}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color].icon} transition-all duration-300 group-hover:scale-110`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      {href && (
        <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
          <span>View details</span>
          <ArrowUpRight className="h-3 w-3" />
        </div>
      )}
    </motion.div>
  );

  if (href) {
    return <Link to={href} className="block">{content}</Link>;
  }
  return content;
});

const Index = () => {
  const { agency, isLoading: agencyLoading } = useAgency();
  const commissionRate = agency?.commission_rate ?? 0.3;
  const agencyId = agency?.id;

  // Use consolidated dashboard stats for counts
  const { data: dashStats } = useDashboardStats();

  // Fetch total revenue with per-creator breakdown
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["total-revenue", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      const { data: creators } = await supabase
        .from("creators")
        .select("id, name, commission_rate")
        .eq("agency_id", agencyId!);
      const creatorList = creators || [];
      const creatorIds = creatorList.map(c => c.id);

      let netTotal = 0;
      let tipsTotal = 0;
      let subsTotal = 0;
      let messagesTotal = 0;
      let referralsTotal = 0;

      const perCreator: Record<string, { net: number; gross: number }> = {};
      creatorList.forEach(c => {
        perCreator[c.id] = { net: 0, gross: 0 };
      });

      if (creatorIds.length > 0) {
        const { data: earningsData, error: earningsError } = await supabase
          .from("creator_earnings")
          .select("creator_id, amount, tips, subscriptions, messages_revenue, referrals")
          .in("creator_id", creatorIds);
        if (earningsError) throw earningsError;
        earningsData?.forEach(e => {
          const amt = Number(e.amount) || 0;
          netTotal += amt;
          tipsTotal += Number(e.tips) || 0;
          subsTotal += Number(e.subscriptions) || 0;
          messagesTotal += Number(e.messages_revenue) || 0;
          referralsTotal += Number(e.referrals) || 0;
          if (perCreator[e.creator_id]) {
            perCreator[e.creator_id].net += amt;
          }
        });
      }

      // Scope extracted_data to this agency's creators only (supplementary – fail gracefully)
      let grossData: { value: number; raw_text: string | null }[] = [];
      if (creatorIds.length > 0) {
        try {
          const extractedQuery = supabase
            .from("extracted_data" as any)
            .select("value, raw_text, import_id")
            .eq("data_type", "earnings");
          const { data: extractedData } = await extractedQuery;
          grossData = (extractedData || []) as any[];
        } catch (e) {
          console.warn("extracted_data query failed, using net-only fallback:", e);
        }
      }

      const grossTotal =
        grossData.reduce((sum, item) => {
          if (item.raw_text?.toLowerCase().includes("gross")) {
            return sum + Number(item.value);
          }
          return sum;
        }, 0);

      let agencyEarningsTotal = 0;

      const creatorSummaries: CreatorEarningsSummary[] = creatorList.map(c => {
        const data = perCreator[c.id];
        const creatorCommission = Number((c as any).commission_rate) || commissionRate;
        const creatorGross = data.net > 0 ? data.net / (1 - creatorCommission) : 0;
        const creatorAgency = creatorGross - data.net;
        agencyEarningsTotal += creatorAgency;
        return {
          creatorId: c.id,
          name: c.name,
          grossRevenue: creatorGross,
          netRevenue: data.net,
          agencyEarnings: creatorAgency,
          commissionRate: creatorCommission,
        };
      });

      const agencyEarnings = grossTotal > 0 ? grossTotal - netTotal : agencyEarningsTotal;
      const totalGross = grossTotal > 0 ? grossTotal : creatorSummaries.reduce((s, c) => s + c.grossRevenue, 0);

      return { netTotal, grossTotal: totalGross, agencyEarnings, tipsTotal, subsTotal, messagesTotal, referralsTotal, creatorSummaries };
    },
  });


  const grossRevenue = revenueData?.grossTotal || revenueData?.netTotal || 0;
  const netRevenue = revenueData?.netTotal || 0;
  const agencyEarnings = revenueData?.agencyEarnings || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        {/* Header with greeting */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {getGreeting()}
              {agency?.name ? `, ${agency.name}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Here's an overview of your agency performance
            </p>
          </div>
          {grossRevenue > 0 && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-success" />
                <span>Total: <span className="text-foreground font-semibold">{formatCurrency(grossRevenue)}</span></span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span>Agency: <span className="text-foreground font-semibold">{formatCurrency(agencyEarnings)}</span></span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Getting Started Checklist */}
        <GettingStartedChecklist />

        {/* Key Metrics Row */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {!agencyId ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-xl border border-border bg-card/60 p-5">
                  <Skeleton className="h-3 w-20 mb-3" />
                  <Skeleton className="h-7 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </>
          ) : (
            <>
              <QuickStat
                title="Total Revenue"
                value={formatCurrency(grossRevenue)}
                subtext={`Net: ${formatCurrency(netRevenue)}`}
                icon={DollarSign}
                color="success"
              />
              <QuickStat
                title="Agency Earnings"
                value={formatCurrency(agencyEarnings)}
                icon={TrendingUp}
                color="primary"
              />
              <QuickStat
                title="Active Creators"
                value={dashStats?.activeCreators || 0}
                icon={Users}
                color="accent"
                href="/creators"
              />
              <QuickStat
                title="Team Members"
                value={dashStats?.activeEmployees || 0}
                icon={UserCog}
                color="warning"
                href="/team"
              />
            </>
          )}
        </motion.div>

        {/* Monthly comparison (calendar months) */}
        <MonthlyComparison />

        {/* Creator Earnings + Revenue Breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2">
            <CreatorEarningsBreakdown
              creators={revenueData?.creatorSummaries || []}
              commissionRate={commissionRate}
              loading={revenueLoading}
              delay={200}
            />
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

        {/* Tasks + AI Insights */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <DashboardTasks />
          <DashboardAIInsights />
        </div>

        {/* Activity Feed */}
        <LiveActivityFeed />
      </div>
    </DashboardLayout>
  );
};

export default Index;
