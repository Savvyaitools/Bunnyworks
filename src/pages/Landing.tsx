import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { PlatformLogos } from "@/components/landing/PlatformLogos";
import { AIToolsSection } from "@/components/landing/AIToolsSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { HowItWorksSection, TestimonialsSection, PricingSection, FinalCTASection } from "@/components/landing/LandingSections";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <PlatformLogos />
      <PainPointsSection />
      <FeaturesSection />
      <AIToolsSection />
      <ComparisonSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
};

export default Landing;
