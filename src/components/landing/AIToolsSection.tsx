import { MessageSquare, Mic, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";

const secondaryTools = [
  { icon: MessageSquare, title: "AI-Powered Fan Messaging", description: "Engage 10x more fans without hiring additional chatters. Smart replies, 24/7 coverage, and intelligent escalation built-in.", badge: "Enterprise", link: "/tools/chatting" },
  { icon: Mic, title: "AI Voice Cloner", description: "Clone creator voices for personalized audio content. Generate authentic voice messages fans can't distinguish from real recordings.", badge: "Enterprise", link: "/tools/voice-cloner" },
  { icon: Image, title: "AI Content Generator", description: "Generate platform-ready content at scale. Train AI on creator aesthetics and produce unlimited variations without photoshoots.", badge: "Enterprise", link: "/tools/content-generator" },
];

export function AIToolsSection() {
  return (
    <section id="tools" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Powerful <span className="gradient-text">AI Tools</span> for Agency Growth
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Creator OS includes enterprise-grade AI tools to supercharge your fan engagement and content production.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {secondaryTools.map((tool) => (
            <StaggerItem key={tool.title}>
              <Link to={tool.link} className="glass-card p-5 sm:p-8 text-center relative overflow-hidden group hover:border-primary/50 transition-all cursor-pointer block h-full">
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <span className={`text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${tool.badge === "Included" ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"}`}>
                    {tool.badge}
                  </span>
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                  <tool.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-base sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">{tool.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">{tool.description}</p>
                <span className="text-primary text-xs sm:text-sm font-medium group-hover:underline">Learn more →</span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
