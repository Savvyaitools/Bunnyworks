import { useState } from "react";
import { Monitor, Brain, Calendar, Smartphone, Globe } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { motion, AnimatePresence } from "framer-motion";
import dashboardImg from "@/assets/screenshots/dashboard-preview.jpg";
import browserImg from "@/assets/screenshots/browser-sessions-preview.jpg";
import coachImg from "@/assets/screenshots/ai-coach-preview.jpg";
import shiftImg from "@/assets/screenshots/shift-analytics-preview.jpg";
import mobileImg from "@/assets/screenshots/mobile-preview.jpg";

const showcaseItems = [
  {
    id: "dashboard",
    icon: Monitor,
    tab: "Revenue Dashboard",
    title: "Real-Time Revenue Intelligence",
    description: "Track gross earnings, net revenue, and agency commissions across all creators. Revenue breakdowns by subscriptions, tips, PPV, and referrals — updated in real time.",
    image: dashboardImg,
  },
  {
    id: "browser",
    icon: Globe,
    tab: "Cloud Browser",
    title: "Cloud Browser Sessions",
    description: "Launch live platform sessions directly in your browser. Pre-authenticated access with persistent login states and proxy geo-settings. No downloads, works on any device.",
    image: browserImg,
  },
  {
    id: "coach",
    icon: Brain,
    tab: "Coach PBF",
    title: "AI Agency Intelligence",
    description: "Ask anything about your agency — revenue trends, team performance, chatter optimization. Persistent memory and data-backed insights with actionable recommendations.",
    image: coachImg,
  },
  {
    id: "shifts",
    icon: Calendar,
    tab: "Shift Analytics",
    title: "Smart Shift Scheduling",
    description: "Visual shift calendar with coverage gap detection, chatter performance leaderboards, and PPV conversion tracking per shift.",
    image: shiftImg,
  },
  {
    id: "mobile",
    icon: Smartphone,
    tab: "Mobile Access",
    title: "Full Mobile Access",
    description: "Manage your entire agency from any phone or tablet. No app download needed — fully responsive on every screen.",
    image: mobileImg,
  },
];

export function ScreenshotShowcase() {
  const [active, setActive] = useState(0);
  const item = showcaseItems[active];

  return (
    <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-3 sm:mb-4">
            See it in <span className="gradient-text">action.</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl">
            Every screen designed to save time and drive revenue for your agency.
          </p>
        </ScrollReveal>

        {/* Pill tabs */}
        <motion.div
          className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-10"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {showcaseItems.map((s, i) => (
            <motion.button
              key={s.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                active === i
                  ? "bg-primary text-primary-foreground shadow-glow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              layout
            >
              <s.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">{s.tab}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          className="rounded-xl sm:rounded-2xl border border-border bg-card gloss overflow-hidden shadow-glow-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="grid lg:grid-cols-5">
            <div className="lg:col-span-2 p-5 sm:p-8 lg:p-12 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                  transition={{ duration: 0.35 }}
                >
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="lg:col-span-3 relative bg-background/30 p-3 sm:p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95, rotateX: 2 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                  exit={{ opacity: 0, scale: 0.95, rotateX: -2 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
                  className="rounded-lg sm:rounded-xl overflow-hidden border border-border/50"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
