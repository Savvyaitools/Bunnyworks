import { DollarSign, MessageSquare, Users, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
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
  index: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

function StatCard({ title, value, subValue, icon: Icon, trend, trendValue, color, index }: StatCardProps) {
  const colorClasses = {
    primary: "bg-primary/20 text-primary group-hover:bg-primary/30",
    success: "bg-success/20 text-success group-hover:bg-success/30",
    accent: "bg-accent/20 text-accent group-hover:bg-accent/30",
    warning: "bg-warning/20 text-warning group-hover:bg-warning/30",
  };

  const glowClasses = {
    primary: "group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]",
    success: "group-hover:shadow-[0_0_30px_hsl(var(--success)/0.2)]",
    accent: "group-hover:shadow-[0_0_30px_hsl(var(--accent)/0.2)]",
    warning: "group-hover:shadow-[0_0_30px_hsl(var(--warning)/0.2)]",
  };


  return (
    <motion.div 
      variants={cardVariants}
      whileHover={{ 
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      className={`glass-card p-5 group cursor-default transition-all duration-300 ${glowClasses[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <motion.p 
            className="text-2xl font-bold text-foreground"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 100 }}
          >
            {value}
          </motion.p>
          {subValue && (
            <motion.p 
              className="text-xs text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              {subValue}
            </motion.p>
          )}
        </div>
        <motion.div 
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${colorClasses[color]}`}
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
      {trend && trendValue && (
        <motion.div 
          className="mt-3"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + index * 0.1 }}
        >
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            trend === "up" 
              ? "bg-success/20 text-success border border-success/30" 
              : trend === "down"
              ? "bg-destructive/20 text-destructive border border-destructive/30"
              : "bg-muted text-muted-foreground border border-border"
          }`}>
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend === "down" ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {trendValue}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

export function TodayStats() {
  const { data: stats, isLoading } = useTodayStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <motion.div 
            key={i} 
            className="glass-card p-5 h-28"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          >
            <div className="h-4 w-24 bg-muted/30 rounded mb-2" />
            <div className="h-8 w-16 bg-muted/30 rounded" />
          </motion.div>
        ))}
      </div>
    );
  }

  const revenueTrend = stats?.revenueTrend || 0;

  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <StatCard
        title="This Month's Revenue"
        value={formatCurrency(stats?.todayRevenue || 0)}
        icon={DollarSign}
        color="success"
        trend={revenueTrend >= 0 ? "up" : "down"}
        trendValue={`${revenueTrend >= 0 ? "+" : ""}${revenueTrend}%`}
        index={0}
      />
      <StatCard
        title="Messages Sent"
        value={stats?.messagesSent || 0}
        subValue="Total today"
        icon={MessageSquare}
        color="primary"
        index={1}
      />
      <StatCard
        title="Active Chatters"
        value={stats?.activeChatters || 0}
        subValue={`${stats?.totalChattersToday || 0} worked today`}
        icon={Users}
        color="accent"
        index={2}
      />
      <StatCard
        title="Avg Response"
        value={`${stats?.avgResponseTime?.toFixed(1) || 0}m`}
        subValue="Response time"
        icon={Clock}
        color="warning"
        index={3}
      />
    </motion.div>
  );
}