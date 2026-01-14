import { ArrowRight, Star, Users, DollarSign, TrendingUp, Zap, Shield, Clock, CheckCircle, BarChart3, MessageSquare, Calendar, FileText, Award, Sparkles, Target, Rocket, Mic, Image, Headphones, X, Check, Bot, BrainCircuit, Tag, Inbox, UserPlus, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/landing/MobileNav";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";
import myCreatorSuiteLogo from "@/assets/mycreatorsuite-logo.png";
import { useState } from "react";

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

// AI Chatter Bot Features
const aiChatterFeatures = [
  "Sounds like you and stays on-brand",
  "Bumps fans to spark engagement",
  "Instant replies, zero missed fans",
  "Finds hidden spenders automatically",
  "You're in control: choose who it chats with and when (assist or autopilot)"
];

// Chatting Tools
const chattingTools = [{
  icon: Tag,
  title: "Fan CRM",
  description: "Track information on your fans and build stronger relationships. AI-powered CRM automatically documents info from your chats on the fly."
}, {
  icon: Inbox,
  title: "Vault & Inbox Manager",
  description: "Identify hot fans and big spenders in your inbox, and focus on the chats that make you the most money."
}, {
  icon: MessageSquare,
  title: "Message Library",
  description: "Use a library of pre-made messages including PPVs to chat quickly. Auto-complete, folders, and smart search for lightning-fast replies."
}, {
  icon: DollarSign,
  title: "PPV Price Optimizer",
  description: "Stop undercharging your content. Get the best pricing for every PPV, tailored by AI to each fan's spending behavior."
}];

// Manager Tools
const managerTools = [{
  icon: BarChart3,
  title: "Friendly Dashboard",
  description: "Track what matters and see how to improve with real-time analytics on sales, messages, and performance."
}, {
  icon: Shield,
  title: "Secure Account Access",
  description: "Custom permissions for your team. Grant or revoke access to specific accounts, sensitive data, or actions without sharing passwords."
}, {
  icon: TrendingUp,
  title: "Team Performance Monitoring",
  description: "Track your team's sales, messages, open chats, and PPVs sent. See exactly who sent each message."
}, {
  icon: Bell,
  title: "Push Notifications",
  description: "Get instant updates on new sales, messages, and subs with push notifications straight to your phone."
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
  icon: Bot,
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
  title: "Marketing Analytics",
  description: "Track subscriber trends, page conversion rates, and avg fan spending (LTV) with real-time insights."
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
      name: "Supercreator",
      highlight: false,
      values: [true, true, false, true, false, true, true, false, false, false, false, true]
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
    }
  ]
};

