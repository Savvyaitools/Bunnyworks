import { useState } from "react";
import { Bell, Check, Inbox } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Notifications will be populated from real activity - this is an empty state component
export default function Notifications() {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // In a real implementation, notifications would come from a database table
  // For now, show empty state since there's no activity yet
  const notifications: any[] = [];
  const unreadCount = 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">Stay updated on all activity</p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              className="bg-transparent border-border hover:bg-muted"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={cn(
              filter === "all" 
                ? "bg-primary text-primary-foreground" 
                : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
            className={cn(
              filter === "unread" 
                ? "bg-primary text-primary-foreground" 
                : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Unread
          </Button>
        </div>

        {/* Empty State */}
        <div className="text-center py-12 animate-fade-in glass-card">
          <Inbox className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No notifications yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Notifications will appear here as you use the platform. Activities like new messages, task updates, and creator events will be shown.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
