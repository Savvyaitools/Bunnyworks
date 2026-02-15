import { Rocket, Target, Award } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";

const painPoints = [
  "Tracking earnings across OnlyFans, Fansly, and other platforms manually",
  "Not knowing which chatters are actually hitting their PPV targets",
  "Losing track of which creators need content plans this week",
  "Chatter shifts without visibility into messages sent or revenue generated",
  "No way to compare performance across your entire roster",
  "Hiring more team members just to handle administrative overhead",
];

const useCases = [
  { title: "Growing Agencies", description: "From 5 to 500 creators, our platform scales with you without the operational chaos.", icon: Rocket },
  { title: "Established Operations", description: "Replace spreadsheets and scattered tools with one unified command center for your agency.", icon: Target },
  { title: "Premium Boutiques", description: "White-label portal gives your creators a professional, branded experience they'll love.", icon: Award },
];

export function PainPointsSection() {
  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Sound <span className="gradient-text">Familiar?</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            These are the operational headaches every OFM agency owner knows too well.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-12" staggerDelay={0.08}>
          {painPoints.map((pain, index) => (
            <StaggerItem key={index}>
              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-destructive text-xs sm:text-sm">✕</span>
                </div>
                <span className="text-sm sm:text-base text-foreground">{pain}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollReveal className="text-center" delay={0.2}>
          <p className="text-base sm:text-xl text-foreground mb-4 sm:mb-6">
            With <span className="gradient-text font-semibold">Creator OS</span>, these problems disappear.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {useCases.map((useCase) => (
            <StaggerItem key={useCase.title}>
              <div className="glass-card p-4 sm:p-6 text-left h-full">
                <useCase.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">{useCase.title}</h3>
                <p className="text-sm text-muted-foreground">{useCase.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
