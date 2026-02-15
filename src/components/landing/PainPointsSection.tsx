import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { motion } from "framer-motion";

const painPoints = [
  "Tracking earnings across platforms manually",
  "No visibility into chatter PPV performance",
  "Losing track of content plans across creators",
  "Chatter shifts with zero revenue attribution",
  "No way to compare team performance at a glance",
  "Hiring admin staff to handle operational chaos",
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: 30, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const },
  },
};

export function PainPointsSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-start">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4 sm:mb-6">
              Running an agency
              <br />
              shouldn't feel like
              <br />
              <span className="gradient-text">this.</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md">
              Every agency owner knows these problems. Creator OS makes them disappear.
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
                whileHover={{ x: 4, borderColor: "hsl(0 72% 51% / 0.3)" }}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border bg-card/50 transition-colors cursor-default"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-destructive text-xs sm:text-sm font-bold">✕</span>
                </div>
                <span className="text-xs sm:text-sm md:text-base text-foreground">{pain}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
