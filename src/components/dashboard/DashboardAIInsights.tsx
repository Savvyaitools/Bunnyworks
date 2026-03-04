import { motion } from "framer-motion";
import { Brain, MessageSquare, Sparkles, ArrowUpRight, Bot, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AgentInsight {
  name: string;
  icon: typeof Brain;
  color: string;
  conversations: number;
  recentActivity: string | null;
  href: string;
  badge?: string;
}

export function DashboardAIInsights() {
  const { agency } = useAgency();
  const agencyId = agency?.id;

  // Coach PBF conversations
  const { data: coachData } = useQuery({
    queryKey: ["dashboard-coach-insights", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      const { count } = await supabase
        .from("coach_pbf_conversations")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agencyId!);
      const { data: recent } = await supabase
        .from("coach_pbf_conversations")
        .select("updated_at, title")
        .eq("agency_id", agencyId!)
        .order("updated_at", { ascending: false })
        .limit(1);
      return {
        count: count || 0,
        lastActivity: recent?.[0]?.updated_at || null,
        lastTitle: recent?.[0]?.title || null,
      };
    },
  });

  // Tatum conversations
  const { data: tatumData } = useQuery({
    queryKey: ["dashboard-tatum-insights", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      const { count } = await supabase
        .from("tatum_conversations")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agencyId!);
      const { data: recent } = await supabase
        .from("tatum_conversations")
        .select("updated_at, title")
        .eq("agency_id", agencyId!)
        .order("updated_at", { ascending: false })
        .limit(1);
      return {
        count: count || 0,
        lastActivity: recent?.[0]?.updated_at || null,
        lastTitle: recent?.[0]?.title || null,
      };
    },
  });

  // Jodie suggestions log
  const { data: jodieData } = useQuery({
    queryKey: ["dashboard-jodie-insights", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      const { count } = await supabase
        .from("ai_suggestions_log")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agencyId!);
      const { data: recent } = await supabase
        .from("ai_suggestions_log")
        .select("created_at, suggestion_type, resulted_in_sale, sale_amount")
        .eq("agency_id", agencyId!)
        .order("created_at", { ascending: false })
        .limit(10);

      const sales = recent?.filter(r => r.resulted_in_sale) || [];
      const totalSales = sales.reduce((sum, s) => sum + (Number(s.sale_amount) || 0), 0);

      return {
        count: count || 0,
        lastActivity: recent?.[0]?.created_at || null,
        recentSales: sales.length,
        totalSalesAmount: totalSales,
      };
    },
  });

  // Agent runs
  const { data: agentRunsData } = useQuery({
    queryKey: ["dashboard-agent-runs", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      const { count } = await supabase
        .from("agent_runs")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agencyId!)
        .eq("status", "completed");
      const { data: recent } = await supabase
        .from("agent_runs")
        .select("agent_type, completed_at, actions_taken")
        .eq("agency_id", agencyId!)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1);
      return {
        completedRuns: count || 0,
        lastRun: recent?.[0] || null,
      };
    },
  });

  const agents: AgentInsight[] = [
    {
      name: "Coach PBF",
      icon: Brain,
      color: "text-primary",
      conversations: coachData?.count || 0,
      recentActivity: coachData?.lastActivity
        ? formatDistanceToNow(new Date(coachData.lastActivity), { addSuffix: true })
        : null,
      href: "/coach-pbf",
      badge: coachData?.lastTitle || undefined,
    },
    {
      name: "Tatum · Social",
      icon: Sparkles,
      color: "text-accent",
      conversations: tatumData?.count || 0,
      recentActivity: tatumData?.lastActivity
        ? formatDistanceToNow(new Date(tatumData.lastActivity), { addSuffix: true })
        : null,
      href: "/coach-pbf",
      badge: tatumData?.lastTitle || undefined,
    },
    {
      name: "Jodie · Chatter",
      icon: MessageSquare,
      color: "text-success",
      conversations: jodieData?.count || 0,
      recentActivity: jodieData?.lastActivity
        ? formatDistanceToNow(new Date(jodieData.lastActivity), { addSuffix: true })
        : null,
      href: "/coach-pbf",
      badge: jodieData?.recentSales
        ? `${jodieData.recentSales} recent sales`
        : undefined,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div className="section-header">
        <div>
          <h3 className="section-title">AI Agents</h3>
          <p className="section-subtitle">Your AI assistant suite</p>
        </div>
        <Link
          to="/coach-pbf"
          className="text-[11px] text-muted-foreground/60 hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Open Hub <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="glass-card p-4 space-y-4">
        {/* Agent run summary */}
        {agentRunsData && agentRunsData.completedRuns > 0 && (
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <Bot className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground font-medium">
                {agentRunsData.completedRuns} autonomous runs completed
              </p>
              {agentRunsData.lastRun?.completed_at && (
                <p className="text-[11px] text-muted-foreground">
                  Last: {agentRunsData.lastRun.agent_type} · {formatDistanceToNow(new Date(agentRunsData.lastRun.completed_at), { addSuffix: true })}
                </p>
              )}
            </div>
            <Zap className="h-3.5 w-3.5 text-primary/50" />
          </div>
        )}

        {/* Agent cards */}
        <div className="space-y-2">
          {agents.map((agent) => (
            <Link
              key={agent.name}
              to={agent.href}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                agent.color === "text-primary" && "bg-primary/10",
                agent.color === "text-accent" && "bg-accent/10",
                agent.color === "text-success" && "bg-success/10",
              )}>
                <agent.icon className={cn("h-4.5 w-4.5", agent.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{agent.name}</p>
                  <span className="text-[11px] text-muted-foreground">
                    {agent.conversations} {agent.conversations === 1 ? "session" : "sessions"}
                  </span>
                </div>
                {agent.badge ? (
                  <p className="text-xs text-muted-foreground truncate">{agent.badge}</p>
                ) : agent.recentActivity ? (
                  <p className="text-xs text-muted-foreground">Active {agent.recentActivity}</p>
                ) : (
                  <p className="text-xs text-muted-foreground/60">No activity yet</p>
                )}
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
