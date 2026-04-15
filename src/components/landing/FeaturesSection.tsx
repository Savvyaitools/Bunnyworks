import { Users, DollarSign, TrendingUp, Monitor, Shield, Lock, Zap, Calendar, MessageSquare, FileText, Smartphone, Globe, BarChart3, Clock } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { motion } from "framer-motion";

const features = [
  { icon: Users, title: "Unified Team Management", description: "Creators, chatters, and employees in one system with role-based access and per-creator permissions.", stat: "40+" , statLabel: "features" },
  { icon: DollarSign, title: "Revenue Intelligence", description: "Track gross earnings, net revenue, and commissions. Auto-sync OnlyFans data with breakdowns by subs, tips, PPV.", stat: "Real-time", statLabel: "syncing" },
  { icon: TrendingUp, title: "Chatter Analytics", description: "Messages sent, PPV conversions, and revenue per shift. Data-driven leaderboards and team optimization.", stat: "28%", statLabel: "avg lift" },
  { icon: Monitor, title: "Platform Access", description: "Launch live OnlyFans, Fansly & Fanvue sessions in-browser. No downloads, pre-authenticated, persistent login states.", stat: "Zero", statLabel: "downloads" },
  { icon: Shield, title: "Creator Portal", description: "Branded white-label portal for creators to view earnings, download content plans, and communicate with your team.", stat: "White", statLabel: "label" },
  { icon: Lock, title: "Enterprise Security", description: "Row-level data isolation, per-employee permissions, encrypted sessions, and full audit trails.", stat: "256-bit", statLabel: "encrypted" },
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

const ease = [0.25, 0.4, 0.25, 1] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.5, ease },
  }),
};

const miniCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.05, duration: 0.4, ease },
  }),
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="mb-10 sm:mb-14 lg:mb-20">
          <motion.span
            className="inline-block text-[10px] sm:text-xs uppercase tracking-widest text-primary font-semibold mb-3 sm:mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Platform Features
          </motion.span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-3 sm:mb-4">
            Everything you need
            <br />
            to <span className="gradient-text">scale.</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl">
            40+ features built specifically for OnlyFans, Fansly & Fanvue agencies.
          </p>
        </ScrollReveal>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-8 sm:mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={cardVariants}
              whileHover={{ y: -6, borderColor: "hsl(330 100% 64% / 0.3)" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-border bg-card gloss glow-card group h-full cursor-default relative overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4 sm:mb-5">
                  <motion.div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center"
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </motion.div>
                  <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-sm sm:text-base font-bold text-primary">{feature.stat}</div>
                    <div className="text-[10px] text-muted-foreground">{feature.statLabel}</div>
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
        >
          {moreFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={miniCardVariants}
              whileHover={{ y: -3, scale: 1.03, borderColor: "hsl(330 100% 64% / 0.2)" }}
              className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border bg-card/50 transition-colors h-full cursor-default group"
            >
              <motion.div
                whileHover={{ rotate: 10 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <feature.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mb-1.5 sm:mb-2 group-hover:text-primary transition-colors" />
              </motion.div>
              <h4 className="font-medium text-foreground text-xs sm:text-sm mb-0.5 sm:mb-1">{feature.title}</h4>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}