const testimonials = [{
  name: "Larkin L.",
  role: "Top 0.1% Creator",
  content: "Creator OS has completely transformed how I manage my VIP profile. The built-in AI chatter feels incredibly lifelike and intuitive. It engages fans naturally, keeps conversations flowing, and knows exactly how to upsell without being pushy.",
  rating: 5,
  highlight: "Revenue increased 40%"
}, {
  name: "Patrick M.",
  role: "Founder, Bad Bunny Agency",
  content: "Creator OS has been huge for us. It really helped us focus on our quality fans, which was a gamechanger when we were trying to scale. We implemented it early on and definitely recommend it for any agency trying to scale right now.",
  rating: 5,
  highlight: "Scaled to 50+ creators"
}, {
  name: "Maya H.",
  role: "Heiss Management",
  content: "The tools have helped me create a money-making system without any effort on my end and with consistent results from my chatters. My Mass Messages revenue grew up significantly as well.",
  rating: 5,
  highlight: "10x mass message revenue"
}, {
  name: "Ashley K.",
  role: "Hush House Agency",
  content: "This software has revolutionized the way we do business. It has helped our chatters utilize pricing and enabled us to be a better service for our content creators and their fans.",
  rating: 5,
  highlight: "28% PPV increase"
}, {
  name: "Daniel R.",
  role: "Top 0.5% Creator",
  content: "Super useful tool! I didn't realize how much time I was spending talking to freeloaders. This has really taught me to utilize my time in a more productive way. Plus, the team is always there to answer right away.",
  rating: 5,
  highlight: "15 hrs/week saved"
}, {
  name: "Sophia H.",
  role: "Owner, Elyziun Agency",
  content: "Since switching to Creator OS, we've seen a noticeable increase in revenue and our team efficiency has improved dramatically. The analytics alone are worth the investment.",
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

const faqs = [{
  question: "What is Creator OS?",
  answer: "Creator OS is the all-in-one management platform for OnlyFans and Fansly agencies. We help you manage creators, track revenue in real-time, optimize chatter performance, and automate operations—so you can focus on growth, not spreadsheets."
}, {
  question: "Is Creator OS safe to use on OnlyFans?",
  answer: "Absolutely. Creator OS uses secure API connections and never requires you to share passwords. Our platform is designed with security-first principles, including role-based access controls and encrypted data storage."
}, {
  question: "How does the AI chatter work?",
  answer: "Our AI is trained on millions of real conversations to sell like a pro. It replies instantly in your creator's voice, in any language, 24/7. You maintain full control—choose who the AI chats with and when (assist mode or full autopilot)."
}, {
  question: "Can Creator OS replace human chatters completely?",
  answer: "While our AI can handle a significant portion of fan interactions, most agencies use it alongside human chatters. The AI handles routine messages and bumps, freeing your team to focus on high-value conversations and VIP fans."
}, {
  question: "What features should I look for in OnlyFans management software?",
  answer: "Key features include: real-time revenue tracking, chatter performance analytics, shift scheduling, content vault management, AI-powered messaging, and a creator portal. Creator OS includes all of these and more."
}, {
  question: "Can I customize the AI to match my creator's personality?",
  answer: "Yes! Our AI learns from chat history and can be trained on your creator's unique voice, tone, and selling style. It stays on-brand and sounds natural to fans."
}];

const Landing = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
                  Start Now - It's Free
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
              <span className="text-xs sm:text-sm text-primary font-medium">The #1 AI Platform for OnlyFans Agencies</span>
            </div>
            <img src={myCreatorSuiteLogo} alt="Creator OS Logo" className="h-20 sm:h-28 lg:h-32 w-auto mx-auto mb-6 sm:mb-8 animate-float animate-neon-glow" />
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6">
              <span className="text-foreground">The OnlyFans AI Platform</span>
              <br />
              <span className="gradient-text text-2xl sm:text-4xl lg:text-6xl">That Chats for You</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
              Creator OS helps OnlyFans creators and agencies grow with AI — One hub for chats, fans, sales, and team management.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 glow-primary">
                  Start Now - It's Free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-border hover:bg-muted">
                Book A Demo
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-4">Try it free. No credit card required.</p>
          </div>
          
          {/* Stats */}
          <div className="mt-12 sm:mt-20">
            <p className="text-sm sm:text-base text-muted-foreground mb-6">Join 25,000+ creators that work less and earn more:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 max-w-4xl mx-auto">
              {[{
                value: "25K+",
                label: "Creators & Agencies"
              }, {
                value: "$100M+",
                label: "Revenue Tracked"
              }, {
                value: "500M+",
                label: "Messages Analyzed"
              }, {
                value: "24/7",
                label: "AI-Powered Support"
              }].map(stat => <div key={stat.label} className="glass-card p-4 sm:p-6">
                    <div className="text-xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
                    <div className="text-muted-foreground mt-1 text-xs sm:text-sm">{stat.label}</div>
                  </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Sell More Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Sell More, <span className="gradient-text">Stress Less</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              The best way to manage and grow your OnlyFans — One hub to automate chats, manage fans and team members, and boost sales.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* AI Chatter Section */}
      <section id="ai-chatter" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">AI Chatter</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                AI that Chats & Sells <span className="gradient-text">Like You</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                Chatting sucks. Our AI does it for you. Trained on 500M+ real chats to sell like a pro, it replies instantly in your voice, in any language, 24/7.
              </p>
              <ul className="space-y-3 mb-6">
                {aiChatterFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/tools/chatting">
                <Button className="bg-primary hover:bg-primary/90">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="glass-card p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <BrainCircuit className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">AI-Powered Conversations</h3>
                <p className="text-muted-foreground">Our AI learns your creator's voice and handles fan conversations naturally, upselling PPVs without being pushy.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Chatting Tools Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Tools For Chatting</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Chat Faster, <span className="gradient-text">Sell More</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Our chatting tools help you chat faster, track fan info and sent content, and send the best PPV.
            </p>
          </ScrollReveal>
          
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {chattingTools.map(tool => <StaggerItem key={tool.title}>
                <div className="glass-card p-5 sm:p-6 text-center h-full hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <tool.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </div>
              </StaggerItem>)}
          </StaggerContainer>
        </div>
      </section>

      {/* Manager Tools Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Tools For Managers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Easily Manage Your <span className="gradient-text">Team and Accounts</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Run your team and accounts with speed, security, and full control.
            </p>
          </ScrollReveal>
          
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {managerTools.map(tool => <StaggerItem key={tool.title}>
                <div className="glass-card p-5 sm:p-6 text-center h-full hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <tool.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </div>
              </StaggerItem>)}
          </StaggerContainer>
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
                    <p className="text-muted-foreground text-xs sm:text-sm">Join 25,000+ creators and agencies that made the move to Creator OS</p>
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
              You're 2 minutes away from your new AI powers!
            </p>
          </ScrollReveal>
          
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[{
            step: "1",
            title: "Connect Your Account",
            description: "Link your OnlyFans accounts securely. No password sharing required—we use encrypted API connections for maximum security."
          }, {
            step: "2",
            title: "Set Up Your AI",
            description: "Train the AI on your creator's voice and selling style. Configure permissions and set your team access levels."
          }, {
            step: "3",
            title: "Watch Revenue Grow",
            description: "Let AI handle routine chats while you focus on VIPs. Monitor real-time analytics and optimize performance."
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
      <section id="testimonials" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Star className="h-4 w-4 text-primary fill-primary" />
              <span className="text-sm text-primary font-medium">Wall Of Love</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              You're In <span className="gradient-text">Good Company</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              Join 25,000+ creators and agencies who became top earners with Creator OS.
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
      <section id="pricing" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Start Free, <span className="gradient-text">Grow with AI</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              Join 25,000+ creators and agencies today. Pricing adjusts to your earnings.
            </p>
          </ScrollReveal>
          
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* CRM Lite - Free */}
            <div className="glass-card p-6 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">CRM Lite</h3>
                <p className="text-sm text-muted-foreground">Free CRM with all basic tools</p>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">Free</div>
              <div className="text-muted-foreground text-sm mb-4">Up to 10 accounts</div>
              <ul className="space-y-2 mb-6 flex-1">
                {["Multi-Account Desktop App", "Fan CRM", "Permission Management", "Mobile App with Push Notifications", "Basic Account Analytics", "Emoji Keyboard"].map(item => <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>)}
              </ul>
              <Link to="/auth" className="mt-auto">
                <Button variant="outline" className="w-full">Get Started Free</Button>
              </Link>
            </div>
            
            {/* CRM Premium */}
            <div className="glass-card p-6 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">CRM Premium</h3>
                <p className="text-sm text-primary">Chat copilot & analytics</p>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">$49</div>
              <div className="text-muted-foreground text-sm mb-4">per account/month</div>
              <ul className="space-y-2 mb-6 flex-1">
                {["Everything in CRM Lite", "500 AI Messages included", "AI Message Copilot", "Message Library", "Inbox Copilot", "Pricing Copilot", "Chatters Analytics", "Advanced Analytics"].map(item => <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>)}
              </ul>
              <Link to="/auth" className="mt-auto">
                <Button variant="outline" className="w-full">Start 14-Day Trial</Button>
              </Link>
            </div>
            
            {/* Super AI - Most Popular */}
            <div className="glass-card p-6 border-primary/50 relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                Most Popular
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Super AI</h3>
                <p className="text-sm text-primary">Chat & Sell on autopilot</p>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">$99</div>
              <div className="text-muted-foreground text-sm mb-4">per account + 5% AI sales</div>
              <ul className="space-y-2 mb-6 flex-1">
                {["Everything in CRM Premium", "Unlimited AI Messages", "Bump Fans Automatically", "Auto Follow-Back Expired Fans", "Message Flow Automation", "Super Mass Message", "AI Pricing Optimization", "Full Mobile Control"].map(item => <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>)}
              </ul>
              <Link to="/auth" className="mt-auto">
                <Button className="w-full bg-primary hover:bg-primary/90">Start 14-Day Free Trial</Button>
              </Link>
            </div>
            
            {/* Enterprise */}
            <div className="glass-card p-6 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Big Agencies</h3>
                <p className="text-sm text-primary">20+ accounts</p>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">Custom</div>
              <div className="text-muted-foreground text-sm mb-4">Let's talk</div>
              <ul className="space-y-2 mb-6 flex-1">
                {["Everything in Super AI", "Volume Discounts", "Custom Features & Settings", "Dedicated Success Manager", "AI Voice Cloner", "AI Content Generator", "White-Label Experience", "Priority Support & SLA"].map(item => <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>)}
              </ul>
              <Button variant="outline" className="w-full mt-auto">Contact Sales</Button>
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </ScrollReveal>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-4 sm:p-6 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-foreground text-sm sm:text-base pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <p className="text-sm sm:text-base text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
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
                  Start Free Today
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Become a top earner — 14 days free trial. You're 2 minutes away from your new AI powers!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                  <Link to="/auth">
                    <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 glow-primary">
                      Try for Free
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-border hover:bg-muted">
                    Book A Demo
                  </Button>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6">
                  No Credit Card Required.
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
                The #1 AI platform for OnlyFans creators and agencies. Manage creators, automate chats, track revenue, and scale operations with AI-powered tools. Trusted by 25,000+ creators worldwide.
              </p>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2 sm:mb-3">Product</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#tools" className="hover:text-foreground transition-colors">AI Tools</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Case Studies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2 sm:mb-3">Resources</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-border">
            <div className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left">
              © 2025 My Creator Suite. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground text-center">
              <span>mycreatorsuite.com — The #1 AI platform for OnlyFans.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;
