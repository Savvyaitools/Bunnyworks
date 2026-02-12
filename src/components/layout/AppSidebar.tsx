import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  CheckSquare, 
  Calendar,
  BookOpen,
  FileText,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  UserPlus,
  Headphones,
  CalendarClock,
  MessageCircle,
  TrendingUp,
  Upload,
  ClipboardList,
  Globe,
  Plug,
  Search,
  HeartPulse,
  HelpCircle,
  Bot,
  BrainCircuit
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import myCreatorSuiteLogo from "@/assets/mycreatorsuite-logo.png";

// MAIN section - core agency management
const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "FELIX", url: "/felix", icon: Bot },
  { title: "Agent Hub", url: "/agent-hub", icon: BrainCircuit },
  { title: "Creators", url: "/creators", icon: Users },
  { title: "Creator Messages", url: "/messages", icon: MessageSquare },
  { title: "Team", url: "/team", icon: UserCog },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Invoices", url: "/invoices", icon: FileText },
];

// ONLYFANS section - subscriber & chatter management
const onlyfansNavItems = [
  { title: "Subscriber DMs", url: "/subscriber-dms", icon: MessageCircle },
  { title: "Shift Roster", url: "/shifts", icon: CalendarClock },
  { title: "Team Chat", url: "/team-chat", icon: MessageSquare },
];

// RECRUITING section
const recruitingNavItems = [
  { title: "Recruiting", url: "/recruiting", icon: UserPlus },
  { title: "OF Discovery", url: "/tools/creator-discovery", icon: Search },
  { title: "Web Scraper", url: "/tools/scraper", icon: Globe },
  { title: "Applications", url: "/applications", icon: ClipboardList },
];

// RESOURCES section - utilities & tools
const resourcesNavItems = [
  { title: "SOP Library", url: "/sop", icon: BookOpen },
  { title: "Data Import", url: "/data-import", icon: Upload },
  { title: "Browser Sync", url: "/browser-sync", icon: Plug },
  { title: "OF Health", url: "/of-health", icon: HeartPulse },
  { title: "User Guide", url: "/guide", icon: HelpCircle },
];

const bottomNavItems = [
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const { profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const isCollapsed = state === "collapsed";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <Sidebar 
      className={cn(
        "border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <img src={myCreatorSuiteLogo} alt="Creator OS" className="w-9 h-9 object-contain animate-neon-glow" />
            {!isCollapsed && (
              <div className="animate-fade-in">
                <h1 className="font-semibold text-foreground">Creator OS</h1>
                <p className="text-xs text-muted-foreground">Agency CRM</p>
              </div>
            )}
          </div>
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform duration-300",
              isCollapsed && "rotate-180"
            )} />
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={cn(
                          "nav-item w-full justify-start",
                          isActive && "active"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span className="flex-1">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* OnlyFans Section */}
        {!isCollapsed && <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">OnlyFans</p>}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {onlyfansNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={cn("nav-item w-full justify-start", isActive && "active")}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span className="flex-1">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recruiting Section */}
        {!isCollapsed && <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recruiting</p>}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {recruitingNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={cn("nav-item w-full justify-start", isActive && "active")}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span className="flex-1">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Resources Section */}
        {!isCollapsed && <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resources</p>}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourcesNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={cn("nav-item w-full justify-start", isActive && "active")}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span className="flex-1">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <SidebarMenu>
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.url;
            const isNotifications = item.title === "Notifications";
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className={cn(
                      "nav-item w-full justify-start",
                      isActive && "active"
                    )}
                  >
                    <div className="relative">
                      <item.icon className="h-5 w-5 shrink-0" />
                      {isNotifications && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse shadow-[0_0_8px_hsl(var(--destructive))]">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.title}</span>
                        {isNotifications && unreadCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="h-5 min-w-5 px-1.5 text-xs animate-pulse shadow-[0_0_8px_hsl(var(--destructive))]"
                          >
                            {unreadCount}
                          </Badge>
                        )}
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 p-3 mt-2 rounded-lg bg-muted/30",
          isCollapsed && "justify-center p-2"
        )}>
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || 'user'}`} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {profile?.full_name?.split(" ").map(n => n[0]).join("") || "U"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.full_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Online
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button 
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
