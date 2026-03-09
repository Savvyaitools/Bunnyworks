import { Brain, Wand2, Bot, MessageSquare, Mic, Image, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { motion } from "framer-motion";
import { FloatingParticles, AnimatedCounter } from "./AnimationPrimitives";

const aiAgents = [
  {
    icon: Brain,
    name: "Coach PBF",
    role: "Agency Intelligence Hub",
    description: "Your central AI orchestrator. Ask anything about your agency — revenue trends, chatter performance, creator KPIs — and get instant, data-backed answers with persistent conversation memory.",
    badge: "Core AI",
    color: "from-primary/20 to-primary/5",
    metric: "24/7",
    metricLabel: "Always On",
  },
  {
    icon: Wand2,
    name: "Tatum",
    role: "Social Media Automation",
    description: "Full social media content automation. Generates captions, hashtags, and 7-day content calendars tailored to each creator's brand voice and niche.",
    badge: "Automation",
    color: "from-accent/20 to-accent/5",
    metric: "10x",
    metricLabel: "Faster Content",
  },
  {
    icon: Bot,
    name: "Marylin Monroe",
    role: "Smart Fan Messaging",
    description: "AI-powered hybrid chatting that auto-replies to fans, flags low-confidence messages for human review, and includes a response simulator that learns from your best performers.",
    badge: "Revenue Driver",
    color: "from-success/20 to-success/5",
    metric: "3x",
    metricLabel: "More Revenue",
  },
];

const additionalAI = [
  { icon: MessageSquare, title: "AI Fan Messaging", description: "Engage 10x more fans without hiring additional chatters." },
  { icon: Mic, title: "AI Voice Cloner", description: "Clone creator voices for personalized audio content." },
  { icon: Image, title: "AI Content Generator", description: "Generate platform-ready content at scale." },
];

const ease = [0.25, 0.4, 0.25, 1] as const;

const agentVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.15, duration: 0.6, ease },
  }),
};

export function AIToolsSection() {
  return (
    <section id="tools" className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-t border-border overflow-hidden">
      <FloatingParticles count={15} />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <ScrollReveal className="mb-10 sm:mb-14 lg:mb-20">
          <motion.span
            className="inline-block text-[10px] sm:text-xs uppercase tracking-widest text-primary font-semibold mb-3 sm:mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            AI-Powered
          </motion.span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-3 sm:mb-4">
            Meet your{" "}
            <span className="gradient-text">AI team.</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl">
            Three specialized agents that work as your agency's autonomous nervous system — 24/7.
          </p>
        </ScrollReveal>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-10 sm:mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {aiAgents.map((agent, i) => (
            <motion.div
              key={agent.name}
              custom={i}
              variants={agentVariants}
              whileHover={{ y: -8, borderColor: "hsl(330 100% 64% / 0.4)" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="p-6 sm:p-8 lg:p-10 rounded-xl sm:rounded-2xl border border-border bg-card gloss glow-card group h-full relative cursor-default overflow-hidden"
            >
              {/* Animated gradient background */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
              />
              
              {/* Pulsing ring effect */}
              <motion.div
                className="absolute top-6 left-6 w-16 h-16 rounded-full border border-primary/10"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
              />
              
              <span className="absolute top-4 sm:top-6 right-4 sm:right-6 text-[10px] sm:text-xs font-medium px-2.5 sm:px-3 py-1 rounded-full bg-primary/10 text-primary">
                {agent.badge}
              </span>
              
              <motion.div
                whileHover={{ rotate: 10, scale: 1.15 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="relative z-10"
              >
                <agent.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-4 sm:mb-6" />
              </motion.div>
              <div className="relative z-10">
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">{agent.name}</h3>
                <p className="text-xs sm:text-sm text-primary font-medium mb-3 sm:mb-4">{agent.role}</p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">{agent.description}</p>
                
                {/* Metric badge */}
                <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                  <span className="text-lg sm:text-xl font-bold text-primary">{agent.metric}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{agent.metricLabel}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <ScrollReveal>
          <motion.div
            className="rounded-xl sm:rounded-2xl border border-border bg-card p-5 sm:p-8 lg:p-10"
            whileHover={{ borderColor: "hsl(330 100% 64% / 0.2)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Enterprise AI Suite
              </h3>
              <motion.span
                className="text-[10px] sm:text-xs text-primary font-medium px-3 py-1 rounded-full bg-primary/10"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Coming Soon
              </motion.span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {additionalAI.map((tool, i) => (
                <motion.div
                  key={tool.title}
                  className="flex items-start gap-3 sm:gap-4 group cursor-default"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  whileHover={{ x: 4 }}
                >
                  <motion.div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <tool.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </motion.div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-0.5 sm:mb-1">{tool.title}</h4>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}