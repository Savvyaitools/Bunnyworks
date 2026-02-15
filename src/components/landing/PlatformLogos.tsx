import { ScrollReveal } from "@/components/landing/ScrollReveal";

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

export function PlatformLogos() {
  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-b border-border/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm uppercase tracking-widest text-muted-foreground font-medium">
            Built for the platforms your agency operates on
          </p>
        </ScrollReveal>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 lg:gap-12">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity duration-300 group"
            >
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold"
                style={{ backgroundColor: `${p.color}20`, color: p.color }}
              >
                {p.icon}
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors font-medium hidden sm:inline">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
