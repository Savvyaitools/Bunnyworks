import { motion } from "framer-motion";

const platforms = [
  { name: "OnlyFans", color: "#00AFF0", icon: "OF" },
  { name: "Fansly", color: "#1DA1F2", icon: "F" },
  { name: "Fanvue", color: "#8B5CF6", icon: "FV" },
  { name: "Reddit", color: "#FF4500", icon: "R" },
  { name: "Instagram", color: "#E4405F", icon: "IG" },
  { name: "TikTok", color: "#00F2EA", icon: "TT" },
  { name: "X / Twitter", color: "#FFFFFF", icon: "𝕏" },
  { name: "Snapchat", color: "#FFFC00", icon: "SC" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 },
  },
};

export function PlatformLogos() {
  return (
    <section className="py-6 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 border-b border-border/50">
      <div className="max-w-7xl mx-auto">
        <motion.p
          className="text-center text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground font-medium mb-5 sm:mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Built for the platforms your agency operates on
        </motion.p>
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 lg:gap-10"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
        >
          {platforms.map((p) => (
            <motion.div
              key={p.name}
              variants={itemVariants}
              className="flex items-center gap-1.5 sm:gap-2 group cursor-default"
              whileHover={{ scale: 1.08, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div
                className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center text-[10px] sm:text-xs lg:text-sm font-bold transition-all duration-300 group-hover:shadow-lg"
                style={{ backgroundColor: `${p.color}20`, color: p.color }}
              >
                {p.icon}
              </div>
              <span className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground group-hover:text-foreground transition-colors font-medium hidden sm:inline">
                {p.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
