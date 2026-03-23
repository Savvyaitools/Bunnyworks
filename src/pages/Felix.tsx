import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot, Brain, Share2, MessagesSquare, ArrowRight, Sparkles, UserCog,
  CheckCircle2, Clock, ListTodo, TrendingUp, MessageCircle, FileText,
  Activity, CircleDot, AlertCircle, ImageIcon, Mic
} from "lucide-react";
import { motion } from "framer-motion";
import { FelixChat } from "@/components/ai/FelixChat";
import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useCreators } from "@/hooks/useCreators";
import { useChatters } from "@/hooks/useChatters";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAgency } from "@/hooks/useAgency";
import { formatDistanceToNow, isToday, isThisWeek, isPast, parseISO } from "date-fns";

// ─── Animation variants ────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 20 } },
};

// ─── Agent Card ────────────────────────────────────────────────────
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

const colorMap = {
  primary: { icon: "bg-primary/12 text-primary", border: "hover:border-primary/30", glow: "group-hover:shadow-[0_8px_30px_hsl(var(--primary)/0.15)]", bar: "bg-primary", badge: "bg-primary/10 text-primary border-primary/20" },
  accent: { icon: "bg-accent/12 text-accent", border: "hover:border-accent/30", glow: "group-hover:shadow-[0_8px_30px_hsl(var(--accent)/0.15)]", bar: "bg-accent", badge: "bg-accent/10 text-accent border-accent/20" },
  success: { icon: "bg-success/12 text-success", border: "hover:border-success/30", glow: "group-hover:shadow-[0_8px_30px_hsl(var(--success)/0.15)]", bar: "bg-success", badge: "bg-success/10 text-success border-success/20" },
  warning: { icon: "bg-warning/12 text-warning", border: "hover:border-warning/30", glow: "group-hover:shadow-[0_8px_30px_hsl(var(--warning)/0.15)]", bar: "bg-warning", badge: "bg-warning/10 text-warning border-warning/20" },
};

