import myCreatorSuiteLogo from "@/assets/mycreatorsuite-logo.png";

export function LandingFooter() {
  return (
    <footer className="py-12 sm:py-16 px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <img src={myCreatorSuiteLogo} alt="Creator OS" className="h-7 w-auto" />
              <span className="text-base font-bold text-foreground">Creator OS</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              The #1 management platform for OnlyFans and Fansly agencies. Manage creators, track revenue, and scale with AI.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#tools" className="hover:text-foreground transition-colors">AI Tools</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#comparison" className="hover:text-foreground transition-colors">Compare</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Use Cases</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">OnlyFans Agencies</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Fansly Management</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Multi-Platform</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <span className="text-muted-foreground text-xs">© 2025 My Creator Suite. All rights reserved.</span>
          <span className="text-muted-foreground text-xs">mycreatorsuite.com</span>
        </div>
      </div>
    </footer>
  );
}
