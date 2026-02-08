import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  MessageSquare,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";

const mobileNavItems = [
  { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
  { icon: Users, label: "Creators", path: "/creators" },
  { icon: CheckSquare, label: "Tasks", path: "/tasks" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: Menu, label: "More", path: "__menu__" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
                    <SidebarProvider defaultOpen={true}>
                      <AppSidebar />
                    </SidebarProvider>
                  </SheetContent>
                </Sheet>
              );
            }

            const isActive =
              location.pathname === item.path ||
              (item.path !== "/dashboard" && location.pathname.startsWith(item.path + "/"));

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