function AgentCard({ name, role, description, icon: Icon, features, color, badge, onClick }: AgentCardProps & { onClick: () => void }) {
  const c = colorMap[color];
  return (
    <motion.div variants={itemVariants}>
      <Card className={`relative overflow-hidden cursor-pointer group transition-all duration-300 border-border ${c.border} ${c.glow} h-full`} onClick={onClick}>
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${c.bar} opacity-50`} />
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.icon} transition-transform duration-300 group-hover:scale-110`}>
              <Icon className="h-6 w-6" />
            </div>
            {badge && <Badge variant="outline" className={`text-[10px] font-semibold ${c.badge}`}>{badge}</Badge>}
          </div>
          <h3 className="text-lg font-bold text-foreground mb-0.5">{name}</h3>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{role}</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>
          <div className="space-y-1.5 mb-5 flex-1">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 shrink-0 text-primary/60" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:text-primary transition-colors mt-auto">
            <span>Open</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Agent config ──────────────────────────────────────────────────
const agents: AgentCardProps[] = [
  {
    name: "Coach PBF", role: "Personal Coach",
    description: "Your personal AI coach with full access to agency data. Get real-time advice on revenue, performance, and strategy.",
    icon: Brain, features: ["Revenue & performance insights", "Strategic recommendations", "Agency health monitoring", "Data-driven decision support"],
    color: "primary", href: "#chat", badge: "Coach",
  },
  {
    name: "Flick", role: "Agency Manager",
    description: "Your AI agency manager who keeps operations running. Ensures content plans are followed, tasks completed, and creator comms stay on track.",
    icon: UserCog, features: ["Creator communication management", "Content plan enforcement", "Task completion tracking", "Operational oversight"],
    color: "warning", href: "/of-ai/manager", badge: "Manager",
  },
  {
    name: "Tatum", role: "Social Media Manager",
    description: "Finds viral content tailored to each creator's persona. Researches trends, suggests content plans with reference links.",
    icon: Share2, features: ["Viral content discovery by persona", "Content plans with reference links", "Trend & niche research", "Platform-optimized calendars"],
    color: "accent", href: "/of-ai/social-media", badge: "Growth",
  },
  {
    name: "Marylin Monroe", role: "AI Chatter",
    description: "Expert fan engagement specialist. Chats with fans, shares content via OnlyFans messages, and handles PPV sends.",
    icon: MessagesSquare, features: ["Fan conversations & engagement", "Content sharing via messages", "PPV & upsell management", "Creator voice matching"],
    color: "success", href: "/of-ai/chatter", badge: "Revenue",
  },
  {
    name: "Naked Savvy", role: "Image Creation & Editing",
    description: "Generate and edit images using AI. Create stunning visuals, edit existing images, and produce content-ready media.",
    icon: ImageIcon, features: ["AI image generation", "Image editing & enhancement", "Multiple style options", "Quick content creation"],
    color: "warning", href: "/of-ai/image-generator", badge: "Creative",
  },
  {
    name: "Only Voice", role: "AI Voice Generator",
    description: "Clone and generate realistic AI voices for text-to-speech. Create custom voice content with natural-sounding speech.",
    icon: Mic, features: ["Voice cloning & TTS", "Natural speech generation", "Multiple voice styles", "Audio content creation"],
    color: "primary", href: "/of-ai/voice-generator", badge: "Audio",
  },
];

// ─── Quick Stats Bar ───────────────────────────────────────────────
function QuickStatsBar({ tasks, contentPlans, creators }: {
  tasks: any[];
  contentPlans: any[];
  creators: any[];
}) {
  const todayCompleted = tasks.filter(t => t.status === "Completed" && isToday(new Date(t.updated_at))).length;
  const activePlans = contentPlans.filter(p => p.status === "active" || p.board_column === "in_progress").length;
  const activeCreators = creators.filter(c => c.status === "Active").length;
  const overdueTasks = tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== "Completed").length;

  const stats = [
    { label: "Completed Today", value: todayCompleted, icon: CheckCircle2, color: "text-success" },
    { label: "Active Content Plans", value: activePlans, icon: FileText, color: "text-accent" },
    { label: "Active Creators", value: activeCreators, icon: TrendingUp, color: "text-primary" },
    { label: "Overdue Tasks", value: overdueTasks, icon: AlertCircle, color: overdueTasks > 0 ? "text-destructive" : "text-muted-foreground" },
  ];

  return (
    <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted/50 ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

// ─── Task Overview ─────────────────────────────────────────────────
function TaskOverview({ tasks }: { tasks: any[] }) {
  const recentCompleted = tasks
    .filter(t => t.status === "Completed")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4);

  const pending = tasks
    .filter(t => t.status === "In Progress" || t.status === "Review")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4);

  const upcoming = tasks
    .filter(t => t.status === "To Do" && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 4);

  const sections = [
    { title: "Recently Completed", items: recentCompleted, icon: CheckCircle2, emptyText: "No completed tasks yet", dotColor: "bg-success" },
    { title: "In Progress", items: pending, icon: Clock, emptyText: "No active tasks", dotColor: "bg-warning" },
    { title: "Upcoming", items: upcoming, icon: ListTodo, emptyText: "No upcoming tasks", dotColor: "bg-primary" },
  ];

  return (
    <motion.div variants={itemVariants}>
      <div className="flex items-center gap-2 mb-3">
        <UserCog className="h-5 w-5 text-warning" />
        <h2 className="text-lg font-semibold text-foreground">Task Overview</h2>
        <Badge variant="outline" className="text-[10px] ml-1">Flick</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Card key={section.title} className="border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <section.icon className="h-4 w-4" />
                {section.title}
                <Badge variant="secondary" className="ml-auto text-[10px]">{section.items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {section.items.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 py-3 text-center">{section.emptyText}</p>
              ) : (
                section.items.map((task) => (
                  <div key={task.id} className="flex items-start gap-2.5 py-1.5 group">
                    <CircleDot className={`h-3 w-3 mt-1 shrink-0 ${section.dotColor.replace("bg-", "text-")}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">{task.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {task.due_date
                          ? `Due ${formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}`
                          : formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                    {task.priority === "Urgent" && (
                      <Badge variant="destructive" className="text-[9px] px-1.5 py-0 shrink-0">Urgent</Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Agent Scorecards ──────────────────────────────────────────────
function AgentScorecards({ tasks, contentPlans }: { tasks: any[]; contentPlans: any[] }) {
  const thisWeekTasks = tasks.filter(t => isThisWeek(new Date(t.updated_at)));
  const thisWeekPlans = contentPlans.filter(p => isThisWeek(new Date(p.updated_at)));

  const scorecards = [
    {
      name: "Coach PBF", icon: Brain, color: "primary" as const,
      metrics: [
        { label: "Queries this week", value: "—" },
        { label: "Insights generated", value: "—" },
      ],
      status: "Ready",
    },
    {
      name: "Flick", icon: UserCog, color: "warning" as const,
      metrics: [
        { label: "Tasks tracked", value: thisWeekTasks.length },
        { label: "Completed this week", value: thisWeekTasks.filter(t => t.status === "Completed").length },
      ],
      status: thisWeekTasks.filter(t => t.status !== "Completed").length > 0 ? "Active" : "Idle",
    },
    {
      name: "Tatum", icon: Share2, color: "accent" as const,
      metrics: [
        { label: "Plans this week", value: thisWeekPlans.length },
        { label: "Active plans", value: contentPlans.filter(p => p.board_column !== "done").length },
      ],
      status: thisWeekPlans.length > 0 ? "Active" : "Idle",
    },
    {
      name: "Marylin Monroe", icon: MessagesSquare, color: "success" as const,
      metrics: [
        { label: "Messages handled", value: "—" },
        { label: "PPVs sent", value: "—" },
      ],
      status: "Ready",
    },
  ];

  return (
    <motion.div variants={itemVariants}>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Agent Performance</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {scorecards.map((agent) => {
          const c = colorMap[agent.color];
          return (
            <Card key={agent.name} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`p-1.5 rounded-lg ${c.icon}`}>
                    <agent.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{agent.name}</span>
                  <Badge variant="outline" className={`ml-auto text-[9px] ${agent.status === "Active" ? "border-success/30 text-success" : "border-muted-foreground/30 text-muted-foreground"}`}>
                    {agent.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {agent.metrics.map((m) => (
                    <div key={m.label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium text-foreground">{m.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Activity Feed ─────────────────────────────────────────────────
function AIActivityFeed({ tasks, contentPlans }: { tasks: any[]; contentPlans: any[] }) {
  const recentActivities = useMemo(() => {
    const activities: { id: string; agent: string; action: string; target: string; time: Date; color: string }[] = [];

    // Recent task completions → Felix
    tasks
      .filter(t => t.status === "Completed")
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .forEach(t => {
        activities.push({
          id: `task-${t.id}`, agent: "Flick", action: "completed task",
          target: t.title, time: new Date(t.updated_at), color: "warning",
        });
      });

    // Recent content plan updates → Tatum
    contentPlans
      .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .forEach((p: any) => {
        activities.push({
          id: `plan-${p.id}`, agent: "Tatum", action: "updated content plan",
          target: p.title, time: new Date(p.updated_at), color: "accent",
        });
      });

    return activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 8);
  }, [tasks, contentPlans]);

  const agentIcons: Record<string, typeof Bot> = { Felix: UserCog, Tatum: Share2, Jodie: MessagesSquare, "Coach PBF": Brain };

  return (
    <motion.div variants={itemVariants}>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-1">
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 text-center py-6">No recent activity</p>
          ) : (
            recentActivities.map((a) => {
              const Icon = agentIcons[a.agent] || Bot;
              const c = colorMap[a.color as keyof typeof colorMap] || colorMap.primary;
              return (
                <div key={a.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                  <div className={`p-1.5 rounded-md ${c.icon} shrink-0`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{a.agent}</span>
                      <span className="text-muted-foreground"> {a.action} </span>
                      <span className="font-medium truncate">{a.target}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(a.time, { addSuffix: true })}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function Felix() {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const { tasks } = useTasks();
  const { creators } = useCreators();
  const { agencyId } = useAgency();

  // Fetch content plans
  const { data: contentPlans = [] } = useQuery({
    queryKey: ["content-plans-hub", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data } = await supabase
        .from("content_plans")
        .select("id, title, status, board_column, updated_at, scheduled_date")
        .eq("agency_id", agencyId)
        .order("updated_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!agencyId,
  });

  const handleAgentClick = (agent: AgentCardProps) => {
    if (agent.href === "#chat") {
      setShowChat(true);
    } else {
      navigate(agent.href);
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-6 max-w-[1400px]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_4px_20px_hsl(var(--primary)/0.25)]">
              <Bot className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">OF AI</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Your AI-powered team for agency management</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <QuickStatsBar tasks={tasks} contentPlans={contentPlans} creators={creators} />

        {/* Agent Cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5" variants={containerVariants}>
          {agents.map((agent) => (
            <AgentCard key={agent.name} {...agent} onClick={() => handleAgentClick(agent)} />
          ))}
        </motion.div>

        {/* Chat Panel */}
        {showChat && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Coach PBF
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>Close</Button>
            </div>
            <FelixChat className="h-[500px]" />
          </motion.div>
        )}

        {/* Task Overview */}
        <TaskOverview tasks={tasks} />

        {/* Activity Feed + Agent Scorecards side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIActivityFeed tasks={tasks} contentPlans={contentPlans} />
          <AgentScorecards tasks={tasks} contentPlans={contentPlans} />
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
