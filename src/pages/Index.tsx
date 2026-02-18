import { useState } from "react";
import { RefreshCw, DollarSign, Users, UserCog, CheckSquare, TrendingUp, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout";
import { RevenueChart } from "@/components/dashboard";
import { LiveActivityFeed } from "@/components/dashboard/LiveActivityFeed";
import { DashboardTasks } from "@/components/dashboard/DashboardTasks";
import { RevenueSourceBreakdown } from "@/components/dashboard/RevenueSourceBreakdown";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { useAgency } from "@/hooks/useAgency";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();
  const { agency } = useAgency();
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

  // Fetch tasks data
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
      const total = data?.length || 0;
      return { completed, pending, total };
    },
  });

  // Fetch total revenue
  const { data: revenueData } = useQuery({
    queryKey: ["total-revenue", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("agency_id", agencyId);
      const creatorIds = creators?.map(c => c.id) || [];

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

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-onlyfans-earnings");
      if (error) throw error;
      toast.success(`Sync complete: ${data.success} accounts synced`);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Welcome back. Here's your agency at a glance.</p>
          </div>
          <Button
            onClick={handleSyncNow}
            disabled={syncing}
            variant="outline"
            size="sm"
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Syncing..." : "Sync Data"}</span>
          </Button>
        </div>

        {/* Key Metrics Row */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
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
            subtext={`${(commissionRate * 100).toFixed(0)}% commission`}
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
            subtext={tasksData ? `${tasksData.pending} tasks pending` : undefined}
            icon={UserCog}
            color="warning"
            href="/team"
          />
        </motion.div>

        {/* Revenue Chart + Revenue Breakdown */}
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

        {/* Tasks + Activity Feed */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DashboardTasks />
          <LiveActivityFeed />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
