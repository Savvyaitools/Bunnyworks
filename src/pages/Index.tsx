import { DollarSign, Users, UserCog, TrendingUp, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout";
import { LiveActivityFeed } from "@/components/dashboard/LiveActivityFeed";
import { DashboardTasks } from "@/components/dashboard/DashboardTasks";
import { DashboardAIInsights } from "@/components/dashboard/DashboardAIInsights";
import { RevenueSourceBreakdown } from "@/components/dashboard/RevenueSourceBreakdown";
import { CreatorEarningsBreakdown } from "@/components/dashboard/CreatorEarningsBreakdown";
import { GettingStartedChecklist } from "@/components/dashboard/GettingStartedChecklist";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { useAgency } from "@/hooks/useAgency";
import { Link } from "react-router-dom";
import type { CreatorEarningsSummary } from "@/components/dashboard/CreatorEarningsBreakdown";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 120, damping: 18 },
  },
};

interface QuickStatProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: typeof DollarSign;
  color: "success" | "primary" | "accent" | "warning";
  href?: string;
}

function QuickStat({ title, value, subtext, icon: Icon, color, href }: QuickStatProps) {
  const colorMap = {
    success: { icon: "bg-success/15 text-success", glow: "group-hover:shadow-[0_0_24px_hsl(var(--success)/0.15)]" },
    primary: { icon: "bg-primary/15 text-primary", glow: "group-hover:shadow-[0_0_24px_hsl(var(--primary)/0.15)]" },
    accent: { icon: "bg-accent/15 text-accent", glow: "group-hover:shadow-[0_0_24px_hsl(var(--accent)/0.15)]" },
    warning: { icon: "bg-warning/15 text-warning", glow: "group-hover:shadow-[0_0_24px_hsl(var(--warning)/0.15)]" },
  };

  const content = (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      className={`glass-card p-5 group cursor-default transition-all duration-300 ${colorMap[color].glow}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-1.5">{subtext}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color].icon} transition-colors duration-300`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {href && (
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
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
}

const Index = () => {
  const { agency, isLoading: agencyLoading } = useAgency();
  const commissionRate = agency?.commission_rate ?? 0.3;
  const agencyId = agency?.id;

  // Fetch creators count
  const { data: creatorsCount } = useQuery({
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

  // Fetch total revenue with per-creator breakdown
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["total-revenue", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      // Fetch ALL creators for this agency (not just active)
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

      // Per-creator accumulator
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

      // Calculate agency earnings using per-creator commission rates
      let agencyEarningsTotal = 0;

      // Build per-creator summaries using each creator's own commission rate
      const creatorSummaries: CreatorEarningsSummary[] = creatorList.map(c => {
        const data = perCreator[c.id];
        const creatorCommission = Number((c as any).commission_rate) || commissionRate;
        // Net = creator's take. Gross = Net / (1 - commission)
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

      // Use extracted gross if available, otherwise use per-creator calculated totals
      const agencyEarnings = grossTotal > 0 ? grossTotal - netTotal : agencyEarningsTotal;
      const totalGross = grossTotal > 0 ? grossTotal : creatorSummaries.reduce((s, c) => s + c.grossRevenue, 0);

      return { netTotal, grossTotal: totalGross, agencyEarnings, tipsTotal, subsTotal, messagesTotal, referralsTotal, creatorSummaries };
    },
  });

  // Fetch employees count
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

  const grossRevenue = revenueData?.grossTotal || revenueData?.netTotal || 0;
  const netRevenue = revenueData?.netTotal || 0;
  const agencyEarnings = revenueData?.agencyEarnings || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's your agency at a glance.</p>
        </div>

        {/* Key Metrics Row */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {!agencyId ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass-card p-5">
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
                value={creatorsCount || 0}
                icon={Users}
                color="accent"
                href="/creators"
              />
              <QuickStat
                title="Team Members"
                value={employeesCount || 0}
                icon={UserCog}
                color="warning"
                href="/team"
              />
            </>
          )}
        </motion.div>

        {/* Creator Earnings + Revenue Breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
