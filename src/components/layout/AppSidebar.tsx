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
  CalendarClock,
  Upload,
  ClipboardList,
  Globe,
  Search,
  HelpCircle,
  Bot,
  Share2,
  MessagesSquare,
  ChevronDown,
  Command,
  BarChart3,
  Gamepad2,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import bunnyWorksLogo from "@/assets/bunnyworks-logo.png";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "OF AI", url: "/of-ai", icon: Bot },
  { title: "Creators", url: "/creators", icon: Users },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Team", url: "/team", icon: UserCog },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Financials", url: "/invoices", icon: FileText },
];

const collapsibleSections = [
  {
    label: "Analytics",
    items: [
      { title: "Fan Analytics", url: "/fan-analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "BunnyChat Arcade", url: "/bunnychat", icon: Gamepad2 },
      { title: "Platform Access", url: "/browser-sync", icon: Globe },
      { title: "Shift Roster", url: "/shifts", icon: CalendarClock },
      { title: "Team Chat", url: "/team-chat", icon: MessageSquare },
    ],
  },
  {
    label: "Growth",
    items: [
      { title: "Recruiting", url: "/recruiting", icon: UserPlus },
      { title: "Outreach Lead Gen", url: "/tools/creator-discovery", icon: Search },
      { title: "Applications", url: "/applications", icon: ClipboardList },
    ],
  },
  {
    label: "Resources",
    items: [
      { title: "SOP Library", url: "/sop", icon: BookOpen },
      { title: "User Guide", url: "/guide", icon: HelpCircle },
    ],
  },
];

const bottomNavItems = [
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

function NavSection({ items, location, isCollapsed }: { items: typeof mainNavItems; location: ReturnType<typeof useLocation>; isCollapsed: boolean }) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");

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
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { profile, user, signOut } = useAuth();
  
  const { unreadCount } = useNotifications();
  const isCollapsed = state === "collapsed";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const isSectionActive = (items: typeof mainNavItems) =>
    items.some((item) => location.pathname === item.url || location.pathname.startsWith(item.url + "/"));

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
            <img src={bunnyWorksLogo} alt="BunnyWorksOS" className="w-9 h-9 object-contain animate-neon-glow" />
            {!isCollapsed && (
              <div className="animate-fade-in">
                <h1 className="ops-heading text-sm font-bold text-foreground">BunnyWorksOS</h1>
                <p className="ops-label mt-0.5">Agency CRM</p>
              </div>
            )}
          </div>
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", isCollapsed && "rotate-180")} />
          </SidebarTrigger>
        </div>
        {/* Command palette trigger */}
        {!isCollapsed && (
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-muted-foreground text-xs hover:bg-muted transition-colors"
          >
            <Command className="h-3 w-3" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Main navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <NavSection items={mainNavItems} location={location} isCollapsed={isCollapsed} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapsible sections */}
        {collapsibleSections.map((section) => {
          if (isCollapsed) {
            return (
              <SidebarGroup key={section.label}>
                <SidebarGroupContent>
                  <NavSection items={section.items} location={location} isCollapsed={isCollapsed} />
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          return (
            <Collapsible key={section.label} defaultOpen={true}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                {section.label}
                <ChevronDown className="h-3 w-3 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <NavSection items={section.items} location={location} isCollapsed={isCollapsed} />
                  </SidebarGroupContent>
                </SidebarGroup>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <SidebarMenu>
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.url;
            const isNotifications = item.title === "Notifications";
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink to={item.url} className={cn("nav-item w-full justify-start", isActive && "active")}>
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
                          <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs animate-pulse shadow-[0_0_8px_hsl(var(--destructive))]">
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
        <div className={cn("flex items-center gap-3 p-3 mt-2 rounded-lg bg-muted/30", isCollapsed && "justify-center p-2")}>
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?backgroundColor=ec4899,db2777,be185d,a21caf,9333ea,7c3aed,6d28d9&fontWeight=600&textColor=ffffff&seed=${profile?.full_name || "user"}`} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {profile?.full_name?.split(" ").map((n) => n[0]).join("") || "U"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Online
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
