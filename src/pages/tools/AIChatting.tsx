import { ArrowRight, MessageSquare, Zap, Clock, Users, Shield, Bot, BarChart3, Sparkles, CheckCircle, Star } from "lucide-react";
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
    description: "Let AI suggest contextual responses that match your creator's voice and personality, saving hours of typing."
  },
  {
    icon: Clock,
    title: "24/7 Automated Engagement",
    description: "Never miss a fan message. AI handles initial responses and escalates important conversations to your team."
  },
  {
    icon: Users,
    title: "Multi-Creator Management",
    description: "Manage conversations for all your creators from one unified dashboard with seamless switching."
  },
  {
    icon: Zap,
    title: "Instant Response Templates",
    description: "Create and deploy custom response templates that can be personalized on-the-fly with AI assistance."
  },
  {
    icon: BarChart3,
    title: "Conversation Analytics",
    description: "Track response times, engagement rates, and conversion metrics to optimize your chatting strategy."
  },
  {
    icon: Shield,
    title: "Content Moderation",
    description: "Built-in safety filters and moderation tools to keep conversations appropriate and on-brand."
  }
];

const benefits = [
  "Reduce response time by 80%",
  "Handle 10x more conversations",
  "Increase fan satisfaction scores",
  "Scale without hiring more chatters",
  "Consistent brand voice across all creators",
  "Real-time conversation monitoring"
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
                alt="My Creator Suite" 
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-8">
              <MessageSquare className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Included with All Plans</span>
            </div>
            
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8 animate-float">
              <MessageSquare className="h-12 w-12 text-primary" />
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="gradient-text">AI Chatting System</span>
              <br />
              <span className="text-foreground text-3xl sm:text-4xl lg:text-5xl">Engage Fans at Scale</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Supercharge your fan engagement with intelligent chat automation. Handle thousands of conversations simultaneously while maintaining the personal touch fans expect.
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

      {/* Benefits Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Agencies <span className="gradient-text">Love It</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Powerful <span className="gradient-text">Features</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to manage fan conversations at scale.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
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

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
            <div className="relative z-10">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Ready to Transform Your Chatting?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                The AI Chatting System is included with every Creator OS plan. Start engaging fans smarter today.
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
              alt="My Creator Suite" 
              className="h-8 w-auto rounded-lg"
              style={{ mixBlendMode: 'screen' }}
            />
            <span className="text-lg font-semibold text-foreground">Creator OS</span>
          </div>
          <div className="text-muted-foreground text-sm">
            © 2024 My Creator Suite. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AIChatting;
