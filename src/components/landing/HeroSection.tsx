import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";

const stats = [
  { value: "500+", label: "Agencies" },
  { value: "10K+", label: "Creators Managed" },
  { value: "$50M+", label: "Revenue Tracked" },
  { value: "24/7", label: "AI-Powered" },
];

export function HeroSection() {
  const { scrollY } = useScroll();
  const glowY = useTransform(scrollY, [0, 500], [0, 80]);
  const glowScale = useTransform(scrollY, [0, 500], [1, 1.3]);
  const textY = useTransform(scrollY, [0, 400], [0, 40]);

  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-end pb-10 sm:pb-20 pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-background">
      {/* Animated glow */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[300px] sm:h-[400px] bg-primary/8 blur-[120px] sm:blur-[150px] rounded-full pointer-events-none"
        style={{ y: glowY, scale: glowScale }}
      />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div style={{ y: textY }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="max-w-5xl">
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-6 sm:mb-8">
                <motion.span
                  className="block"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                >
                  The #1 management
                </motion.span>
                <motion.span
                  className="block"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  platform for{" "}
                  <span className="gradient-text">creator</span>
                </motion.span>
                <motion.span
                  className="block gradient-text"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  agencies.
                </motion.span>
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-8">
              <motion.p
                className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Manage creators across OnlyFans, Fansly & Fanvue. Built-in AI agents, cloud browser sessions, and enterprise security — no downloads required.
              </motion.p>
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link to="/auth">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-full px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-medium shadow-glow">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link to="/auth">
                    <Button size="lg" variant="outline" className="rounded-full px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-medium border-border hover:bg-muted">
                      Login
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            className="mt-12 sm:mt-16 md:mt-24 flex flex-wrap gap-6 sm:gap-8 md:gap-16 border-t border-border pt-6 sm:pt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1, duration: 0.5 }}
                whileHover={{ y: -2 }}
              >
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
