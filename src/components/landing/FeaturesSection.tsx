import { Users, DollarSign, TrendingUp, Monitor, Shield, Lock, Zap, Calendar, MessageSquare, FileText, Smartphone, Globe, BarChart3, Clock } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";

const features = [
  { icon: Users, title: "Unified Team Management", description: "Creators, chatters, and employees in one system with role-based access and per-creator permissions." },
  { icon: DollarSign, title: "Revenue Intelligence", description: "Track gross earnings, net revenue, and commissions. Auto-sync OnlyFans data with breakdowns by subs, tips, PPV." },
  { icon: TrendingUp, title: "Chatter Analytics", description: "Messages sent, PPV conversions, and revenue per shift. Data-driven leaderboards and team optimization." },
  { icon: Monitor, title: "Cloud Browser Sessions", description: "Launch live OnlyFans, Fansly & Fanvue sessions in-browser. No downloads, pre-authenticated, persistent login states." },
  { icon: Shield, title: "Creator Portal", description: "Branded white-label portal for creators to view earnings, download content plans, and communicate with your team." },
  { icon: Lock, title: "Enterprise Security", description: "Row-level data isolation, per-employee permissions, encrypted sessions, and full audit trails." },
];

const moreFeatures = [
  { icon: Zap, title: "Smart Scheduling", description: "Auto-coverage detection and gap alerts." },
  { icon: Calendar, title: "Content Planning", description: "Visual calendar with multi-platform coordination." },
  { icon: MessageSquare, title: "Team Messaging", description: "Built-in chat with read receipts." },
  { icon: FileText, title: "Invoice & Payroll", description: "Automated commissions and bonuses." },
  { icon: Smartphone, title: "Mobile First", description: "Full access from any device, no app needed." },
  { icon: Globe, title: "100% Cloud", description: "Nothing to install, ever." },
  { icon: BarChart3, title: "Recruiting Pipeline", description: "Track applications and onboarding." },
  { icon: Clock, title: "Automated Workflows", description: "Daily summaries, reminders, auto-sync." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-24 px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="mb-14 sm:mb-20">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4">
            Everything you need
            <br />
            to <span className="gradient-text">scale.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
            40+ features built specifically for OnlyFans, Fansly & Fanvue agencies.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-12">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-300 group h-full">
                <feature.icon className="h-6 w-6 text-primary mb-5 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" staggerDelay={0.06}>
          {moreFeatures.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="p-4 rounded-xl border border-border bg-card/50 hover:border-primary/30 transition-colors h-full">
                <feature.icon className="h-4 w-4 text-primary mb-2" />
                <h4 className="font-medium text-foreground text-sm mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
