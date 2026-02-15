import { Star, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";

const testimonials = [
  { name: "Marcus T.", role: "Agency Owner, 35+ Creators", content: "Before Creator OS, I was spending 15 hours a week on spreadsheets. Now it's all automated. I've scaled from 15 to 35 creators without adding a single admin hire.", rating: 5, highlight: "15 hrs/week saved" },
  { name: "Elena R.", role: "Operations Manager", content: "The unified team management is a game-changer. Our PPV conversion rate increased 28% once we could actually see who was performing.", rating: 5, highlight: "28% PPV increase" },
  { name: "David K.", role: "Agency Founder, Top 0.1%", content: "We tried 4 different tools before Creator OS. The shift scheduling with performance tracking is exactly what OFM agencies need.", rating: 5, highlight: "4x faster onboarding" },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-16 sm:py-24 px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="mb-14 sm:mb-20">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4">
            Trusted by <span className="gradient-text">leading agencies.</span>
          </h2>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card h-full flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">{t.highlight}</span>
                </div>
                <p className="text-sm sm:text-base text-foreground mb-6 leading-relaxed flex-1">"{t.content}"</p>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const steps = [
    { step: "01", title: "Import Your Roster", description: "Add creators and team members in minutes. Connect OnlyFans accounts for automatic revenue syncing." },
    { step: "02", title: "Assign & Schedule", description: "Assign chatters to creators, set targets, and schedule shifts with visual roster builder." },
    { step: "03", title: "Track & Optimize", description: "Monitor real-time dashboards. Get actionable insights on performers and areas for improvement." },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="mb-14 sm:mb-20">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4">
            Get started in{" "}
            <span className="gradient-text">minutes.</span>
          </h2>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-8">
          {steps.map((item) => (
            <StaggerItem key={item.step}>
              <div className="p-8 sm:p-10 rounded-2xl border border-border bg-card h-full">
                <span className="text-4xl sm:text-5xl font-bold text-primary/20 block mb-6">{item.step}</span>
                <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 sm:py-24 px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="mb-14 sm:mb-20">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4">
            Simple{" "}
            <span className="gradient-text">pricing.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
            Scale as you grow. No hidden fees.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <PricingCard name="Core" price="$69" period="/month" desc="Solo managers & small agencies" features={["Up to 2 creators", "3 team members", "Basic shift scheduling", "50 GB Content Vault"]} ctaLabel="Get Started" highlight={false} />
          <PricingCard name="Scale" price="$129" period="/month" desc="Real agencies running teams" features={["Up to 6 creators", "15 team members", "PPV & revenue analytics", "200 GB Content Vault"]} ctaLabel="Start Free Trial" highlight={true} badge="Popular" />
          <PricingCard name="Pro" price="$249" period="/month" desc="AI-powered growth" features={["Up to 15 creators", "40 team members", "AI performance insights", "600 GB Content Vault"]} ctaLabel="Start Free Trial" highlight={false} />
          <PricingCard name="Enterprise" price="$399+" period="custom" desc="Large & multi-brand operators" features={["Unlimited everything", "AI Chatting + Voice Cloner", "White-label experience", "1 TB+ Vault + SLA"]} ctaLabel="Contact Sales" highlight={false} isEnterprise />
        </StaggerContainer>
      </div>
    </section>
  );
}

function PricingCard({ name, price, period, desc, features, ctaLabel, highlight, badge, isEnterprise }: {
  name: string; price: string; period: string; desc: string; features: string[]; ctaLabel: string; highlight: boolean; badge?: string; isEnterprise?: boolean;
}) {
  return (
    <div className={`p-6 sm:p-8 rounded-2xl border flex flex-col h-full ${highlight ? "border-primary bg-card relative" : "border-border bg-card"}`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-4 py-1 rounded-full">{badge}</div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-1">{name}</h3>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-bold text-foreground">{price}</span>
        <span className="text-sm text-muted-foreground">{period}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-6">{desc}</p>
      <ul className="space-y-2.5 mb-8 flex-1">
        {features.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {isEnterprise ? (
        <Button variant="outline" className="w-full rounded-full mt-auto">{ctaLabel}</Button>
      ) : (
        <Link to="/auth" className="mt-auto">
          <Button className={`w-full rounded-full ${highlight ? "bg-primary hover:bg-primary/90" : ""}`} variant={highlight ? "default" : "outline"}>{ctaLabel}</Button>
        </Link>
      )}
    </div>
  );
}

export function FinalCTASection() {
  return (
    <section className="py-16 sm:py-24 px-6 lg:px-8 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="p-10 sm:p-16 rounded-2xl border border-border bg-card relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
                Ready to scale?
              </h2>
              <p className="text-base text-muted-foreground mb-8 max-w-lg mx-auto">
                Join 500+ agencies using Creator OS to streamline operations and boost revenue.
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-full px-10 py-6 text-base font-medium shadow-glow">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-5">No credit card required · 14-day trial · Cancel anytime</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
