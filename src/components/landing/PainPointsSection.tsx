import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";

const painPoints = [
  "Tracking earnings across platforms manually",
  "No visibility into chatter PPV performance",
  "Losing track of content plans across creators",
  "Chatter shifts with zero revenue attribution",
  "No way to compare team performance at a glance",
  "Hiring admin staff to handle operational chaos",
];

export function PainPointsSection() {
  return (
    <section className="py-16 sm:py-24 px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
              Running an agency
              <br />
              shouldn't feel like
              <br />
              <span className="gradient-text">this.</span>
            </h2>
            <p className="text-base text-muted-foreground max-w-md">
              Every agency owner knows these problems. Creator OS makes them disappear.
            </p>
          </ScrollReveal>

          <StaggerContainer className="space-y-3" staggerDelay={0.06}>
            {painPoints.map((pain, index) => (
              <StaggerItem key={index}>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/50 hover:border-destructive/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-destructive text-sm font-bold">✕</span>
                  </div>
                  <span className="text-sm sm:text-base text-foreground">{pain}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
