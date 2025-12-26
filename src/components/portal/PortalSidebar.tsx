import { 
  LayoutDashboard, 
  CheckSquare, 
  MessageSquare,
  FileText,
  FolderOpen,
  LogOut,
  ChevronLeft,
  User
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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

const portalNavItems = [
  { title: "Overview", url: "/portal", icon: LayoutDashboard },
  { title: "My Tasks", url: "/portal/tasks", icon: CheckSquare },
  { title: "Messages", url: "/portal/messages", icon: MessageSquare, badge: 2 },
  { title: "Invoices", url: "/portal/invoices", icon: FileText },
  { title: "Content Vault", url: "/portal/content", icon: FolderOpen },
];

export function PortalSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

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
            <div className="w-9 h-9 rounded-lg bg-gradient-accent flex items-center justify-center shadow-glow-sm">
              <User className="h-5 w-5 text-accent-foreground" />
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in">
                <h1 className="font-semibold text-foreground">Creator Portal</h1>
                <p className="text-xs text-muted-foreground">Your Dashboard</p>
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
              {portalNavItems.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url !== "/portal" && location.pathname.startsWith(item.url));
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
                        {!isCollapsed && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            {item.badge && (
                              <Badge 
                                variant="default" 
                                className="h-5 min-w-5 px-1.5 text-xs bg-accent text-accent-foreground"
                              >
                                {item.badge}
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
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        {/* Back to Main App link */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/"
                className="nav-item w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-5 w-5 shrink-0 rotate-180" />
                {!isCollapsed && <span>Back to Agency</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Creator Profile */}
        <div className={cn(
          "flex items-center gap-3 p-3 mt-2 rounded-lg bg-muted/30",
          isCollapsed && "justify-center p-2"
        )}>
          <Avatar className="h-9 w-9 ring-2 ring-accent/20">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=emma" />
            <AvatarFallback className="bg-accent/20 text-accent">ER</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium text-foreground truncate">Emma Rose</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Active Creator
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
