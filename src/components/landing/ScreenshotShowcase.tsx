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
    <section className="py-16 sm:py-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4">
            See it in <span className="gradient-text">action.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
            Every screen designed to save time and drive revenue for your agency.
          </p>
        </ScrollReveal>

        {/* Pill tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {showcaseItems.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                active === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.tab}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="grid lg:grid-cols-5">
            <div className="lg:col-span-2 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="lg:col-span-3 relative bg-background/30 p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl overflow-hidden border border-border/50"
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
        </div>
      </div>
    </section>
  );
}
