import { Users, DollarSign, TrendingUp, Zap, Shield, Clock, MessageSquare, Calendar, FileText, BarChart3, Headphones } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";

const features = [
  { icon: Users, title: "Unified Team Management", description: "Manage creators, chatters, and employees in one system. Role-based access, skill grades, and performance targets—all consolidated for maximum efficiency." },
  { icon: DollarSign, title: "Real-Time Revenue Intelligence", description: "Track gross earnings, net revenue, and agency commissions automatically. Sync OnlyFans data and eliminate manual spreadsheet work forever." },
  { icon: TrendingUp, title: "Chatter Performance Analytics", description: "Monitor messages sent, PPV conversions, and revenue per shift. Identify top performers and optimize team assignments with data-driven insights." },
  { icon: Zap, title: "Smart Shift Scheduling", description: "Schedule chatter shifts with automatic coverage gap detection. Auto clock-out after shift end and track time against daily targets." },
  { icon: Shield, title: "White-Label Creator Portal", description: "Give each creator a branded portal to view earnings, download content plans, and communicate directly with your agency team." },
  { icon: Clock, title: "Automated Workflows", description: "Auto-calculate daily performance summaries, send follow-up reminders, and sync earnings—without lifting a finger." },
];

const additionalFeatures = [
  { icon: Calendar, title: "Content Planning", description: "Visual content calendar with scheduling, reference media uploads, and multi-platform coordination." },
  { icon: Headphones, title: "Integrated Messaging", description: "Built-in messaging between agency and creators with read receipts and conversation history." },
  { icon: FileText, title: "Invoice Management", description: "Generate, track, and manage invoices with automatic payment status updates and reminders." },
  { icon: BarChart3, title: "Shift & Time Tracking", description: "Monitor team shifts, clock-in/out times, and productivity analytics in real-time." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Everything You Need to <span className="gradient-text">Scale Your Agency</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Powerful features designed specifically for OnlyFans and Fansly agencies to manage, grow, and profit—all in one platform.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="glass-card p-4 sm:p-6 hover:border-primary/30 transition-all duration-300 group h-full">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="text-base sm:text-xl font-semibold text-foreground mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" staggerDelay={0.08}>
          {additionalFeatures.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="p-3 sm:p-4 rounded-lg border border-border bg-card/50 hover:border-primary/30 transition-colors h-full">
                <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1.5 sm:mb-2" />
                <h4 className="font-medium text-foreground text-xs sm:text-sm mb-0.5 sm:mb-1">{feature.title}</h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
