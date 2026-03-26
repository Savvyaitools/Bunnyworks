import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Calendar, LogOut, User, BarChart3, MessagesSquare, Globe, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/bunnyworks-logo.png";

interface EmployeeLayoutProps {
  children: ReactNode;
}

export function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", path: "/employee" },
    { icon: Users, label: "Creators", path: "/employee/creators" },
    { icon: MessagesSquare, label: "Chat", path: "/employee/team-chat" },
    { icon: Globe, label: "Access", path: "/employee/browser" },
    { icon: BarChart3, label: "Stats", path: "/employee/performance" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-auto" />
            <span className="text-sm font-medium text-muted-foreground">Employee Portal</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-20 overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-xl z-40 safe-area-bottom">
        <div className="flex items-center justify-around py-1.5 px-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px]",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}