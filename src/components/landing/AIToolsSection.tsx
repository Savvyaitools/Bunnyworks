import { Brain, MessageSquare, Mic, Image, Bot, Wand2 } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";

const aiAgents = [
  {
    icon: Brain,
    name: "Coach PBF",
    role: "Agency Intelligence Hub",
    description: "Your central AI orchestrator. Ask anything about your agency — revenue trends, chatter performance, creator KPIs — and get instant, data-backed answers with persistent conversation memory.",
    badge: "Core AI",
    color: "text-primary",
  },
  {
    icon: Wand2,
    name: "Tatum",
    role: "Social Media Automation",
    description: "Full social media content automation. Generates captions, hashtags, and 7-day content calendars tailored to each creator's brand voice and niche. One click to plan a week of content.",
    badge: "Automation",
    color: "text-accent",
  },
  {
    icon: Bot,
    name: "Izzy",
    role: "Smart Fan Messaging",
    description: "AI-powered hybrid chatting that auto-replies to fans, flags low-confidence messages for human review, and includes a response simulator. Learns from your team's best-performing messages.",
    badge: "Revenue Driver",
    color: "text-primary",
  },
];

const additionalAI = [
  { icon: MessageSquare, title: "AI Fan Messaging", description: "Engage 10x more fans without hiring additional chatters. Smart replies with intelligent escalation.", badge: "Enterprise" },
  { icon: Mic, title: "AI Voice Cloner", description: "Clone creator voices for personalized audio content. Fans can't tell the difference.", badge: "Enterprise" },
  { icon: Image, title: "AI Content Generator", description: "Generate platform-ready content at scale. Train on creator aesthetics for unlimited variations.", badge: "Enterprise" },
];

export function AIToolsSection() {
  return (
    <section id="tools" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Meet Your <span className="gradient-text">AI Agent Team</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Three specialized AI agents that work together as your agency's autonomous nervous system — monitoring, creating, and optimizing 24/7.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-10 sm:mb-16">
          {aiAgents.map((agent) => (
            <StaggerItem key={agent.name}>
              <div className="glass-card p-5 sm:p-8 relative overflow-hidden group hover:border-primary/50 transition-all h-full">
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <span className="text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-primary/20 text-primary">
                    {agent.badge}
                  </span>
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                  <agent.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${agent.color}`} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">{agent.name}</h3>
                <p className="text-xs sm:text-sm text-primary font-medium mb-2 sm:mb-3">{agent.role}</p>
                <p className="text-sm sm:text-base text-muted-foreground">{agent.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollReveal className="text-center mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-2xl font-semibold text-foreground">
            Enterprise <span className="gradient-text">AI Suite</span>
          </h3>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {additionalAI.map((tool) => (
            <StaggerItem key={tool.title}>
              <div className="glass-card p-4 sm:p-6 text-center h-full hover:border-primary/30 transition-all">
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                    {tool.badge}
                  </span>
                </div>
                <tool.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-3 sm:mb-4" />
                <h4 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">{tool.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">{tool.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
