import { ArrowRight, Star, Users, DollarSign, TrendingUp, Zap, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const features = [
  {
    icon: Users,
    title: "Creator Management",
    description: "Manage all your creators in one centralized dashboard with real-time analytics.",
  },
  {
    icon: DollarSign,
    title: "Revenue Tracking",
    description: "Track earnings, commissions, and payouts with detailed financial reports.",
  },
  {
    icon: TrendingUp,
    title: "Growth Analytics",
    description: "Monitor performance trends and identify opportunities for growth.",
  },
  {
    icon: Zap,
    title: "Task Automation",
    description: "Streamline workflows with automated task management and assignments.",
  },
  {
    icon: Shield,
    title: "Secure Portal",
    description: "Dedicated creator portal with secure file sharing and messaging.",
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Stay connected with instant notifications and live activity feeds.",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Agency Owner",
    content: "Premium Fangirls has transformed how we manage our creators. Revenue is up 40% since switching.",
    rating: 5,
  },
  {
    name: "Alex K.",
    role: "Content Creator",
    content: "The creator portal is amazing. I can see all my tasks, content, and earnings in one place.",
    rating: 5,
  },
  {
    name: "Jessica R.",
    role: "Agency Manager",
    content: "Best CRM for creator agencies. The automation features save us hours every day.",
    rating: 5,
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Premium Fangirls" className="h-10 w-auto" />
              <span className="text-xl font-bold gradient-text">Premium Fangirls</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90 glow-sm">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="animate-fade-in">
            <img 
              src={logo} 
              alt="Premium Fangirls Agency" 
              className="h-32 w-auto mx-auto mb-8 animate-float"
            />
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="text-foreground">The Ultimate</span>
              <br />
              <span className="gradient-text">Creator Agency OS</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Manage your creators, track revenue, and scale your agency with the most powerful 
              creator management platform built for premium agencies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 glow-primary">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border hover:bg-muted">
                Watch Demo
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { value: "500+", label: "Active Agencies" },
              { value: "$50M+", label: "Revenue Tracked" },
              { value: "10K+", label: "Creators Managed" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-6">
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need to <span className="gradient-text">Scale</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed specifically for creator agencies to manage, grow, and profit.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="glass-card p-6 hover:border-primary/30 transition-all duration-300 group"
                style={{ animationDelay: `${index * 100}ms` }}
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

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Loved by <span className="gradient-text">Agencies</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              See what our customers have to say about Premium Fangirls.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="glass-card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-4">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Start free, scale as you grow.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-semibold text-foreground mb-2">Starter</h3>
              <div className="text-4xl font-bold text-foreground mb-1">$0</div>
              <div className="text-muted-foreground mb-6">Free forever</div>
              <ul className="space-y-3 mb-8">
                {["Up to 5 creators", "Basic analytics", "Task management", "Email support"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>
            
            {/* Pro */}
            <div className="glass-card p-8 border-primary/50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Pro</h3>
              <div className="text-4xl font-bold text-foreground mb-1">$99</div>
              <div className="text-muted-foreground mb-6">per month</div>
              <ul className="space-y-3 mb-8">
                {["Up to 50 creators", "Advanced analytics", "Creator portal", "Priority support", "Custom branding"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button className="w-full bg-primary hover:bg-primary/90">Start Free Trial</Button>
              </Link>
            </div>
            
            {/* Enterprise */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-semibold text-foreground mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-foreground mb-1">Custom</div>
              <div className="text-muted-foreground mb-6">Contact us</div>
              <ul className="space-y-3 mb-8">
                {["Unlimited creators", "White-label solution", "API access", "Dedicated support", "Custom integrations"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full">Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Ready to Scale Your Agency?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Join 500+ agencies already using Premium Fangirls to manage their creators.
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
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Premium Fangirls" className="h-8 w-auto" />
              <span className="text-lg font-semibold text-foreground">Premium Fangirls</span>
            </div>
            <div className="text-muted-foreground text-sm">
              © 2024 Premium Fangirls Agency. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
