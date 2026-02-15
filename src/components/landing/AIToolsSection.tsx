import { Brain, Wand2, Bot, MessageSquare, Mic, Image } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";

const aiAgents = [
  {
    icon: Brain,
    name: "Coach PBF",
    role: "Agency Intelligence Hub",
    description: "Your central AI orchestrator. Ask anything about your agency — revenue trends, chatter performance, creator KPIs — and get instant, data-backed answers with persistent conversation memory.",
    badge: "Core AI",
  },
  {
    icon: Wand2,
    name: "Tatum",
    role: "Social Media Automation",
    description: "Full social media content automation. Generates captions, hashtags, and 7-day content calendars tailored to each creator's brand voice and niche.",
    badge: "Automation",
  },
  {
    icon: Bot,
    name: "Izzy",
    role: "Smart Fan Messaging",
    description: "AI-powered hybrid chatting that auto-replies to fans, flags low-confidence messages for human review, and includes a response simulator that learns from your best performers.",
    badge: "Revenue Driver",
  },
];

const additionalAI = [
  { icon: MessageSquare, title: "AI Fan Messaging", description: "Engage 10x more fans without hiring additional chatters." },
  { icon: Mic, title: "AI Voice Cloner", description: "Clone creator voices for personalized audio content." },
  { icon: Image, title: "AI Content Generator", description: "Generate platform-ready content at scale." },
];

export function AIToolsSection() {
  return (
    <section id="tools" className="py-16 sm:py-24 px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="mb-14 sm:mb-20">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4">
            Meet your{" "}
            <span className="gradient-text">AI team.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
            Three specialized agents that work as your agency's autonomous nervous system — 24/7.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 mb-16">
          {aiAgents.map((agent) => (
            <StaggerItem key={agent.name}>
              <div className="p-8 sm:p-10 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all duration-300 group h-full relative">
                <span className="absolute top-6 right-6 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                  {agent.badge}
                </span>
                <agent.icon className="h-8 w-8 text-primary mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold text-foreground mb-1">{agent.name}</h3>
                <p className="text-sm text-primary font-medium mb-4">{agent.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{agent.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollReveal>
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-10">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Enterprise AI Suite
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {additionalAI.map((tool) => (
                <div key={tool.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <tool.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">{tool.title}</h4>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
