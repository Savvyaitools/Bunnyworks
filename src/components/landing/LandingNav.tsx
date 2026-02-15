import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/landing/MobileNav";
import myCreatorSuiteLogo from "@/assets/mycreatorsuite-logo.png";

const mainNavLinks = [
  { label: "Features", href: "#features", isExternal: true },
  { label: "Compare", href: "#comparison", isExternal: true },
  { label: "AI Tools", href: "#tools", isExternal: true },
  { label: "Testimonials", href: "#testimonials", isExternal: true },
  { label: "Pricing", href: "#pricing", isExternal: true },
];

export function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={myCreatorSuiteLogo} alt="Creator OS - OnlyFans Agency Management Software" className="h-10 w-auto animate-neon-glow" />
            <span className="text-xl font-bold gradient-text">Creator OS</span>
          </div>
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {mainNavLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Sign In</Button>
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
  );
}
