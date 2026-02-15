import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-end pb-12 sm:pb-20 pt-20 px-6 lg:px-8 overflow-hidden bg-background">
      {/* Subtle glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/8 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <div className="max-w-5xl">
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
              The #1 management
              <br />
              platform for{" "}
              <span className="gradient-text">creator</span>
              <br />
              <span className="gradient-text">agencies.</span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Manage creators across OnlyFans, Fansly & Fanvue. Built-in AI agents, cloud browser sessions, and enterprise security — no downloads required.
            </p>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-full px-8 py-6 text-base font-medium shadow-glow">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-base font-medium border-border hover:bg-muted">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          className="mt-16 sm:mt-24 flex flex-wrap gap-8 sm:gap-16 border-t border-border pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {[
            { value: "500+", label: "Agencies" },
            { value: "10K+", label: "Creators Managed" },
            { value: "$50M+", label: "Revenue Tracked" },
            { value: "24/7", label: "AI-Powered" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
