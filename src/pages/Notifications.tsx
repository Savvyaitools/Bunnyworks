import { useState } from "react";
import { Check, Inbox, Trash2, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";

const typeIcons: Record<string, string> = {
  task: "📋",
  message: "💬",
  creator: "🎨",
  invoice: "💰",
  system: "⚙️",
  info: "ℹ️",
};

export default function Notifications() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const filteredNotifications = notifications.filter((n) => 
    filter === "all" ? true : !n.read
  );

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id]);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Stay updated on all activity</p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              className="bg-transparent border-border hover:bg-muted"
              onClick={markAllAsRead}
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
            All ({notifications.length})
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
            Unread ({unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-4">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 animate-fade-in glass-card">
            <Inbox className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {filter === "unread" 
                ? "You're all caught up! Switch to 'All' to see previous notifications."
                : "Notifications will appear here as you use the platform. Activities like new messages, task updates, and creator events will be shown."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification, index) => (
              <div
                key={notification.id}
                className={cn(
                  "glass-card p-4 cursor-pointer transition-all hover:border-primary/40 group animate-fade-in",
                  !notification.read && "border-l-2 border-l-primary"
                )}
                style={{ animationDelay: `${150 + index * 50}ms` }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl shrink-0">
                    {typeIcons[notification.type] || typeIcons.info}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={cn(
                          "font-medium text-foreground",
                          notification.read && "text-muted-foreground"
                        )}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {notification.link && (
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
