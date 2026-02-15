import { ArrowRight, Mic, Zap, Clock, Users, Shield, Headphones, Sparkles, CheckCircle, Lock, Heart, Gift, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/landing/MobileNav";
import myCreatorSuiteLogo from "@/assets/mycreatorsuite-logo.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "AI Chatting", href: "/tools/chatting" },
  { label: "Content Generator", href: "/tools/content-generator" },
];

const features = [
  {
    icon: Mic,
    title: "Ultra-Realistic Voice Cloning",
    description: "Clone any creator's voice with just 30 seconds of audio. Indistinguishable from the real thing—fans can't tell the difference."
  },
  {
    icon: Headphones,
    title: "Custom Audio Messages",
    description: "Generate personalized voice messages for fans that sound exactly like your creator, at any time of day."
  },
  {
    icon: Zap,
    title: "Instant Generation",
    description: "Create voice content in seconds. No waiting, no recording sessions needed—just type and generate."
  },
  {
    icon: Users,
    title: "Multi-Voice Library",
    description: "Store and manage voice profiles for all your creators in one secure vault with easy access."
  },
  {
    icon: Shield,
    title: "Privacy Protected",
    description: "Voice data is encrypted and never shared. Full control over who can use each voice profile."
  },
  {
    icon: Clock,
    title: "24/7 Voice Content",
    description: "Create voice content anytime, even when your creator is sleeping, traveling, or unavailable."
  }
];

const useCases = [
  {
    icon: Gift,
    title: "Birthday Shoutouts & Milestones",
    description: "Send custom voice messages to top fans for birthdays, subscription anniversaries, or spending milestones."
  },
  {
    icon: Heart,
    title: "Personalized Welcome Messages",
    description: "Generate unique welcome audio for new subscribers that makes them feel special from day one."
  },
  {
    icon: Star,
    title: "Custom PPV Audio Content",
    description: "Create voice notes and audio content for premium PPV bundles without any studio time."
  }
];

const stats = [
  { value: "30s", label: "Audio Sample Needed" },
  { value: "99%", label: "Voice Accuracy" },
  { value: "∞", label: "Messages You Can Create" }
];

const AIVoiceCloner = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src={myCreatorSuiteLogo} 
                alt="Creator OS - AI Voice Cloner" 
                className="h-10 w-auto animate-neon-glow"
              />
              <span className="text-xl font-bold gradient-text">Creator OS</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link to="/tools/chatting" className="text-muted-foreground hover:text-foreground transition-colors">
                AI Chatting
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-500/20 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Available on Pro & Enterprise Plans</span>
            </div>
            
            <div className="w-24 h-24 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-8 animate-float">
              <Mic className="h-12 w-12 text-purple-400" />
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Clone Your Creator's Voice</span>
              <br />
              <span className="text-foreground text-3xl sm:text-4xl lg:text-5xl">Personalized Audio Content Without Studio Time</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Generate authentic voice messages, custom audio greetings, and personalized content—all in your creator's exact voice. Fans can't tell the difference, and your creators save hours every week.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8 py-6">
                  Clone Your First Voice
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/#pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border hover:bg-muted">
                  View Pro Plans
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
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-muted-foreground mt-1 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Works</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Upload Voice Sample", description: "Provide 30 seconds of your creator's voice. Clear audio, any content—a podcast clip, voice note, or recording." },
              { step: "2", title: "AI Training", description: "Our AI learns every nuance—tone, accent, breathing patterns, emotion, and speech rhythm in minutes." },
              { step: "3", title: "Generate Content", description: "Type any text and get authentic audio in your creator's voice instantly. Unlimited generations." }
            ].map((item) => (
              <div key={item.step} className="glass-card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
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
              Powerful <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Capabilities</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.title} 
                className="glass-card p-6 hover:border-purple-500/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Use <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Cases</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real ways OFM agencies use voice cloning to increase fan engagement and revenue.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="glass-card p-6">
                <useCase.icon className="h-8 w-8 text-purple-400 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{useCase.title}</h3>
                <p className="text-muted-foreground text-sm">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
            <div className="relative z-10">
              <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Unlock Voice Cloning Today
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Available on Pro and Enterprise plans. Start creating personalized voice content at scale and watch fan engagement soar.
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8 py-6">
                  Upgrade to Pro
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
            © 2026 My Creator Suite. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AIVoiceCloner;
