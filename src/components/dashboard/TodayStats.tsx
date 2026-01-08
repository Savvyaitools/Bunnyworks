import { DollarSign, MessageSquare, Users, Clock, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: typeof DollarSign;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color: "primary" | "success" | "accent" | "warning";
  delay: number;
}

function StatCard({ title, value, subValue, icon: Icon, trend, trendValue, color, delay }: StatCardProps) {
  const colorClasses = {
    primary: "bg-primary/20 text-primary",
    success: "bg-success/20 text-success",
    accent: "bg-accent/20 text-accent",
    warning: "bg-warning/20 text-warning",
  };

  const trendColors = {
    up: "text-success",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <div 
      className="glass-card p-5 animate-fade-in hover:border-primary/20 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && trendValue && (
        <div className={`flex items-center gap-1 mt-3 text-sm ${trendColors[trend]}`}>
          <TrendingUp className={`h-4 w-4 ${trend === "down" ? "rotate-180" : ""}`} />
          <span>{trendValue}</span>
          <span className="text-muted-foreground">vs yesterday</span>
        </div>
      )}
    </div>
  );
}

export function TodayStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["today-ofm-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Today's revenue
      const { data: todayEarnings } = await supabase
        .from("creator_earnings")
        .select("amount")
        .gte("created_at", today.toISOString());
      
      const todayRevenue = todayEarnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Yesterday's revenue for comparison
      const { data: yesterdayEarnings } = await supabase
        .from("creator_earnings")
        .select("amount")
        .gte("created_at", yesterday.toISOString())
        .lt("created_at", today.toISOString());
      
      const yesterdayRevenue = yesterdayEarnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Messages sent today
      const { count: messageCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      // Active chatters (clocked in today)
      const { data: activeLogs } = await supabase
        .from("chatter_time_logs")
        .select("chatter_id")
        .gte("clock_in", today.toISOString())
        .is("clock_out", null);

      const uniqueActiveChatters = new Set(activeLogs?.map(l => l.chatter_id) || []).size;

      // Total chatters who worked today
      const { data: allTodayLogs } = await supabase
        .from("chatter_time_logs")
        .select("chatter_id")
        .gte("clock_in", today.toISOString());

      const totalChattersToday = new Set(allTodayLogs?.map(l => l.chatter_id) || []).size;

      // Calculate avg response time (mock for now - would need real OF API data)
      const avgResponseTime = 3.5; // minutes

      // Revenue trend
      const revenueTrend = yesterdayRevenue > 0 
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
        : "0";

      return {
        todayRevenue,
        revenueTrend: Number(revenueTrend),
        messagesSent: messageCount || 0,
        activeChatters: uniqueActiveChatters,
        totalChattersToday,
        avgResponseTime,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-5 h-28 animate-pulse bg-muted/10" />
        ))}
      </div>
    );
  }

  const revenueTrend = stats?.revenueTrend || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Today's Revenue"
        value={formatCurrency(stats?.todayRevenue || 0)}
        icon={DollarSign}
        color="success"
        trend={revenueTrend >= 0 ? "up" : "down"}
        trendValue={`${revenueTrend >= 0 ? "+" : ""}${revenueTrend}%`}
        delay={100}
      />
      <StatCard
        title="Messages Sent"
        value={stats?.messagesSent || 0}
        subValue="Total today"
        icon={MessageSquare}
        color="primary"
        delay={150}
      />
      <StatCard
        title="Active Chatters"
        value={stats?.activeChatters || 0}
        subValue={`${stats?.totalChattersToday || 0} worked today`}
        icon={Users}
        color="accent"
        delay={200}
      />
      <StatCard
        title="Avg Response"
        value={`${stats?.avgResponseTime?.toFixed(1) || 0}m`}
        subValue="Response time"
        icon={Clock}
        color="warning"
        delay={250}
      />
    </div>
  );
}
