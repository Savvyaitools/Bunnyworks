import { Star, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";

const testimonials = [
  { name: "Marcus T.", role: "Agency Owner, 35+ Creators", content: "Before Creator OS, I was spending 15 hours a week on spreadsheets tracking chatter shifts and creator earnings. Now it's all automated. I've scaled from 15 to 35 creators without adding a single admin hire.", rating: 5, highlight: "15 hrs/week saved" },
  { name: "Elena R.", role: "Operations Manager", content: "The unified team management is a game-changer. All our chatters and employees in one place with performance tracking built in. Our PPV conversion rate increased 28% once we could actually see who was performing.", rating: 5, highlight: "28% PPV increase" },
  { name: "David K.", role: "Agency Founder, Top 0.1% Creators", content: "We tried 4 different tools before finding Creator OS. The shift scheduling with performance tracking is exactly what OFM agencies need. Plus the creator portal keeps our talent happy and informed.", rating: 5, highlight: "4x faster onboarding" },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Trusted by <span className="gradient-text">Leading OFM Agencies</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            See why top OnlyFans agency owners choose Creator OS to power their operations.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <div className="glass-card p-4 sm:p-6 h-full">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex gap-0.5 sm:gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-primary bg-primary/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">{t.highlight}</span>
                </div>
                <p className="text-sm sm:text-base text-foreground mb-3 sm:mb-4 leading-relaxed">"{t.content}"</p>
                <div>
                  <div className="text-sm sm:text-base font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{t.role}</div>
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
    { step: "1", title: "Import Your Roster", description: "Add creators and team members in minutes. Connect OnlyFans accounts for automatic revenue syncing and real-time earnings tracking." },
    { step: "2", title: "Assign & Schedule", description: "Assign chatters to creators, set performance targets, and schedule shifts with our visual roster builder and coverage gap detection." },
    { step: "3", title: "Track & Optimize", description: "Monitor real-time performance dashboards. Get actionable insights on top performers and areas for improvement." },
  ];

  return (
    <section id="how-it-works" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Get Started in <span className="gradient-text">Minutes</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">Three simple steps to transform your agency operations.</p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {steps.map((item) => (
            <StaggerItem key={item.step}>
              <div className="glass-card p-5 sm:p-8 text-center h-full">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <span className="text-xl sm:text-3xl font-bold gradient-text">{item.step}</span>
                </div>
                <h3 className="text-base sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{item.description}</p>
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
    <section id="pricing" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">Choose the tier that matches your agency's stage. Scale as you grow.</p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Core */}
          <PricingCard name="CORE" tagline='"Visibility"' price="$69" period="per month" desc="Solo managers & small agencies who want clarity" features={["Up to 2 creators, 3 team members", "Unified employee management", "Basic shift scheduling", "Creator profiles + onboarding", "50 GB Content Vault", "Task management dashboard", "Basic performance tracking"]} quote='"Is my operation even working?"' ctaLabel="Get Started" highlight={false} />
          {/* Scale */}
          <PricingCard name="SCALE" tagline='"Operational Control"' price="$129" period="per month" desc="Real agencies running teams" features={["Up to 6 creators, 15 team members", "Advanced chatter performance tracking", "PPV & revenue analytics per shift", "Recruiting pipeline with follow-ups", "Coverage gap detection", "200 GB Content Vault", "Priority support"]} quote='"Where am I leaking money and time?"' ctaLabel="Start 14-Day Free Trial" highlight={true} badge="Most Popular" />
          {/* Pro */}
          <PricingCard name="PRO" tagline='"AI-Powered Growth"' price="$249" period="per month" desc="Agencies unlocking AI capabilities" features={["Up to 15 creators, 40 team members", "AI-powered performance insights", "Automated daily summaries", "Creator consistency scoring", "Staff reliability metrics", "600 GB Content Vault", "Early access to features"]} quote='"Unlock the power of AI for my agency."' ctaLabel="Start 14-Day Free Trial" highlight={false} />
          {/* Enterprise */}
          <PricingCard name="ENTERPRISE" tagline='"Systems Command"' price="$399+" period="custom pricing" desc="Large agencies & multi-brand operators" features={["Unlimited creators & team members", "AI Chatting System", "AI Voice Cloner", "AI Content Generator", "Custom KPIs & automations", "White-label experience", "1 TB+ Content Vault", "Dedicated implementation", "SLA + roadmap influence"]} quote='"Run the agency like a company, not a hustle."' ctaLabel="Contact Sales" highlight={false} isEnterprise />
        </StaggerContainer>
      </div>
    </section>
  );
}

function PricingCard({ name, tagline, price, period, desc, features, quote, ctaLabel, highlight, badge, isEnterprise }: {
  name: string; tagline: string; price: string; period: string; desc: string; features: string[]; quote: string; ctaLabel: string; highlight: boolean; badge?: string; isEnterprise?: boolean;
}) {
  return (
    <div className={`glass-card p-6 flex flex-col ${highlight ? "border-primary/50 relative" : ""}`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">{badge}</div>
      )}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        <p className="text-sm text-primary">{tagline}</p>
      </div>
      <div className="text-3xl font-bold text-foreground mb-1">{price}</div>
      <div className="text-muted-foreground text-sm mb-4">{period}</div>
      <p className="text-xs text-muted-foreground mb-4">{desc}</p>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((item) => (
          <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className={`p-3 ${highlight ? "bg-primary/10" : "bg-muted/50"} rounded-lg mb-4`}>
        <p className={`text-xs ${highlight ? "text-primary" : "text-muted-foreground"} italic`}>{quote}</p>
      </div>
      {isEnterprise ? (
        <Button variant="outline" className="w-full mt-auto">{ctaLabel}</Button>
      ) : (
        <Link to="/auth" className="mt-auto">
          <Button className={`w-full ${highlight ? "bg-primary hover:bg-primary/90" : ""}`} variant={highlight ? "default" : "outline"}>{ctaLabel}</Button>
        </Link>
      )}
    </div>
  );
}

export function FinalCTASection() {
  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <div className="glass-card p-6 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">Ready to Scale Your OnlyFans Agency?</h2>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
                Join 500+ OFM agencies already using Creator OS to streamline operations, boost revenue, and scale without the stress.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 glow-primary">
                    Start Your Free Trial Now
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6">No credit card required • 14-day free trial • Full feature access</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
