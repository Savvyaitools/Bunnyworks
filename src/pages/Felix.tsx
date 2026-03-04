import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Brain, Share2, MessagesSquare, Zap, ArrowRight, Sparkles, BarChart3, Shield, MessageCircle, TrendingUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { AgentStatusCard } from "@/components/agents/AgentStatusCard";
import { AlertsFeed } from "@/components/agents/AlertsFeed";
import { GoalProgress } from "@/components/agents/GoalProgress";
import { DailyBriefingCard } from "@/components/agents/DailyBriefingCard";
import { ActionLog } from "@/components/agents/ActionLog";
import { FelixChat } from "@/components/ai/FelixChat";
import { useAgentRuns } from "@/hooks/useAgentRuns";
import { useAgentAlerts } from "@/hooks/useAgentAlerts";
import { useAgentGoals } from "@/hooks/useAgentGoals";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { isToday } from "date-fns";
import { useState } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } },
};

interface AgentCardProps {
  name: string;
  role: string;
  description: string;
  icon: typeof Bot;
  features: string[];
  color: "primary" | "accent" | "success" | "warning";
  href: string;
  badge?: string;
}

function AgentCard({ name, role, description, icon: Icon, features, color, href, badge }: AgentCardProps) {
  const navigate = useNavigate();

  const colorMap = {
    primary: {
      icon: "bg-primary/12 text-primary",
      border: "hover:border-primary/30",
      glow: "group-hover:shadow-[0_8px_30px_hsl(var(--primary)/0.15)]",
      bar: "bg-primary",
      badge: "bg-primary/10 text-primary border-primary/20",
    },
    accent: {
      icon: "bg-accent/12 text-accent",
      border: "hover:border-accent/30",
      glow: "group-hover:shadow-[0_8px_30px_hsl(var(--accent)/0.15)]",
      bar: "bg-accent",
      badge: "bg-accent/10 text-accent border-accent/20",
    },
    success: {
      icon: "bg-success/12 text-success",
      border: "hover:border-success/30",
      glow: "group-hover:shadow-[0_8px_30px_hsl(var(--success)/0.15)]",
      bar: "bg-success",
      badge: "bg-success/10 text-success border-success/20",
    },
    warning: {
      icon: "bg-warning/12 text-warning",
      border: "hover:border-warning/30",
      glow: "group-hover:shadow-[0_8px_30px_hsl(var(--warning)/0.15)]",
      bar: "bg-warning",
      badge: "bg-warning/10 text-warning border-warning/20",
    },
  };

  const c = colorMap[color];

  return (
    <motion.div variants={itemVariants}>
      <Card
        className={`relative overflow-hidden cursor-pointer group transition-all duration-300 border-border ${c.border} ${c.glow}`}
        onClick={() => navigate(href)}
      >
        {/* Top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${c.bar} opacity-50`} />

        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.icon} transition-transform duration-300 group-hover:scale-110`}>
              <Icon className="h-6 w-6" />
            </div>
            {badge && (
              <Badge variant="outline" className={`text-[10px] font-semibold ${c.badge}`}>
                {badge}
              </Badge>
            )}
          </div>

          <h3 className="text-lg font-bold text-foreground mb-0.5">{name}</h3>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{role}</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>

          <div className="space-y-1.5 mb-5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 shrink-0 text-primary/60" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            <span>Open</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const agents: AgentCardProps[] = [
  {
    name: "Coach PBF",
    role: "AI Orchestrator",
    description: "Your strategic AI advisor. Ask questions about revenue, performance, trends, and get data-driven recommendations.",
    icon: Brain,
    features: ["Revenue & performance analytics", "Creator comparisons", "Strategic recommendations", "Trend forecasting"],
    color: "primary",
    href: "#chat",
    badge: "Core",
  },
  {
    name: "Tatum",
    role: "Social Media Manager",
    description: "Generate platform-optimized content, analyze trends, and build content calendars to grow your creators' social presence.",
    icon: Share2,
    features: ["Post generation & scheduling", "Trend scanning with web scraping", "Niche content research", "7-day content calendars"],
    color: "accent",
    href: "/of-ai/social-media",
    badge: "Growth",
  },
  {
    name: "Jodie",
    role: "AI Chatter Assistant",
    description: "Auto-replies to simple fan messages, flags complex ones for review, and learns your creators' tone and boundaries.",
    icon: MessagesSquare,
    features: ["Smart auto-replies", "Review queue for flagged messages", "Custom reply rules", "Confidence-based routing"],
    color: "success",
    href: "/of-ai/chatter",
    badge: "Revenue",
  },
];

export default function Felix() {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const { runs, actions, isLoading } = useAgentRuns();
  const { alerts, dismissAlert } = useAgentAlerts();
  const { goals, feedback, submitFeedback } = useAgentGoals();
  const [triggering, setTriggering] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const getLastRun = (type: string) => runs.find(r => r.agent_type === type);
  const getTodayActions = (type: string) =>
    actions.filter(a => {
      const run = runs.find(r => r.id === a.run_id);
      return run?.agent_type === type && isToday(new Date(a.created_at));
    }).length;

  const triggerAgent = async (agentType: string) => {
    setTriggering(agentType);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-orchestrator?agent=${agentType}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to trigger agent");
      toast.success(`${agentType} agent triggered successfully`);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["agent-runs"] });
        queryClient.invalidateQueries({ queryKey: ["agent-actions"] });
        queryClient.invalidateQueries({ queryKey: ["agent-alerts"] });
      }, 3000);
    } catch {
      toast.error("Failed to trigger agent");
    } finally {
      setTriggering(null);
    }
  };

  const handleAgentCardClick = (href: string) => {
    if (href === "#chat") {
      setShowChat(true);
    } else {
      navigate(href);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-[1400px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_4px_20px_hsl(var(--primary)/0.25)]">
              <Bot className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">OF AI</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Your AI-powered toolkit for agency management</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => triggerAgent("sentinel")} disabled={triggering !== null}>
              <Zap className="h-4 w-4 mr-1" />
              {triggering === "sentinel" ? "Running..." : "Run Sentinel"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => triggerAgent("herald")} disabled={triggering !== null}>
              <Zap className="h-4 w-4 mr-1" />
              {triggering === "herald" ? "Running..." : "Run Herald"}
            </Button>
          </div>
        </motion.div>

        {/* Agent Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {agents.map((agent) => (
            <div key={agent.name} onClick={() => handleAgentCardClick(agent.href)}>
              <AgentCard {...agent} href={agent.href} />
            </div>
          ))}
        </motion.div>

        {/* Chat Panel (toggleable) */}
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Coach PBF Chat
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
                Close
              </Button>
            </div>
            <FelixChat className="h-[500px]" />
          </motion.div>
        )}

        {/* Daily Briefing */}
        <DailyBriefingCard />

        {/* Background Agents Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" />
            Background Agents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AgentStatusCard agentType="sentinel" lastRun={getLastRun("sentinel")} actionsToday={getTodayActions("sentinel")} />
            <AgentStatusCard agentType="herald" lastRun={getLastRun("herald")} actionsToday={getTodayActions("herald")} />
            <AgentStatusCard agentType="scholar" lastRun={getLastRun("scholar")} actionsToday={getTodayActions("scholar")} />
          </div>
        </div>

        {/* Alerts & Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertsFeed alerts={alerts} onDismiss={(id) => dismissAlert.mutate(id)} />
          <GoalProgress goals={goals} />
        </div>

        {/* Action Log */}
        <ActionLog
          actions={actions}
          feedback={feedback}
          onFeedback={(actionId, rating) => submitFeedback.mutate({ actionId, rating })}
        />
      </div>
    </DashboardLayout>
  );
}
