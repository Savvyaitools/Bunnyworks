import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Brain, Share2, MessagesSquare, ArrowRight, Sparkles, UserCog } from "lucide-react";
import { motion } from "framer-motion";
import { FelixChat } from "@/components/ai/FelixChat";
import { useState } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 20 } },
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

function AgentCard({ name, role, description, icon: Icon, features, color, href, badge, onClick }: AgentCardProps & { onClick: () => void }) {
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
        className={`relative overflow-hidden cursor-pointer group transition-all duration-300 border-border ${c.border} ${c.glow} h-full`}
        onClick={onClick}
      >
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${c.bar} opacity-50`} />
        <CardContent className="p-6 flex flex-col h-full">
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

const agents: AgentCardProps[] = [
  {
    name: "Coach PBF",
    role: "Personal Coach",
    description: "Your personal AI coach with full access to agency data. Get real-time advice on revenue, performance, and strategy. Ask anything about your agency and receive data-driven guidance.",
    icon: Brain,
    features: ["Revenue & performance insights", "Strategic recommendations", "Agency health monitoring", "Data-driven decision support"],
    color: "primary",
    href: "#chat",
    badge: "Coach",
  },
  {
    name: "Felix",
    role: "Agency Manager",
    description: "Your AI agency manager who keeps operations running smoothly. Felix ensures content plans are followed, tasks are completed on time, and creator communications stay on track.",
    icon: UserCog,
    features: ["Creator communication management", "Content plan enforcement", "Task completion tracking", "Operational oversight"],
    color: "warning",
    href: "/of-ai/manager",
    badge: "Manager",
  },
  {
    name: "Tatum",
    role: "Social Media Manager",
    description: "Finds viral content tailored to each creator's persona. Tatum researches trends, suggests content plans with reference links, and builds calendars that drive growth.",
    icon: Share2,
    features: ["Viral content discovery by persona", "Content plans with reference links", "Trend & niche research", "Platform-optimized calendars"],
    color: "accent",
    href: "/of-ai/social-media",
    badge: "Growth",
  },
  {
    name: "Jodie",
    role: "AI Chatter",
    description: "Expert fan engagement specialist. Jodie chats with fans, shares content via OnlyFans messages, handles PPV sends, and maintains each creator's unique voice and boundaries.",
    icon: MessagesSquare,
    features: ["Fan conversations & engagement", "Content sharing via messages", "PPV & upsell management", "Creator voice & tone matching"],
    color: "success",
    href: "/of-ai/chatter",
    badge: "Revenue",
  },
];

export default function Felix() {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);

  const handleAgentClick = (agent: AgentCardProps) => {
    if (agent.href === "#chat") {
      setShowChat(true);
    } else {
      navigate(agent.href);
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
              <p className="text-sm text-muted-foreground mt-0.5">Your AI-powered team for agency management</p>
            </div>
          </div>
        </motion.div>

        {/* Agent Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {agents.map((agent) => (
            <AgentCard key={agent.name} {...agent} onClick={() => handleAgentClick(agent)} />
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
                Coach PBF
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
                Close
              </Button>
            </div>
            <FelixChat className="h-[500px]" />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
