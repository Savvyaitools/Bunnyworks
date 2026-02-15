import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/landing/MobileNav";
import myCreatorSuiteLogo from "@/assets/mycreatorsuite-logo.png";

const mainNavLinks = [
  { label: "Features", href: "#features", isExternal: true },
  { label: "Compare", href: "#comparison", isExternal: true },
  { label: "AI Tools", href: "#tools", isExternal: true },
  { label: "Pricing", href: "#pricing", isExternal: true },
];

export function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-2xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <img src={myCreatorSuiteLogo} alt="Creator OS" className="h-8 w-auto" />
            <span className="text-lg font-bold text-foreground tracking-tight">Creator OS</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {mainNavLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                {link.label}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Login
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-full px-5 font-medium">
                Sign up
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <MobileNav links={mainNavLinks} />
        </div>
      </div>
    </nav>
  );
}
