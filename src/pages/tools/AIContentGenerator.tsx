import { ArrowRight, Image, Zap, Clock, Users, Shield, Palette, Layers, Sparkles, Lock, Wand2, Camera, Repeat } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/landing/MobileNav";
import myCreatorSuiteLogo from "@/assets/logo-gold.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "AI Chatting", href: "/tools/chatting" },
  { label: "Voice Cloner", href: "/tools/voice-cloner" },
];

const features = [
  {
    icon: Wand2,
    title: "AI Image Generation",
    description: "Generate stunning, platform-ready images in your creator's style with simple text prompts. No photoshoots required."
  },
  {
    icon: Palette,
    title: "Style Consistency",
    description: "Train the AI on your creator's aesthetic to maintain brand consistency across all generated content automatically."
  },
  {
    icon: Zap,
    title: "Instant Creation",
    description: "Generate high-quality content in seconds. No photoshoots, no editing, no waiting—just describe and create."
  },
  {
    icon: Layers,
    title: "Bulk Generation",
    description: "Create dozens of unique images at once. Perfect for content calendars, mass posting, and PPV bundles."
  },
  {
    icon: Shield,
    title: "Platform Compliant",
    description: "Content is optimized for adult platform guidelines while maximizing engagement and conversion rates."
  },
  {
    icon: Clock,
    title: "Never Run Out",
    description: "Unlimited content possibilities. Keep fans engaged with fresh content daily without creator burnout."
  }
];

const contentTypes = [
  {
    icon: Camera,
    title: "Lifestyle Content",
    description: "Generate casual, everyday content that feels authentic and relatable to fans.",
    examples: ["Morning routines", "Outfit showcases", "Behind-the-scenes"]
  },
  {
    icon: Sparkles,
    title: "Themed Shoots",
    description: "Create themed content sets without expensive photoshoots or locations.",
    examples: ["Holiday specials", "Cosplay", "Fantasy scenarios"]
  },
  {
    icon: Repeat,
    title: "Fan Requests",
    description: "Fulfill custom content requests at scale without creator burnout or scheduling.",
    examples: ["Personalized content", "Specific scenarios", "Custom outfits"]
  }
];

const stats = [
  { value: "10x", label: "Faster Content Production" },
  { value: "95%", label: "Platform Acceptance Rate" },
  { value: "∞", label: "Variations From One Training Set" }
];

const AIContentGenerator = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src={myCreatorSuiteLogo} 
                alt="Creator OS - AI Content Generator" 
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
              <Link to="/tools/voice-cloner" className="text-muted-foreground hover:text-foreground transition-colors">
                Voice Cloner
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-orange-500/20 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Available on Pro & Enterprise Plans</span>
            </div>
            
            <div className="w-24 h-24 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-8 animate-float">
              <Image className="h-12 w-12 text-orange-400" />
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Unlimited Content, Zero Creator Burnout</span>
              <br />
              <span className="text-foreground text-3xl sm:text-4xl lg:text-5xl">AI-Generated Images in Your Creator's Style</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Train our AI on your creator's aesthetic and generate platform-ready content in seconds. Scale content production 10x without photoshoots or editing marathons—just describe and create.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-lg px-8 py-6">
                  Start Generating Content
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

      {/* Stats */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-6 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-muted-foreground mt-1 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Powerful <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Features</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to create stunning content at scale without the overhead.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.title} 
                className="glass-card p-6 hover:border-orange-500/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Types */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              What You Can <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Create</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Generate any type of content your agency needs to keep fans engaged and paying.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contentTypes.map((type) => (
              <div key={type.title} className="glass-card p-6">
                <type.icon className="h-8 w-8 text-orange-400 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{type.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{type.description}</p>
                <div className="flex flex-wrap gap-2">
                  {type.examples.map((example) => (
                    <span key={example} className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-400">
                      {example}
                    </span>
                  ))}
                </div>
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
              How It <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Works</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Upload References", description: "Provide sample images to train the AI on your creator's unique style and aesthetic." },
              { step: "2", title: "Define Style", description: "Set preferences for lighting, poses, aesthetics, and brand guidelines to ensure consistency." },
              { step: "3", title: "Generate Content", description: "Describe what you want and let AI create stunning visuals in seconds—unlimited variations." },
              { step: "4", title: "Publish & Profit", description: "Download, make any final tweaks, and post to platforms instantly to drive revenue." }
            ].map((item) => (
              <div key={item.step} className="glass-card p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10" />
            <div className="relative z-10">
              <Sparkles className="h-12 w-12 text-orange-400 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Unlock Unlimited Content Creation
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Available on Pro and Enterprise plans. Start generating content that converts and keeps fans coming back for more.
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-lg px-8 py-6">
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
            © 2025 My Creator Suite. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AIContentGenerator;
