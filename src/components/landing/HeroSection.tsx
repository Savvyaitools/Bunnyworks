import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import myCreatorSuiteLogo from "@/assets/mycreatorsuite-logo.png";

const stats = [
  { value: "85%", label: "Less Admin Time" },
  { value: "$50M+", label: "Revenue Tracked Monthly" },
  { value: "10K+", label: "Active Creators Managed" },
  { value: "24/7", label: "Automated Operations" },
];

export function HeroSection() {
  return (
    <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[800px] h-[300px] sm:h-[600px] bg-primary/20 blur-[100px] sm:blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-accent/10 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm text-primary font-medium">#1 Management Platform for Creator Agencies</span>
          </div>
          <img src={myCreatorSuiteLogo} alt="Creator OS Logo" className="h-20 sm:h-28 lg:h-32 w-auto mx-auto mb-6 sm:mb-8 animate-float animate-neon-glow" />
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6">
            <span className="gradient-text">Creator OS</span>
            <br />
            <span className="text-foreground text-2xl sm:text-4xl lg:text-6xl">Scale Your OnlyFans Agency with Confidence</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            The all-in-one CRM built for OFM agencies. Manage creators, track revenue in real-time, optimize chatter performance, and automate operations—so you can focus on growth, not spreadsheets.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 glow-primary">
                Start Your 14-Day Free Trial
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-border hover:bg-muted">
              Watch 2-Minute Demo
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-4">No credit card required • Full access • Cancel anytime</p>
        </div>

        <div className="mt-12 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-4 sm:p-6">
              <div className="text-xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-muted-foreground mt-1 text-xs sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
