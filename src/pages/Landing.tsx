import { ArrowRight, Star, Users, DollarSign, TrendingUp, Zap, Shield, Clock, CheckCircle, BarChart3, MessageSquare, Calendar, FileText, Award, Sparkles, Target, Rocket, Mic, Image, Headphones, X, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/landing/MobileNav";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";
import myCreatorSuiteLogo from "@/assets/mycreatorsuite-logo.png";

const mainNavLinks = [{
  label: "Features",
  href: "#features",
  isExternal: true
}, {
  label: "Compare",
  href: "#comparison",
  isExternal: true
}, {
  label: "AI Tools",
  href: "#tools",
  isExternal: true
}, {
  label: "Testimonials",
  href: "#testimonials",
  isExternal: true
}, {
  label: "Pricing",
  href: "#pricing",
  isExternal: true
}];

const features = [{
  icon: Users,
  title: "Unified Team Management",
  description: "Manage creators, chatters, and employees in one system. Role-based access, skill grades, and performance targets—all consolidated for maximum efficiency."
}, {
  icon: DollarSign,
  title: "Real-Time Revenue Intelligence",
  description: "Track gross earnings, net revenue, and agency commissions automatically. Sync OnlyFans data and eliminate manual spreadsheet work forever."
}, {
  icon: TrendingUp,
  title: "Chatter Performance Analytics",
  description: "Monitor messages sent, PPV conversions, and revenue per shift. Identify top performers and optimize team assignments with data-driven insights."
}, {
  icon: Zap,
  title: "Smart Shift Scheduling",
  description: "Schedule chatter shifts with automatic coverage gap detection. Auto clock-out after shift end and track time against daily targets."
}, {
  icon: Shield,
  title: "White-Label Creator Portal",
  description: "Give each creator a branded portal to view earnings, download content plans, and communicate directly with your agency team."
}, {
  icon: Clock,
  title: "Automated Workflows",
  description: "Auto-calculate daily performance summaries, send follow-up reminders, and sync earnings—without lifting a finger."
}];

const secondaryTools = [{
  icon: MessageSquare,
  title: "AI-Powered Fan Messaging",
  description: "Engage 10x more fans without hiring additional chatters. Smart replies, 24/7 coverage, and intelligent escalation built-in.",
  badge: "Enterprise",
  link: "/tools/chatting"
}, {
  icon: Mic,
  title: "AI Voice Cloner",
  description: "Clone creator voices for personalized audio content. Generate authentic voice messages fans can't distinguish from real recordings.",
  badge: "Enterprise",
  link: "/tools/voice-cloner"
}, {
  icon: Image,
  title: "AI Content Generator",
  description: "Generate platform-ready content at scale. Train AI on creator aesthetics and produce unlimited variations without photoshoots.",
  badge: "Enterprise",
  link: "/tools/content-generator"
}];

const additionalFeatures = [{
  icon: Calendar,
  title: "Content Planning",
  description: "Visual content calendar with scheduling, reference media uploads, and multi-platform coordination."
}, {
  icon: Headphones,
  title: "Integrated Messaging",
  description: "Built-in messaging between agency and creators with read receipts and conversation history."
}, {
  icon: FileText,
  title: "Invoice Management",
  description: "Generate, track, and manage invoices with automatic payment status updates and reminders."
}, {
  icon: BarChart3,
  title: "Shift & Time Tracking",
  description: "Monitor team shifts, clock-in/out times, and productivity analytics in real-time."
}];

const competitorComparison = {
  features: [
    { name: "Unified Team Management", tooltip: "Manage creators, chatters, and employees in one platform" },
    { name: "Real-Time Revenue Tracking", tooltip: "Automatic sync with OnlyFans earnings data" },
    { name: "Chatter Shift Scheduling", tooltip: "Visual roster with coverage gap detection" },
    { name: "Chatter Performance Analytics", tooltip: "PPV tracking, messages sent, revenue per shift" },
    { name: "White-Label Creator Portal", tooltip: "Branded portal for your creators" },
    { name: "Content Vault & Planning", tooltip: "Organize content with scheduling capabilities" },
    { name: "AI Chatting System", tooltip: "AI-powered fan engagement automation" },
    { name: "AI Voice Cloner", tooltip: "Generate authentic creator voice messages" },
    { name: "AI Content Generator", tooltip: "Train AI on creator aesthetics for content" },
    { name: "Invoice & Payroll Management", tooltip: "Track payments and generate invoices" },
    { name: "Recruiting Pipeline", tooltip: "Find and onboard new creators systematically" },
    { name: "Multi-Platform Support", tooltip: "OnlyFans, Fansly, and more" },
  ],
  competitors: [
    {
      name: "Creator OS",
      highlight: true,
      values: [true, true, true, true, true, true, true, true, true, true, true, true]
    },
    {
      name: "Infloww",
      highlight: false,
      values: [true, true, false, "limited", false, true, false, false, false, true, false, true]
    },
    {
      name: "Creator Hero",
      highlight: false,
      values: ["limited", true, false, false, false, true, false, false, false, "limited", false, true]
    },
    {
      name: "Onlymonster",
      highlight: false,
      values: ["limited", true, false, "limited", false, true, false, false, false, false, false, "limited"]
    }
  ]
};

const testimonials = [{
  name: "Marcus T.",
  role: "Agency Owner, 35+ Creators",
  content: "Before Creator OS, I was spending 15 hours a week on spreadsheets tracking chatter shifts and creator earnings. Now it's all automated. I've scaled from 15 to 35 creators without adding a single admin hire.",
  rating: 5,
  highlight: "15 hrs/week saved"
}, {
  name: "Elena R.",
  role: "Operations Manager",
  content: "The unified team management is a game-changer. All our chatters and employees in one place with performance tracking built in. Our PPV conversion rate increased 28% once we could actually see who was performing.",
  rating: 5,
  highlight: "28% PPV increase"
}, {
  name: "David K.",
  role: "Agency Founder, Top 0.1% Creators",
  content: "We tried 4 different tools before finding Creator OS. The shift scheduling with performance tracking is exactly what OFM agencies need. Plus the creator portal keeps our talent happy and informed.",
  rating: 5,
  highlight: "4x faster onboarding"
}];

const useCases = [{
  title: "Growing Agencies",
  description: "From 5 to 500 creators, our platform scales with you without the operational chaos.",
  icon: Rocket
}, {
  title: "Established Operations",
  description: "Replace spreadsheets and scattered tools with one unified command center for your agency.",
  icon: Target
}, {
  title: "Premium Boutiques",
  description: "White-label portal gives your creators a professional, branded experience they'll love.",
  icon: Award
}];

const painPoints = [
  "Tracking earnings across OnlyFans, Fansly, and other platforms manually",
  "Not knowing which chatters are actually hitting their PPV targets",
  "Losing track of which creators need content plans this week",
  "Chatter shifts without visibility into messages sent or revenue generated",
  "No way to compare performance across your entire roster",
  "Hiring more team members just to handle administrative overhead"
];

const Landing = () => {
  return <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={myCreatorSuiteLogo} alt="Creator OS - OnlyFans Agency Management Software" className="h-10 w-auto animate-neon-glow" />
              <span className="text-xl font-bold gradient-text">Creator OS</span>
            </div>
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              <a href="#features" className="text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#comparison" className="text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors">
                Compare
              </a>
              <a href="#tools" className="text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors">
                AI Tools
              </a>
              <a href="#testimonials" className="text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </a>
              <a href="#pricing" className="text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90 glow-sm">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <MobileNav links={mainNavLinks} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[800px] h-[300px] sm:h-[600px] bg-primary/20 blur-[100px] sm:blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-accent/10 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs sm:text-sm text-primary font-medium">#1 Management Platform for Creator Agencies</span>
            </div>
            <img src={myCreatorSuiteLogo} alt="Creator OS Logo" className="h-20 sm:h-28 lg:h-32 w-auto mx-auto mb-6 sm:mb-8 animate-float animate-neon-glow" />
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6">
              <span className="gradient-text">Creator OS</span>
              <br />
              <span className="text-foreground text-2xl sm:text-4xl lg:text-6xl">Scale Your OnlyFans Agency with Confidence</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
              The all-in-one CRM built for OFM agencies. Manage creators, track revenue in real-time, optimize chatter performance, and automate operations—so you can focus on growth, not spreadsheets.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 glow-primary">
                  Start Your 14-Day Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-border hover:bg-muted">
                Watch 2-Minute Demo
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-4">No credit card required • Full access • Cancel anytime</p>
          </div>
          
          {/* Stats */}
          <div className="mt-12 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 max-w-4xl mx-auto">
            {[{
            value: "85%",
            label: "Less Admin Time"
          }, {
            value: "$50M+",
            label: "Revenue Tracked Monthly"
          }, {
            value: "10K+",
            label: "Active Creators Managed"
          }, {
            value: "24/7",
            label: "Automated Operations"
          }].map(stat => <div key={stat.label} className="glass-card p-4 sm:p-6">
                <div className="text-xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-muted-foreground mt-1 text-xs sm:text-sm">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Secondary Tools Section */}
      <section id="tools" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Powerful <span className="gradient-text">AI Tools</span> for Agency Growth
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Creator OS includes enterprise-grade AI tools to supercharge your fan engagement and content production.
            </p>
          </ScrollReveal>
          
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {secondaryTools.map(tool => <StaggerItem key={tool.title}>
                <Link to={tool.link} className="glass-card p-5 sm:p-8 text-center relative overflow-hidden group hover:border-primary/50 transition-all cursor-pointer block h-full">
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                    <span className={`text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${tool.badge === "Included" ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"}`}>
                      {tool.badge}
                    </span>
                  </div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                    <tool.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">{tool.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">{tool.description}</p>
                  <span className="text-primary text-xs sm:text-sm font-medium group-hover:underline">Learn more →</span>
                </Link>
              </StaggerItem>)}
          </StaggerContainer>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Sound <span className="gradient-text">Familiar?</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              These are the operational headaches every OFM agency owner knows too well.
            </p>
          </ScrollReveal>
          
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-12" staggerDelay={0.08}>
            {painPoints.map((pain, index) => <StaggerItem key={index}>
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-destructive text-xs sm:text-sm">✕</span>
                  </div>
                  <span className="text-sm sm:text-base text-foreground">{pain}</span>
                </div>
              </StaggerItem>)}
          </StaggerContainer>

          <ScrollReveal className="text-center" delay={0.2}>
            <p className="text-base sm:text-xl text-foreground mb-4 sm:mb-6">
              With <span className="gradient-text font-semibold">Creator OS</span>, these problems disappear.
            </p>
          </ScrollReveal>
          
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {useCases.map(useCase => <StaggerItem key={useCase.title}>
                <div className="glass-card p-4 sm:p-6 text-left h-full">
                  <useCase.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground">{useCase.description}</p>
                </div>
              </StaggerItem>)}
          </StaggerContainer>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Everything You Need to <span className="gradient-text">Scale Your Agency</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Powerful features designed specifically for OnlyFans and Fansly agencies to manage, grow, and profit—all in one platform.
            </p>
          </ScrollReveal>
          
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {features.map(feature => <StaggerItem key={feature.title}>
                <div className="glass-card p-4 sm:p-6 hover:border-primary/30 transition-all duration-300 group h-full">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-xl font-semibold text-foreground mb-1 sm:mb-2">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
                </div>
              </StaggerItem>)}
          </StaggerContainer>

          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" staggerDelay={0.08}>
            {additionalFeatures.map(feature => <StaggerItem key={feature.title}>
                <div className="p-3 sm:p-4 rounded-lg border border-border bg-card/50 hover:border-primary/30 transition-colors h-full">
                  <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1.5 sm:mb-2" />
                  <h4 className="font-medium text-foreground text-xs sm:text-sm mb-0.5 sm:mb-1">{feature.title}</h4>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </StaggerItem>)}
          </StaggerContainer>
        </div>
      </section>

      {/* Competitor Comparison Section */}
      <section id="comparison" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              See How We <span className="gradient-text">Compare</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Creator OS is the most comprehensive platform built specifically for OFM agencies. Here's how we stack up against the competition.
            </p>
          </ScrollReveal>
          
          <ScrollReveal>
            <div className="glass-card overflow-hidden">
              {/* Mobile: Card-based layout */}
              <div className="block lg:hidden">
                {competitorComparison.features.map((feature, featureIndex) => (
                  <div key={feature.name} className={`p-4 ${featureIndex !== competitorComparison.features.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="font-medium text-foreground mb-3 text-sm">{feature.name}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {competitorComparison.competitors.map((competitor) => (
                        <div 
                          key={competitor.name} 
                          className={`flex items-center justify-between p-2 rounded-lg ${competitor.highlight ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}
                        >
                          <span className={`text-xs ${competitor.highlight ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                            {competitor.name}
                          </span>
                          {competitor.values[featureIndex] === true ? (
                            <Check className={`h-4 w-4 ${competitor.highlight ? 'text-primary' : 'text-green-500'}`} />
                          ) : competitor.values[featureIndex] === false ? (
                            <X className="h-4 w-4 text-muted-foreground/50" />
                          ) : (
                            <span className="text-[10px] text-amber-500 font-medium">Partial</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table layout */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-semibold text-foreground">Features</th>
                      {competitorComparison.competitors.map((competitor) => (
                        <th 
                          key={competitor.name} 
                          className={`p-4 text-center font-semibold min-w-[140px] ${competitor.highlight ? 'text-primary bg-primary/5' : 'text-foreground'}`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            {competitor.name}
                            {competitor.highlight && (
                              <span className="text-[10px] font-normal bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                You're here
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {competitorComparison.features.map((feature, featureIndex) => (
                      <tr key={feature.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-foreground text-sm font-medium">{feature.name}</td>
                        {competitorComparison.competitors.map((competitor) => (
                          <td 
                            key={competitor.name} 
                            className={`p-4 text-center ${competitor.highlight ? 'bg-primary/5' : ''}`}
                          >
                            {competitor.values[featureIndex] === true ? (
                              <div className="flex justify-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${competitor.highlight ? 'bg-primary/20' : 'bg-green-500/20'}`}>
                                  <Check className={`h-4 w-4 ${competitor.highlight ? 'text-primary' : 'text-green-500'}`} />
                                </div>
                              </div>
                            ) : competitor.values[featureIndex] === false ? (
                              <div className="flex justify-center">
                                <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center">
                                  <X className="h-4 w-4 text-muted-foreground/50" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-amber-500 font-medium bg-amber-500/10 px-2 py-1 rounded-full">
                                Limited
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* CTA Row */}
              <div className="p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-t border-border">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-foreground font-semibold text-sm sm:text-base">Ready to switch to the industry leader?</p>
                    <p className="text-muted-foreground text-xs sm:text-sm">Join 500+ agencies that made the move to Creator OS</p>
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

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Get Started in <span className="gradient-text">Minutes</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              Three simple steps to transform your agency operations.
            </p>
          </ScrollReveal>
          
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[{
            step: "1",
            title: "Import Your Roster",
            description: "Add creators and team members in minutes. Connect OnlyFans accounts for automatic revenue syncing and real-time earnings tracking."
          }, {
            step: "2",
            title: "Assign & Schedule",
            description: "Assign chatters to creators, set performance targets, and schedule shifts with our visual roster builder and coverage gap detection."
          }, {
            step: "3",
            title: "Track & Optimize",
            description: "Monitor real-time performance dashboards. Get actionable insights on top performers and areas for improvement."
          }].map(item => <StaggerItem key={item.step}>
                <div className="glass-card p-5 sm:p-8 text-center h-full">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <span className="text-xl sm:text-3xl font-bold gradient-text">{item.step}</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{item.description}</p>
                </div>
              </StaggerItem>)}
          </StaggerContainer>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Trusted by <span className="gradient-text">Leading OFM Agencies</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              See why top OnlyFans agency owners choose Creator OS to power their operations.
            </p>
          </ScrollReveal>
          
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map(testimonial => <StaggerItem key={testimonial.name}>
                <div className="glass-card p-4 sm:p-6 h-full">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex gap-0.5 sm:gap-1">
                      {Array.from({
                    length: testimonial.rating
                  }).map((_, i) => <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-primary text-primary" />)}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-primary bg-primary/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      {testimonial.highlight}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-foreground mb-3 sm:mb-4 leading-relaxed">"{testimonial.content}"</p>
                  <div>
                    <div className="text-sm sm:text-base font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </StaggerItem>)}
          </StaggerContainer>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              Choose the tier that matches your agency's stage. Scale as you grow.
            </p>
          </ScrollReveal>
          
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Core */}
            <div className="glass-card p-6 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">CORE</h3>
                <p className="text-sm text-primary">"Visibility"</p>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">$69</div>
              <div className="text-muted-foreground text-sm mb-4">per month</div>
              <p className="text-xs text-muted-foreground mb-4">Solo managers & small agencies who want clarity</p>
              <ul className="space-y-2 mb-6 flex-1">
                {["Up to 2 creators, 3 team members", "Unified employee management", "Basic shift scheduling", "Creator profiles + onboarding", "50 GB Content Vault", "Task management dashboard", "Basic performance tracking"].map(item => <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>)}
              </ul>
              <div className="p-3 bg-muted/50 rounded-lg mb-4">
                <p className="text-xs text-muted-foreground italic">"Is my operation even working?"</p>
              </div>
              <Link to="/auth" className="mt-auto">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>
            
            {/* Scale - Most Popular */}
            <div className="glass-card p-6 border-primary/50 relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                Most Popular
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">SCALE</h3>
                <p className="text-sm text-primary">"Operational Control"</p>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">$129</div>
              <div className="text-muted-foreground text-sm mb-4">per month</div>
              <p className="text-xs text-muted-foreground mb-4">Real agencies running teams</p>
              <ul className="space-y-2 mb-6 flex-1">
                {["Up to 6 creators, 15 team members", "Advanced chatter performance tracking", "PPV & revenue analytics per shift", "Recruiting pipeline with follow-ups", "Coverage gap detection", "200 GB Content Vault", "Priority support"].map(item => <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>)}
              </ul>
              <div className="p-3 bg-primary/10 rounded-lg mb-4">
                <p className="text-xs text-primary italic">"Where am I leaking money and time?"</p>
              </div>
              <Link to="/auth" className="mt-auto">
                <Button className="w-full bg-primary hover:bg-primary/90">Start 14-Day Free Trial</Button>
              </Link>
            </div>
            
            {/* Pro */}
            <div className="glass-card p-6 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">PRO</h3>
                <p className="text-sm text-primary">"AI-Powered Growth"</p>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">$249</div>
              <div className="text-muted-foreground text-sm mb-4">per month</div>
              <p className="text-xs text-muted-foreground mb-4">Agencies unlocking AI capabilities</p>
              <ul className="space-y-2 mb-6 flex-1">
                {["Up to 15 creators, 40 team members", "AI-powered performance insights", "Automated daily summaries", "Creator consistency scoring", "Staff reliability metrics", "600 GB Content Vault", "Early access to features"].map(item => <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>)}
              </ul>
              <div className="p-3 bg-muted/50 rounded-lg mb-4">
                <p className="text-xs text-muted-foreground italic">"Unlock the power of AI for my agency."</p>
              </div>
              <Link to="/auth" className="mt-auto">
                <Button variant="outline" className="w-full">Start 14-Day Free Trial</Button>
              </Link>
            </div>
            
            {/* Enterprise */}
            <div className="glass-card p-6 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">ENTERPRISE</h3>
                <p className="text-sm text-primary">"Systems Command"</p>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">$399+</div>
              <div className="text-muted-foreground text-sm mb-4">custom pricing</div>
              <p className="text-xs text-muted-foreground mb-4">Large agencies & multi-brand operators</p>
              <ul className="space-y-2 mb-6 flex-1">
                {["Unlimited creators & team members", "AI Chatting System", "AI Voice Cloner", "AI Content Generator", "Custom KPIs & automations", "White-label experience", "1 TB+ Content Vault", "Dedicated implementation", "SLA + roadmap influence"].map(item => <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>)}
              </ul>
              <div className="p-3 bg-muted/50 rounded-lg mb-4">
                <p className="text-xs text-muted-foreground italic">"Run the agency like a company, not a hustle."</p>
              </div>
              <Button variant="outline" className="w-full mt-auto">Contact Sales</Button>
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <div className="glass-card p-6 sm:p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
                  Ready to Scale Your OnlyFans Agency?
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Join 500+ OFM agencies already using Creator OS to streamline operations, boost revenue, and scale without the stress.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                  <Link to="/auth">
                    <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 glow-primary">
                      Start Your Free Trial Now
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </Link>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6">
                  No credit card required • 14-day free trial • Full feature access
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="col-span-2 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <img src={myCreatorSuiteLogo} alt="Creator OS - OnlyFans Agency Software" className="h-6 sm:h-8 w-auto animate-neon-glow" />
                <span className="text-base sm:text-lg font-semibold text-foreground">Creator OS</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                The #1 management platform for OnlyFans and Fansly agencies. Manage creators, track revenue, schedule chatter shifts, and scale operations with AI-powered tools. Trusted by 500+ agencies worldwide.
              </p>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2 sm:mb-3">Product</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#tools" className="hover:text-foreground transition-colors">AI Tools</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2 sm:mb-3">Use Cases</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">OnlyFans Agencies</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Fansly Management</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Multi-Platform Agencies</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-border">
            <div className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left">
              © 2025 My Creator Suite. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground text-center">
              <span>mycreatorsuite.com — The best software for OnlyFans agencies.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;
