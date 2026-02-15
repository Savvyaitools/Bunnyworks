import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  CheckSquare,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const portalMobileItems = [
  { icon: LayoutDashboard, label: "Home", path: "/portal" },
  { icon: FolderOpen, label: "Content", path: "/portal/content" },
  { icon: CalendarDays, label: "Plans", path: "/portal/plans" },
  { icon: CheckSquare, label: "Tasks", path: "/portal/tasks" },
  { icon: MessageSquare, label: "Messages", path: "/portal/messages" },
];

export function PortalMobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl md:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1.5 px-1">
        {portalMobileItems.map((item) => {
          const isActive =
            item.path === "/portal"
              ? location.pathname === "/portal"
              : location.pathname.startsWith(item.path);

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
  );
}
