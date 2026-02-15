import { Link } from "react-router-dom";
import { ArrowLeft, Home, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/mycreatorsuite-logo.png";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="text-center space-y-6 relative z-10 max-w-md">
        <img src={logo} alt="Creator OS" className="h-16 w-auto mx-auto mb-2" />
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <p className="text-xl text-muted-foreground">This page doesn't exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="gap-2">
            <Link to="/"><Home className="h-4 w-4" /> Home</Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/dashboard"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
          </Button>
        </div>
        <button onClick={() => window.history.back()} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Go back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
