import { motion } from "framer-motion";
import { Marquee } from "./AnimationPrimitives";

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

const trustItems = [
  "SOC 2 Compliant",
  "256-bit Encryption",
  "GDPR Ready",
  "99.9% Uptime SLA",
  "Row-Level Security",
  "Zero Download Required",
  "Enterprise Grade",
  "Multi-Platform Support",
];

function PlatformBadge({ p }: { p: typeof platforms[0] }) {
  return (
    <motion.div
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
  );
}

export function PlatformLogos() {
  return (
    <section className="py-6 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 border-b border-border/50 space-y-6 sm:space-y-8">
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
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {platforms.map((p) => (
            <PlatformBadge key={p.name} p={p} />
          ))}
        </motion.div>
      </div>

      {/* Trust marquee */}
      <div className="border-t border-border/50 pt-4 sm:pt-6">
        <Marquee speed={40}>
          <div className="flex items-center gap-8">
            {trustItems.map((item) => (
              <span key={item} className="text-[10px] sm:text-xs text-muted-foreground/60 uppercase tracking-widest font-medium flex items-center gap-2 whitespace-nowrap">
                <span className="w-1 h-1 rounded-full bg-primary/40" />
                {item}
              </span>
            ))}
          </div>
        </Marquee>
      </div>
    </section>
  );
}