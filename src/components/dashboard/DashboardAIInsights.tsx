import { memo } from "react";
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

// Single consolidated query instead of 4 separate ones
function useAIInsightsData(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard-ai-insights-consolidated", agencyId],
    enabled: Boolean(agencyId),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const [coachRes, tatumRes, jodieRes, runsRes] = await Promise.all([
        // Coach PBF
        Promise.all([
          supabase.from("coach_pbf_conversations").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!),
          supabase.from("coach_pbf_conversations").select("updated_at, title").eq("agency_id", agencyId!).order("updated_at", { ascending: false }).limit(1),
        ]),
        // Tatum
        Promise.all([
          supabase.from("tatum_conversations").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!),
          supabase.from("tatum_conversations").select("updated_at, title").eq("agency_id", agencyId!).order("updated_at", { ascending: false }).limit(1),
        ]),
        // Jodie
        Promise.all([
          supabase.from("ai_suggestions_log").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!),
          supabase.from("ai_suggestions_log").select("created_at, resulted_in_sale, sale_amount").eq("agency_id", agencyId!).order("created_at", { ascending: false }).limit(10),
        ]),
        // Agent runs
        Promise.all([
          supabase.from("agent_runs").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!).eq("status", "completed"),
          supabase.from("agent_runs").select("agent_type, completed_at, actions_taken").eq("agency_id", agencyId!).eq("status", "completed").order("completed_at", { ascending: false }).limit(1),
        ]),
      ]);

      const jodieSuggestions = jodieRes[1].data || [];
      const sales = jodieSuggestions.filter((r: any) => r.resulted_in_sale);

      return {
        coach: { count: coachRes[0].count || 0, lastActivity: coachRes[1].data?.[0]?.updated_at || null, lastTitle: coachRes[1].data?.[0]?.title || null },
        tatum: { count: tatumRes[0].count || 0, lastActivity: tatumRes[1].data?.[0]?.updated_at || null, lastTitle: tatumRes[1].data?.[0]?.title || null },
        jodie: { count: jodieRes[0].count || 0, lastActivity: jodieSuggestions[0]?.created_at || null, recentSales: sales.length },
        runs: { completedRuns: runsRes[0].count || 0, lastRun: runsRes[1].data?.[0] || null },
      };
    },
  });
}

export const DashboardAIInsights = memo(function DashboardAIInsights() {
  const { agency } = useAgency();
  const agencyId = agency?.id;
  const { data } = useAIInsightsData(agencyId);

  const agents: AgentInsight[] = [
    {
      name: "Coach PBF",
      icon: Brain,
      color: "text-primary",
      conversations: data?.coach.count || 0,
      recentActivity: data?.coach.lastActivity
        ? formatDistanceToNow(new Date(data.coach.lastActivity), { addSuffix: true })
        : null,
      href: "/coach-pbf",
      badge: data?.coach.lastTitle || undefined,
    },
    {
      name: "Tatum · Social",
      icon: Sparkles,
      color: "text-accent",
      conversations: data?.tatum.count || 0,
      recentActivity: data?.tatum.lastActivity
        ? formatDistanceToNow(new Date(data.tatum.lastActivity), { addSuffix: true })
        : null,
      href: "/coach-pbf",
      badge: data?.tatum.lastTitle || undefined,
    },
    {
      name: "Jodie · Chatter",
      icon: MessageSquare,
      color: "text-success",
      conversations: data?.jodie.count || 0,
      recentActivity: data?.jodie.lastActivity
        ? formatDistanceToNow(new Date(data.jodie.lastActivity), { addSuffix: true })
        : null,
      href: "/coach-pbf",
      badge: data?.jodie.recentSales
        ? `${data.jodie.recentSales} recent sales`
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
        {data?.runs && data.runs.completedRuns > 0 && (
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <Bot className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground font-medium">
                {data.runs.completedRuns} autonomous runs completed
              </p>
              {data.runs.lastRun?.completed_at && (
                <p className="text-[11px] text-muted-foreground">
                  Last: {data.runs.lastRun.agent_type} · {formatDistanceToNow(new Date(data.runs.lastRun.completed_at), { addSuffix: true })}
                </p>
              )}
            </div>
            <Zap className="h-3.5 w-3.5 text-primary/50" />
          </div>
        )}

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
});
