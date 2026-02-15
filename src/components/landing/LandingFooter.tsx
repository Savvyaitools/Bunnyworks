import myCreatorSuiteLogo from "@/assets/mycreatorsuite-logo.png";

export function LandingFooter() {
  return (
    <footer className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="col-span-2 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <img src={myCreatorSuiteLogo} alt="Creator OS - OnlyFans Agency Software" className="h-6 sm:h-8 w-auto animate-neon-glow" />
              <span className="text-base sm:text-lg font-semibold text-foreground">Creator OS</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
              The #1 management platform for OnlyFans and Fansly agencies. Manage creators, track revenue, schedule chatter shifts, and scale operations with AI-powered tools. Trusted by 500+ agencies worldwide.
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
            <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2 sm:mb-3">Use Cases</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">OnlyFans Agencies</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Fansly Management</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Multi-Platform Agencies</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-border">
          <div className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left">
            © 2025 My Creator Suite. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground text-center">
            <span>mycreatorsuite.com — The best software for OnlyFans agencies.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
