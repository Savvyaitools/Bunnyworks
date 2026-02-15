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
    <section id="comparison" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            See How We <span className="gradient-text">Compare</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Creator OS is the only platform with AI agents, cloud browser sessions, and enterprise security — all built in.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="glass-card overflow-hidden">
            {/* Mobile */}
            <div className="block lg:hidden">
              {competitorComparison.features.map((feature, fi) => (
                <div key={feature.name} className={`p-4 ${fi !== competitorComparison.features.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="font-medium text-foreground mb-3 text-sm">{feature.name}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {competitorComparison.competitors.map((c) => (
                      <div key={c.name} className={`flex items-center justify-between p-2 rounded-lg ${c.highlight ? "bg-primary/10 border border-primary/30" : "bg-muted/30"}`}>
                        <span className={`text-xs ${c.highlight ? "text-primary font-medium" : "text-muted-foreground"}`}>{c.name}</span>
                        {c.values[fi] === true ? <Check className={`h-4 w-4 ${c.highlight ? "text-primary" : "text-green-500"}`} /> : c.values[fi] === false ? <X className="h-4 w-4 text-muted-foreground/50" /> : <span className="text-[10px] text-amber-500 font-medium">Partial</span>}
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
                    <th className="text-left p-4 font-semibold text-foreground">Features</th>
                    {competitorComparison.competitors.map((c) => (
                      <th key={c.name} className={`p-4 text-center font-semibold min-w-[140px] ${c.highlight ? "text-primary bg-primary/5" : "text-foreground"}`}>
                        <div className="flex flex-col items-center gap-1">
                          {c.name}
                          {c.highlight && <span className="text-[10px] font-normal bg-primary/20 text-primary px-2 py-0.5 rounded-full">You're here</span>}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {competitorComparison.features.map((feature, fi) => (
                    <tr key={feature.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-foreground text-sm font-medium">{feature.name}</td>
                      {competitorComparison.competitors.map((c) => (
                        <td key={c.name} className={`p-4 text-center ${c.highlight ? "bg-primary/5" : ""}`}>
                          {c.values[fi] === true ? (
                            <div className="flex justify-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${c.highlight ? "bg-primary/20" : "bg-green-500/20"}`}>
                                <Check className={`h-4 w-4 ${c.highlight ? "text-primary" : "text-green-500"}`} />
                              </div>
                            </div>
                          ) : c.values[fi] === false ? (
                            <div className="flex justify-center">
                              <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center">
                                <X className="h-4 w-4 text-muted-foreground/50" />
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-500 font-medium bg-amber-500/10 px-2 py-1 rounded-full">Limited</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-foreground font-semibold text-sm sm:text-base">The only platform with AI agents, cloud browsers & enterprise security.</p>
                  <p className="text-muted-foreground text-xs sm:text-sm">Join 500+ agencies that made the switch to Creator OS</p>
                </div>
                <Link to="/auth">
                  <Button className="bg-primary hover:bg-primary/90 glow-sm whitespace-nowrap">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
