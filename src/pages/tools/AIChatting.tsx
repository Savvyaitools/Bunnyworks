import { ArrowRight, MessageSquare, Zap, Clock, Users, Shield, Bot, BarChart3, Sparkles, CheckCircle, Star, DollarSign, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/landing/MobileNav";
import myCreatorSuiteLogo from "@/assets/mycreatorsuite-logo.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Voice Cloner", href: "/tools/voice-cloner" },
  { label: "Content Generator", href: "/tools/content-generator" },
];

const features = [
  {
    icon: Bot,
    title: "AI-Powered Smart Replies",
    description: "Generate contextual responses that match your creator's unique voice and personality. Reduce chatter typing time by 80%."
  },
  {
    icon: Clock,
    title: "24/7 Automated Engagement",
    description: "Never miss a fan message. AI handles initial responses and escalates high-value conversations to your team automatically."
  },
  {
    icon: Users,
    title: "Multi-Creator Management",
    description: "Manage conversations for all your creators from one unified dashboard with seamless account switching."
  },
  {
    icon: Zap,
    title: "Smart PPV Suggestions",
    description: "AI analyzes conversation context and suggests optimal PPV content to send, maximizing revenue per fan interaction."
  },
  {
    icon: BarChart3,
    title: "Conversation Analytics",
    description: "Track response times, engagement rates, and PPV conversion metrics to optimize your chatting strategy."
  },
  {
    icon: Shield,
    title: "Content Moderation",
    description: "Built-in safety filters and moderation tools keep conversations appropriate and on-brand for each creator."
  }
];

const benefits = [
  "Reduce average response time from 4 hours to 4 minutes",
  "Handle 500+ simultaneous conversations per creator",
  "Smart escalation routes high-value fans to human chatters",
  "Train AI on each creator's unique personality and style",
  "Built-in PPV suggestion engine for revenue optimization",
  "24/7 coverage without chatter burnout"
];

const stats = [
  { value: "10x", label: "More Conversations Handled" },
  { value: "80%", label: "Faster Response Time" },
  { value: "35%", label: "Higher PPV Conversion" }
];

const AIChatting = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src={myCreatorSuiteLogo} 
                alt="Creator OS - AI Chatting System" 
                className="h-10 w-auto animate-neon-glow"
              />
              <span className="text-xl font-bold gradient-text">Creator OS</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link to="/tools/voice-cloner" className="text-muted-foreground hover:text-foreground transition-colors">
                Voice Cloner
              </Link>
              <Link to="/tools/content-generator" className="text-muted-foreground hover:text-foreground transition-colors">
                Content Generator
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90 glow-sm">
                  Try Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <MobileNav links={navLinks} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Enterprise Plan Feature</span>
            </div>
            
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8 animate-float">
              <MessageSquare className="h-12 w-12 text-primary" />
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="gradient-text">AI-Powered Fan Messaging</span>
              <br />
              <span className="text-foreground text-3xl sm:text-4xl lg:text-5xl">Engage 10x More Fans Without Hiring More Chatters</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              The AI Chatting System learns your creators' voice and handles routine fan conversations automatically. Your chatters focus on high-value interactions while AI manages the rest—24/7, without burnout.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 glow-primary">
                  Start Chatting Smarter
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/#pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border hover:bg-muted">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-6 text-center">
              <div className="text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-muted-foreground mt-1 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why OFM Agencies <span className="gradient-text">Love It</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Scale your fan engagement without scaling your chatter payroll.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Powerful <span className="gradient-text">Features</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to manage fan conversations at scale and maximize revenue per interaction.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.title} 
                className="glass-card p-6 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Train the AI", description: "Upload sample conversations and let AI learn your creator's unique voice, tone, and personality." },
              { step: "2", title: "Set Rules & Escalations", description: "Define when AI handles conversations vs. when to escalate to human chatters for high-value fans." },
              { step: "3", title: "Scale Engagement", description: "AI manages routine messages 24/7 while your team focuses on closing sales and building relationships." }
            ].map((item) => (
              <div key={item.step} className="glass-card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold gradient-text">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
            <div className="relative z-10">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Ready to Transform Your Fan Engagement?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                The AI Chatting System is available on Enterprise plans. Start engaging fans smarter and scaling revenue today.
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 glow-primary">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img 
              src={myCreatorSuiteLogo} 
              alt="Creator OS" 
              className="h-8 w-auto rounded-lg"
              style={{ mixBlendMode: 'screen' }}
            />
            <span className="text-lg font-semibold text-foreground">Creator OS</span>
          </div>
          <div className="text-muted-foreground text-sm">
            © 2025 My Creator Suite. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AIChatting;
