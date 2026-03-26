import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  MessageSquare,
  Menu,
  Bot,
  UserCog,
  Calendar,
  FileText,
  CalendarClock,
  UserPlus,
  Search,
  Globe,
  ClipboardList,
  BookOpen,
  
  HelpCircle,
  Bell,
  Settings,
  LogOut,
  X,
  Share2,
  MessagesSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useActiveBrowserSession } from "@/contexts/ActiveBrowserSessionContext";

const mobileNavItems = [
  { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
  { icon: Users, label: "Creators", path: "/creators" },
  { icon: CheckSquare, label: "Tasks", path: "/tasks" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: Menu, label: "More", path: "__menu__" },
];

const menuSections = [
  {
    title: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "OF AI", url: "/of-ai", icon: Bot },
      { title: "Creators", url: "/creators", icon: Users },
      { title: "Messages", url: "/messages", icon: MessageSquare },
      { title: "Team", url: "/team", icon: UserCog },
      { title: "Tasks", url: "/tasks", icon: CheckSquare },
      { title: "Calendar", url: "/calendar", icon: Calendar },
      { title: "Invoices", url: "/invoices", icon: FileText },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Platform Access", url: "/browser-sync", icon: Globe },
      { title: "Shift Roster", url: "/shifts", icon: CalendarClock },
      { title: "Team Chat", url: "/team-chat", icon: MessageSquare },
    ],
  },
  {
    title: "Growth",
    items: [
      { title: "Recruiting", url: "/recruiting", icon: UserPlus },
      { title: "Outreach Lead Gen", url: "/tools/creator-discovery", icon: Search },
      { title: "Applications", url: "/applications", icon: ClipboardList },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "SOP Library", url: "/sop", icon: BookOpen },
      
      { title: "User Guide", url: "/guide", icon: HelpCircle },
    ],
  },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile, user, signOut } = useAuth();
  const userEmail = profile?.email || user?.email;
  const isFeatureLocked = (url: string) => url === "/browser-sync" && userEmail?.toLowerCase() !== "testing26@gmail.com";
  const { activeSession, minimized } = useActiveBrowserSession();

  // Hide bottom nav when browser session is open full-screen
  if (activeSession && !minimized) return null;

  const handleNavigate = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl md:hidden safe-area-bottom">
        <div className="flex items-center justify-around py-1.5 px-1">
          {mobileNavItems.map((item) => {
            if (item.path === "__menu__") {
              return (
                <Sheet key="menu" open={menuOpen} onOpenChange={setMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors min-w-[56px]">
                      <item.icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-72">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="flex flex-col h-full bg-card">
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border-b border-border">
                        <h2 className="font-semibold text-foreground">Menu</h2>
                        <button onClick={() => setMenuOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Nav sections */}
                      <ScrollArea className="flex-1">
                        <div className="p-3 space-y-4">
                          {menuSections.map((section) => (
                            <div key={section.title}>
                              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {section.title}
                              </p>
                              <div className="space-y-0.5">
                                {section.items.map((item) => {
                                  const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
                                  return (
                                    <button
                                      key={item.url}
                                      onClick={() => handleNavigate(item.url)}
                                      className={cn(
                                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                                        isActive
                                          ? "bg-primary/10 text-primary font-medium"
                                          : "text-foreground hover:bg-muted/50"
                                      )}
                                    >
                                      <item.icon className="h-4 w-4 shrink-0" />
                                      <span>{item.title}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Footer */}
                      <div className="p-3 border-t border-border space-y-1">
                        <button onClick={() => handleNavigate("/notifications")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/50">
                          <Bell className="h-4 w-4" />
                          <span>Notifications</span>
                        </button>
                        <button onClick={() => handleNavigate("/settings")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/50">
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </button>
                        <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10">
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              );
            }

            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");

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
    </>
  );
}
