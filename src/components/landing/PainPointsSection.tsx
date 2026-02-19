import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { motion } from "framer-motion";
import { FloatingParticles } from "./AnimationPrimitives";

const painPoints = [
  { text: "Tracking earnings across platforms manually", metric: "15+ hrs/week" },
  { text: "No visibility into chatter PPV performance", metric: "Lost revenue" },
  { text: "Losing track of content plans across creators", metric: "Missed deadlines" },
  { text: "Chatter shifts with zero revenue attribution", metric: "No ROI data" },
  { text: "No way to compare team performance at a glance", metric: "Blind spots" },
  { text: "Hiring admin staff to handle operational chaos", metric: "$3K+/month" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: 40, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const },
  },
};

export function PainPointsSection() {
  return (
    <section className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-t border-border overflow-hidden">
      <FloatingParticles count={10} />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-start">
          <ScrollReveal>
            <motion.span
              className="inline-block text-[10px] sm:text-xs uppercase tracking-widest text-destructive font-semibold mb-3 sm:mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              The Problem
            </motion.span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4 sm:mb-6">
              Running an agency
              <br />
              shouldn't feel like
              <br />
              <span className="gradient-text">this.</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md">
              Every agency owner knows these problems. BunnyWorksOS makes them disappear.
            </p>
          </ScrollReveal>

          <motion.div
            className="space-y-2 sm:space-y-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {painPoints.map((pain, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ x: 6, borderColor: "hsl(0 72% 51% / 0.4)", scale: 1.01 }}
                className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border bg-card/50 transition-colors cursor-default group"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <motion.div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0"
                    whileHover={{ rotate: 90 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="text-destructive text-xs sm:text-sm font-bold">✕</span>
                  </motion.div>
                  <span className="text-xs sm:text-sm md:text-base text-foreground">{pain.text}</span>
                </div>
                <span className="text-[10px] sm:text-xs text-destructive/70 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {pain.metric}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}