import { useState } from "react";
import { Bell, Check, MessageSquare, UserPlus, AlertCircle, CheckCircle2, FileText, Settings as SettingsIcon } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "message" | "creator" | "task" | "alert" | "invoice" | "system";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "message",
    title: "New message from Emma Rose",
    description: "Can we schedule a call for tomorrow to discuss the content plan?",
    time: "2 minutes ago",
    read: false,
  },
  {
    id: "2",
    type: "task",
    title: "Task completed",
    description: "Alex Rivera completed 'Video editing for weekly content'",
    time: "15 minutes ago",
    read: false,
  },
  {
    id: "3",
    type: "creator",
    title: "New creator onboarded",
    description: "Jessica Blake has completed the onboarding questionnaire",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "4",
    type: "alert",
    title: "Overdue task",
    description: "Content review for Luna Star is 2 days overdue",
    time: "2 hours ago",
    read: true,
  },
  {
    id: "5",
    type: "invoice",
    title: "Invoice payment received",
    description: "Emma Rose paid invoice INV-2024-001 ($3,450.00)",
    time: "3 hours ago",
    read: true,
  },
  {
    id: "6",
    type: "message",
    title: "New message from Alex Rivera",
    description: "I'll have the edits done by end of day",
    time: "4 hours ago",
    read: true,
  },
  {
    id: "7",
    type: "system",
    title: "System update",
    description: "New features are now available in the CRM",
    time: "1 day ago",
    read: true,
  },
];

const typeConfig: Record<string, { icon: any; bg: string; color: string }> = {
  message: { icon: MessageSquare, bg: "bg-primary/20", color: "text-primary" },
  creator: { icon: UserPlus, bg: "bg-accent/20", color: "text-accent" },
  task: { icon: CheckCircle2, bg: "bg-success/20", color: "text-success" },
  alert: { icon: AlertCircle, bg: "bg-warning/20", color: "text-warning" },
  invoice: { icon: FileText, bg: "bg-muted", color: "text-muted-foreground" },
  system: { icon: SettingsIcon, bg: "bg-muted", color: "text-muted-foreground" },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications.filter((n) =>
    filter === "all" ? true : !n.read
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

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
              onClick={markAllAsRead}
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

        {/* Notifications List */}
        <div className="space-y-2">
          {filteredNotifications.map((notification, index) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={cn(
                  "glass-card p-4 cursor-pointer transition-all duration-200 hover:border-primary/40 animate-fade-in",
                  !notification.read && "border-l-2 border-l-primary bg-primary/5"
                )}
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={cn(
                          "font-medium",
                          notification.read ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.description}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12 animate-fade-in glass-card">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
