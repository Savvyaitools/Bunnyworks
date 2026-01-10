import { DollarSign, MessageSquare, Users, Clock, TrendingUp } from "lucide-react";
import { useTodayStats } from "@/hooks/useTodayStats";
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
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}

export function TodayStats() {
  const { data: stats, isLoading } = useTodayStats();

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
        title="This Month's Revenue"
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