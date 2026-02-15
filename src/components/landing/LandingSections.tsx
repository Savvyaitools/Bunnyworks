import { Star, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { motion } from "framer-motion";

const testimonials = [
  { name: "Marcus T.", role: "Agency Owner, 35+ Creators", content: "Before Creator OS, I was spending 15 hours a week on spreadsheets. Now it's all automated. I've scaled from 15 to 35 creators without adding a single admin hire.", rating: 5, highlight: "15 hrs/week saved" },
  { name: "Elena R.", role: "Operations Manager", content: "The unified team management is a game-changer. Our PPV conversion rate increased 28% once we could actually see who was performing.", rating: 5, highlight: "28% PPV increase" },
  { name: "David K.", role: "Agency Founder, Top 0.1%", content: "We tried 4 different tools before Creator OS. The shift scheduling with performance tracking is exactly what OFM agencies need.", rating: 5, highlight: "4x faster onboarding" },
];

const ease = [0.25, 0.4, 0.25, 1] as const;

const testimonialVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.12, duration: 0.5, ease },
  }),
};

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="mb-10 sm:mb-14 lg:mb-20">
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-3 sm:mb-4">
            Trusted by <span className="gradient-text">leading agencies.</span>
          </h2>
        </ScrollReveal>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              variants={testimonialVariants}
              whileHover={{ y: -4 }}
              className="p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-border bg-card h-full flex flex-col cursor-default"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + j * 0.08, type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-primary text-primary" />
                    </motion.div>
                  ))}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-primary bg-primary/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">{t.highlight}</span>
              </div>
              <p className="text-xs sm:text-sm lg:text-base text-foreground mb-4 sm:mb-6 leading-relaxed flex-1">"{t.content}"</p>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-foreground">{t.name}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: ease },
  }),
};

export function HowItWorksSection() {
  const steps = [
    { step: "01", title: "Import Your Roster", description: "Add creators and team members in minutes. Connect OnlyFans accounts for automatic revenue syncing." },
    { step: "02", title: "Assign & Schedule", description: "Assign chatters to creators, set targets, and schedule shifts with visual roster builder." },
    { step: "03", title: "Track & Optimize", description: "Monitor real-time dashboards. Get actionable insights on performers and areas for improvement." },
  ];

  return (
    <section id="how-it-works" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="mb-10 sm:mb-14 lg:mb-20">
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-3 sm:mb-4">
            Get started in{" "}
            <span className="gradient-text">minutes.</span>
          </h2>
        </ScrollReveal>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              custom={i}
              variants={stepVariants}
              whileHover={{ y: -4 }}
              className="p-6 sm:p-8 lg:p-10 rounded-xl sm:rounded-2xl border border-border bg-card gloss glow-card h-full relative overflow-hidden cursor-default group"
            >
              <motion.span
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors block mb-4 sm:mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 + 0.2, type: "spring", stiffness: 200 }}
              >
                {item.step}
              </motion.span>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">{item.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="mb-10 sm:mb-14 lg:mb-20">
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-3 sm:mb-4">
            Simple{" "}
            <span className="gradient-text">pricing.</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl">
            Scale as you grow. No hidden fees.
          </p>
        </ScrollReveal>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <PricingCard i={0} name="Core" price="$69" period="/month" desc="Solo managers & small agencies" features={["Up to 2 creators", "3 team members", "Basic shift scheduling", "50 GB Content Vault"]} ctaLabel="Get Started" highlight={false} />
          <PricingCard i={1} name="Scale" price="$129" period="/month" desc="Real agencies running teams" features={["Up to 6 creators", "15 team members", "PPV & revenue analytics", "200 GB Content Vault"]} ctaLabel="Start Free Trial" highlight={true} badge="Popular" />
          <PricingCard i={2} name="Pro" price="$249" period="/month" desc="AI-powered growth" features={["Up to 15 creators", "40 team members", "AI performance insights", "600 GB Content Vault"]} ctaLabel="Start Free Trial" highlight={false} />
          <PricingCard i={3} name="Enterprise" price="$399+" period="custom" desc="Large & multi-brand operators" features={["Unlimited everything", "AI Chatting + Voice Cloner", "White-label experience", "1 TB+ Vault + SLA"]} ctaLabel="Contact Sales" highlight={false} isEnterprise />
        </motion.div>
      </div>
    </section>
  );
}

const pricingVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: ease },
  }),
};

function PricingCard({ name, price, period, desc, features, ctaLabel, highlight, badge, isEnterprise, i }: {
  name: string; price: string; period: string; desc: string; features: string[]; ctaLabel: string; highlight: boolean; badge?: string; isEnterprise?: boolean; i: number;
}) {
  return (
    <motion.div
      custom={i}
      variants={pricingVariants}
      whileHover={{ y: -6, borderColor: highlight ? "hsl(330 100% 64% / 0.6)" : "hsl(330 100% 64% / 0.3)" }}
      className={`p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border flex flex-col h-full cursor-default gloss ${highlight ? "border-primary bg-card relative glow-lg" : "border-border bg-card glow-card"}`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] sm:text-xs font-medium px-3 sm:px-4 py-0.5 sm:py-1 rounded-full">{badge}</div>
      )}
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">{name}</h3>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl sm:text-3xl font-bold text-foreground">{price}</span>
        <span className="text-xs sm:text-sm text-muted-foreground">{period}</span>
      </div>
      <p className="text-[10px] sm:text-xs text-muted-foreground mb-4 sm:mb-6">{desc}</p>
      <ul className="space-y-2 sm:space-y-2.5 mb-6 sm:mb-8 flex-1">
        {features.map((item) => (
          <li key={item} className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {isEnterprise ? (
        <Button variant="outline" className="w-full rounded-full mt-auto text-xs sm:text-sm">{ctaLabel}</Button>
      ) : (
        <Link to="/auth" className="mt-auto">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className={`w-full rounded-full text-xs sm:text-sm ${highlight ? "bg-primary hover:bg-primary/90" : ""}`} variant={highlight ? "default" : "outline"}>{ctaLabel}</Button>
          </motion.div>
        </Link>
      )}
    </motion.div>
  );
}

export function FinalCTASection() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <motion.div
            className="p-8 sm:p-12 lg:p-16 rounded-xl sm:rounded-2xl border border-border bg-card relative overflow-hidden text-center"
            whileHover={{ borderColor: "hsl(330 100% 64% / 0.3)" }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
              animate={{
                background: [
                  "radial-gradient(ellipse at 30% 50%, hsl(330 100% 64% / 0.06), transparent 60%)",
                  "radial-gradient(ellipse at 70% 50%, hsl(330 100% 64% / 0.06), transparent 60%)",
                  "radial-gradient(ellipse at 30% 50%, hsl(330 100% 64% / 0.06), transparent 60%)",
                ],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative z-10">
              <motion.h2
                className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-3 sm:mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                Ready to scale?
              </motion.h2>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto">
                Join 500+ agencies using Creator OS to streamline operations and boost revenue.
              </p>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link to="/auth">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-full px-8 sm:px-10 py-5 sm:py-6 text-sm sm:text-base font-medium shadow-glow">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-4 sm:mt-5">No credit card required · 14-day trial · Cancel anytime</p>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}
