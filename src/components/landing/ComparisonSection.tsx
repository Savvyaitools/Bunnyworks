import { Check, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

const competitorComparison = {
  features: [
    { name: "Fan CRM & Management" },
    { name: "Revenue & Earnings Dashboard" },
    { name: "Chatter Shift Scheduling" },
    { name: "Chatter Performance Analytics" },
    { name: "White-Label Creator Portal" },
    { name: "Content Vault & Planning" },
    { name: "AI Chatting Assistant" },
    { name: "AI Voice Cloner" },
    { name: "AI Content Generator" },
    { name: "Invoice & Payroll Management" },
    { name: "Recruiting Pipeline" },
    { name: "Team Permission Management" },
    { name: "Marketing & Tracking Links" },
    { name: "Cloud Browser Sessions" },
    { name: "AI Agency Intelligence (Coach PBF)" },
    { name: "AI Content Automation (Tatum)" },
    { name: "AI Smart Replies with Learning (Izzy)" },
    { name: "Mobile Access — No App Download" },
    { name: "Row-Level Data Security" },
    { name: "Multi-Platform Support" },
  ],
  competitors: [
    { name: "Creator OS", highlight: true, values: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true] },
    { name: "Supercreator", highlight: false, values: [true, true, "limited", true, false, "limited", true, false, false, false, false, "limited", true, false, false, false, "limited", "limited", false, false] },
    { name: "Infloww", highlight: false, values: [true, true, "limited", true, false, true, "limited", false, false, false, false, "limited", true, false, false, false, false, true, false, true] },
    { name: "CreatorHero", highlight: false, values: [true, true, false, "limited", false, true, true, false, false, false, false, "limited", "limited", false, false, false, false, true, false, true] },
    { name: "OnlyMonster", highlight: false, values: ["limited", true, true, "limited", false, false, true, false, false, false, false, "limited", true, false, false, false, false, "limited", false, "limited"] },
  ],
};

export function ComparisonSection() {
  return (
    <section id="comparison" className="py-16 sm:py-24 px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="mb-14 sm:mb-20">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4">
            See how we{" "}
            <span className="gradient-text">compare.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
            The only platform with AI agents, cloud browsers, and enterprise security — all built in.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Mobile */}
            <div className="block lg:hidden">
              {competitorComparison.features.map((feature, fi) => (
                <div key={feature.name} className={`p-4 ${fi !== competitorComparison.features.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="font-medium text-foreground mb-3 text-sm">{feature.name}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {competitorComparison.competitors.map((c) => (
                      <div key={c.name} className={`flex items-center justify-between p-2 rounded-lg ${c.highlight ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}>
                        <span className={`text-xs ${c.highlight ? "text-primary font-medium" : "text-muted-foreground"}`}>{c.name}</span>
                        {c.values[fi] === true ? <Check className={`h-4 w-4 ${c.highlight ? "text-primary" : "text-success"}`} /> : c.values[fi] === false ? <X className="h-4 w-4 text-muted-foreground/40" /> : <span className="text-[10px] text-warning font-medium">Partial</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-5 font-semibold text-foreground text-sm">Features</th>
                    {competitorComparison.competitors.map((c) => (
                      <th key={c.name} className={`p-5 text-center font-semibold text-sm min-w-[130px] ${c.highlight ? "text-primary bg-primary/5" : "text-foreground"}`}>
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {competitorComparison.features.map((feature, fi) => (
                    <tr key={feature.name} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="p-4 text-foreground text-sm">{feature.name}</td>
                      {competitorComparison.competitors.map((c) => (
                        <td key={c.name} className={`p-4 text-center ${c.highlight ? "bg-primary/5" : ""}`}>
                          {c.values[fi] === true ? (
                            <div className="flex justify-center">
                              <Check className={`h-4 w-4 ${c.highlight ? "text-primary" : "text-success"}`} />
                            </div>
                          ) : c.values[fi] === false ? (
                            <div className="flex justify-center">
                              <X className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                          ) : (
                            <span className="text-xs text-warning font-medium">Limited</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 sm:p-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-foreground font-medium text-sm sm:text-base">
                The most complete platform for creator agencies.
              </p>
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90 rounded-full px-6">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
