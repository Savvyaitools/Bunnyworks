import { useState } from "react";
import { Monitor, Brain, Calendar, Smartphone, Globe } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
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
    description: "Track gross earnings, net revenue, and agency commissions across all creators in one unified dashboard. See revenue breakdowns by subscriptions, tips, PPV, and referrals — updated in real time.",
    image: dashboardImg,
  },
  {
    id: "browser",
    icon: Globe,
    tab: "Cloud Browser",
    title: "Cloud Browser Sessions — No Downloads",
    description: "Launch live platform sessions directly in your browser. Chatters get pre-authenticated access with persistent login states, proxy geo-settings, and session recordings. Works on any device — nothing to install.",
    image: browserImg,
  },
  {
    id: "coach",
    icon: Brain,
    tab: "Coach PBF",
    title: "AI Agency Intelligence with Coach PBF",
    description: "Ask Coach PBF anything about your agency — revenue trends, team performance, chatter optimization. It remembers every conversation and provides data-backed insights with embedded charts and actionable recommendations.",
    image: coachImg,
  },
  {
    id: "shifts",
    icon: Calendar,
    tab: "Shift Analytics",
    title: "Smart Shift Scheduling & Performance",
    description: "Visual shift calendar with coverage gap detection, chatter performance leaderboards, and PPV conversion tracking per shift. Identify top performers and optimize team assignments with data-driven insights.",
    image: shiftImg,
  },
  {
    id: "mobile",
    icon: Smartphone,
    tab: "Mobile Access",
    title: "Full Mobile Access — No App Required",
    description: "Manage your entire agency from any phone or tablet. The fully responsive interface gives you revenue tracking, team management, and quick actions on the go — no app download needed.",
    image: mobileImg,
  },
];

export function ScreenshotShowcase() {
  const [active, setActive] = useState(0);
  const item = showcaseItems[active];

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            See <span className="gradient-text">Creator OS</span> in Action
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
            Purpose-built for agency teams — every screen designed to save time and drive revenue.
          </p>
        </ScrollReveal>

        {/* Tab navigation */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
          {showcaseItems.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                active === i
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-card/60 text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <s.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{s.tab}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass-card overflow-hidden">
          <div className="grid lg:grid-cols-5 gap-0">
            {/* Text side */}
            <div className="lg:col-span-2 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-3">{item.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{item.description}</p>
            </div>

            {/* Screenshot side */}
            <div className="lg:col-span-3 relative bg-background/50 p-3 sm:p-4">
              <div className="rounded-lg overflow-hidden border border-border/50 shadow-2xl shadow-primary/5">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-auto object-cover transition-opacity duration-500"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dots indicator for mobile */}
        <div className="flex justify-center gap-2 mt-4 sm:hidden">
          {showcaseItems.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                active === i ? "bg-primary w-6" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
