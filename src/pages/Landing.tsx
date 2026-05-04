import { useEffect } from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { ScreenshotShowcase } from "@/components/landing/ScreenshotShowcase";
import { AIToolsSection } from "@/components/landing/AIToolsSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection, TestimonialsSection, PricingSection, FinalCTASection } from "@/components/landing/LandingSections";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { GradientDivider, ScrollGlowOrb } from "@/components/landing/AnimationPrimitives";

const Landing = () => {
  // Mouse-follow glow tracking for .glow-card elements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll<HTMLElement>(".glow-card");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--mouse-x", `${x}%`);
        card.style.setProperty("--mouse-y", `${y}%`);
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Global ambient glow that follows scroll */}
      <ScrollGlowOrb />
      
      <LandingNav />
      <HeroSection />
      <GradientDivider />
      <ScreenshotShowcase />
      <GradientDivider />
      <PainPointsSection />
      <GradientDivider />
      <FeaturesSection />
      <GradientDivider />
      <AIToolsSection />
      <GradientDivider />
      <HowItWorksSection />
      <GradientDivider />
      <TestimonialsSection />
      <GradientDivider />
      <PricingSection />
      <GradientDivider />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
};

export default Landing;