import { MessageSquare, CheckCircle2, UserPlus, AlertCircle, FileText, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: string;
  icon: typeof MessageSquare;
  title: string;
  description: string;
  time: string;
  iconBg: string;
  iconColor: string;
}

export function ActivityFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const recentActivities: Activity[] = [];

      // Fetch recent tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, status, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(3);

      tasks?.forEach((task) => {
        recentActivities.push({
          id: `task-${task.id}`,
          type: "task",
          icon: task.status === "Done" ? CheckCircle2 : AlertCircle,
          title: task.status === "Done" ? "Task completed" : "Task updated",
          description: task.title,
          time: formatDistanceToNow(new Date(task.updated_at), { addSuffix: true }),
          iconBg: task.status === "Done" ? "bg-success/20" : "bg-warning/20",
          iconColor: task.status === "Done" ? "text-success" : "text-warning",
        });
      });

      // Fetch recent creators
      const { data: creators } = await supabase
        .from("creators")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(2);

      creators?.forEach((creator) => {
        recentActivities.push({
          id: `creator-${creator.id}`,
          type: "creator",
          icon: UserPlus,
          title: "New creator added",
          description: creator.name,
          time: formatDistanceToNow(new Date(creator.created_at), { addSuffix: true }),
          iconBg: "bg-accent/20",
          iconColor: "text-accent",
        });
      });

      // Fetch recent messages
      const { data: messages } = await supabase
        .from("messages")
        .select("id, sender_name, content, created_at")
        .order("created_at", { ascending: false })
        .limit(2);

      messages?.forEach((message) => {
        recentActivities.push({
          id: `message-${message.id}`,
          type: "message",
          icon: MessageSquare,
          title: `Message from ${message.sender_name}`,
          description: message.content.substring(0, 50) + (message.content.length > 50 ? "..." : ""),
          time: formatDistanceToNow(new Date(message.created_at), { addSuffix: true }),
          iconBg: "bg-primary/20",
          iconColor: "text-primary",
        });
      });

      // Sort by time (most recent first) and limit to 5
      return recentActivities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5);
    },
  });

  return (
    <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
      </div>
      
      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">
          Loading activity...
        </div>
      ) : !activities || activities.length === 0 ? (
        <div className="text-center py-8">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No recent activity</p>
          <p className="text-sm text-muted-foreground/70">
            Activity will appear here as you use the platform
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity, index) => (
            <div 
              key={activity.id}
              className="activity-item animate-fade-in"
              style={{ animationDelay: `${400 + index * 50}ms` }}
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", activity.iconBg)}>
                <activity.icon className={cn("h-5 w-5", activity.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
