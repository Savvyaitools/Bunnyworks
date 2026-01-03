import { ArrowRight, Star, Users, DollarSign, TrendingUp, Zap, Shield, Clock, CheckCircle, BarChart3, MessageSquare, Calendar, FileText, Award, Sparkles, Target, Rocket, Mic, Image, Headphones } from "lucide-react";
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
  title: "Complete Creator Management",
  description: "Centralized dashboard to manage all your creators, track their performance, and streamline communication in one powerful hub."
}, {
  icon: DollarSign,
  title: "Revenue & Commission Tracking",
  description: "Real-time earnings tracking, automated commission calculations, and detailed financial reports to maximize your agency's profitability."
}, {
  icon: TrendingUp,
  title: "Advanced Growth Analytics",
  description: "Deep-dive into performance metrics, identify growth opportunities, and make data-driven decisions to scale your agency faster."
}, {
  icon: Zap,
  title: "Workflow Automation",
  description: "Automate repetitive tasks, set up smart notifications, and free up your team to focus on what matters most—growing revenue."
}, {
  icon: Shield,
  title: "Secure Creator Portal",
  description: "White-labeled portal where creators access their earnings, download content plans, and communicate directly with your team."
}, {
  icon: Clock,
  title: "Real-time Collaboration",
  description: "Instant notifications, live activity feeds, and team messaging keep everyone aligned and moving fast."
}];
const secondaryTools = [{
  icon: MessageSquare,
  title: "AI-Powered Chatting System",
  description: "Intelligent chat management for creators with automation, smart replies, and seamless fan engagement at scale.",
  badge: "Enterprise",
  link: "/tools/chatting"
}, {
  icon: Mic,
  title: "AI NSFW Voice Cloner",
  description: "Clone creator voices for personalized audio content. Create authentic voice messages that fans love.",
  badge: "Enterprise",
  link: "/tools/voice-cloner"
}, {
  icon: Image,
  title: "AI NSFW Content Generator",
  description: "Generate high-quality, platform-ready content using AI. Scale content production without limits.",
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
  description: "Generate, track, and manage invoices with automatic payment status updates."
}, {
  icon: BarChart3,
  title: "Shift & Time Tracking",
  description: "Monitor team shifts, clock-in/out times, and productivity analytics."
}];
const testimonials = [{
  name: "Sarah M.",
  role: "Agency Owner, 50+ Creators",
  content: "Creator OS transformed how we manage our roster. Revenue tracking that used to take hours now happens automatically. We've scaled from 20 to 50 creators without adding admin staff.",
  rating: 5,
  highlight: "Revenue up 40%"
}, {
  name: "Alex K.",
  role: "Top-Tier Creator",
  content: "The creator portal is a game-changer. I can see my earnings, download content plans, and message my team instantly. No more endless email chains or spreadsheet confusion.",
  rating: 5,
  highlight: "Hours saved weekly"
}, {
  name: "Jessica R.",
  role: "Agency Operations Director",
  content: "We tried 5 different tools before finding Creator OS. Nothing else comes close for managing a serious agency. The automation alone saves us 20+ hours per week.",
  rating: 5,
  highlight: "20+ hours saved/week"
}];
const useCases = [{
  title: "Growing Agencies",
  description: "From 5 to 500 creators, our platform scales with you without the chaos.",
  icon: Rocket
}, {
  title: "Established Operations",
  description: "Replace spreadsheets and scattered tools with one unified command center.",
  icon: Target
}, {
  title: "Premium Boutiques",
  description: "White-label portal gives your creators a professional, branded experience.",
  icon: Award
}];
const Landing = () => {
  return <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={myCreatorSuiteLogo} alt="My Creator Suite" className="h-10 w-auto animate-neon-glow" />
              <span className="text-xl font-bold gradient-text">MyCreatorSuite</span>
            </div>
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <a href="#features" className="text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors">
                Features
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
              <span className="text-xs sm:text-sm text-primary font-medium">Launching — The Complete Creator Agency Suite</span>
            </div>
            <img src={myCreatorSuiteLogo} alt="My Creator Suite" className="h-20 sm:h-28 lg:h-32 w-auto mx-auto mb-6 sm:mb-8 animate-float animate-neon-glow" />
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6">
              <span className="gradient-text">Creator OS</span>
              <br />
              <span className="text-foreground text-2xl sm:text-4xl lg:text-6xl">Run Your Agency Like a Machine</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
              The flagship agency management platform from My Creator Suite. Manage creators, track revenue, and scale your agency—plus access powerful AI tools for chatting, voice cloning, and content generation.
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
            value: "500+",
            label: "Agencies Trust Us"
          }, {
            value: "$50M+",
            label: "Revenue Tracked"
          }, {
            value: "10K+",
            label: "Creators Managed"
          }, {
            value: "99.9%",
            label: "Uptime Guaranteed"
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
              Powerful <span className="gradient-text">AI Tools</span> Included
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Creator OS comes with a suite of AI-powered tools to supercharge your agency operations.
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
              These are the headaches every agency owner knows too well.
            </p>
          </ScrollReveal>
          
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-12" staggerDelay={0.08}>
            {["Tracking earnings across 10 different spreadsheets", "Chasing creators for content submissions", "Missing payment deadlines and losing trust", "No visibility into team performance", "Endless DMs and email threads", "Scaling feels impossible without hiring more"].map((pain, index) => <StaggerItem key={index}>
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
              Everything You Need to <span className="gradient-text">Scale</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Powerful features designed specifically for creator agencies to manage, grow, and profit—all in one platform.
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

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
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
            title: "Add Your Creators",
            description: "Import your creator roster, set up profiles, and connect their social accounts. Takes less than 5 minutes per creator."
          }, {
            step: "2",
            title: "Invite Your Team",
            description: "Bring your managers, chatters, and admins on board. Set permissions and assign creators to team members."
          }, {
            step: "3",
            title: "Watch Revenue Grow",
            description: "Track earnings in real-time, automate tasks, and use insights to scale. Your creators get their own portal too."
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
              Trusted by <span className="gradient-text">Industry Leaders</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              See why top agencies choose Creator OS to power their operations.
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
                {["Up to 2 creators", "Up to 3 employees", "50 GB Content Vault", "Creator profiles + onboarding", "Employee onboarding", "Task management", "Basic performance tracking", "Agency progress dashboard"].map(item => <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
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
                {["Up to 6 creators", "Up to 15 employees", "200 GB Content Vault", "Recruitment form + lead pipeline", "Advanced creator profiles", "Role-based employee views", "Performance analytics", "Task backlog & bottleneck detection", "System health dashboard", "Priority support"].map(item => <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
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
                {["Up to 15 creators", "Up to 40 employees", "600 GB Content Vault", "Everything in Scale", "Advanced performance metrics", "Creator consistency scoring", "Staff reliability scoring", "Workflow friction indicators", "Executive dashboard", "Early access to features"].map(item => <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
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
                {["Unlimited creators", "Unlimited employees", "1 TB+ Content Vault", "AI Chatting System", "AI NSFW Voice Cloner", "AI NSFW Content Generator", "Fully customized dashboards", "Custom KPIs & metrics", "Agency-specific logic", "White-labeled experience", "Dedicated implementation", "SLA + roadmap influence"].map(item => <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
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
                  Ready to Transform Your Agency?
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Join 500+ agencies already using Creator OS to streamline operations, boost revenue, and scale without the stress.
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
                <img src={myCreatorSuiteLogo} alt="My Creator Suite" className="h-6 sm:h-8 w-auto animate-neon-glow" />
                <span className="text-base sm:text-lg font-semibold text-foreground">Creator OS</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                The flagship product of mycreatorsuite.com — the all-in-one platform for creator agencies to manage talent, track revenue, and scale operations with AI-powered tools.
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
              <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2 sm:mb-3">Company</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-border">
            <div className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left">
              © 2024 My Creator Suite. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground text-center">
              <span>mycreatorsuite.com — Built for agencies that want to win.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;