import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { FloatingParticles, AnimatedCounter, MagneticHover } from "./AnimationPrimitives";

const stats = [
  { value: 500, suffix: "+", label: "Agencies" },
  { value: 10000, suffix: "+", label: "Creators Managed", prefix: "" },
  { value: 50, suffix: "M+", label: "Revenue Tracked", prefix: "$" },
  { value: 24, suffix: "/7", label: "AI-Powered" },
];

export function HeroSection() {
  const { scrollY } = useScroll();
  const glowY = useTransform(scrollY, [0, 500], [0, 80]);
  const glowScale = useTransform(scrollY, [0, 500], [1, 1.3]);
  const textY = useTransform(scrollY, [0, 400], [0, 40]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-end pb-10 sm:pb-20 pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-background">
      {/* Floating particles */}
      <FloatingParticles count={25} />

      {/* Primary glow orb */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[350px] sm:h-[500px] rounded-full pointer-events-none"
        style={{
          y: glowY,
          scale: glowScale,
          background: "radial-gradient(ellipse, hsl(330 100% 64% / 0.15), hsl(280 80% 60% / 0.08) 50%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      {/* Secondary accent glow */}
      <motion.div
        className="absolute top-2/3 right-1/4 w-[300px] sm:w-[400px] h-[200px] sm:h-[300px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, hsl(280 80% 65% / 0.1), transparent 70%)",
          filter: "blur(100px)",
        }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(hsl(330 100% 64% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(330 100% 64% / 0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div style={{ y: textY, opacity }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 0.4, 0.25, 1] }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6 sm:mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Now with AI-powered autonomous agents</span>
            </motion.div>

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
                Manage creators across OnlyFans, Fansly & Fanvue. Built-in AI agents, platform access, and enterprise security — no downloads required.
              </motion.p>
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <MagneticHover>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Link to="/auth">
                      <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-full px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-medium shadow-glow group">
                        Start Free Trial
                        <motion.span
                          className="ml-2"
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </motion.span>
                      </Button>
                    </Link>
                  </motion.div>
                </MagneticHover>
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

          {/* Tech badges */}
          <motion.div
            className="mt-10 sm:mt-14 md:mt-20 flex flex-wrap items-center gap-3 sm:gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.6 }}
          >
            <span className="text-xs text-muted-foreground mr-1 uppercase tracking-widest font-medium">Powered by</span>
            {[
              { icon: "🔐", label: "End-to-End Encryption" },
              { icon: "🛡️", label: "Zero-Trust Auth" },
              { icon: "☁️", label: "Cloud-Native Sessions" },
              { icon: "⚡", label: "Lightweight & Fast" },
              { icon: "🖥️", label: "Dedicated Servers (Enterprise)" },
            ].map((tech, i) => (
              <motion.span
                key={tech.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.85 + i * 0.07, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <span>{tech.icon}</span>
                {tech.label}
              </motion.span>
            ))}
          </motion.div>

          {/* Stats strip with animated counters */}
          <motion.div
            className="mt-8 sm:mt-12 md:mt-16 flex flex-wrap gap-6 sm:gap-8 md:gap-16 border-t border-border pt-6 sm:pt-8"
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
                className="group"
              >
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix || ""} />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}