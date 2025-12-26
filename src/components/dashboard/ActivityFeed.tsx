import { MessageSquare, CheckCircle2, UserPlus, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "message",
    icon: MessageSquare,
    title: "New message from Sarah",
    description: "Content request for next week...",
    time: "2 min ago",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
  },
  {
    id: 2,
    type: "task",
    icon: CheckCircle2,
    title: "Task completed",
    description: "Video editing for Emma's content",
    time: "15 min ago",
    iconBg: "bg-success/20",
    iconColor: "text-success",
  },
  {
    id: 3,
    type: "creator",
    icon: UserPlus,
    title: "New creator onboarded",
    description: "Jessica completed onboarding",
    time: "1 hour ago",
    iconBg: "bg-accent/20",
    iconColor: "text-accent",
  },
  {
    id: 4,
    type: "alert",
    icon: AlertCircle,
    title: "Overdue task",
    description: "Content review for Mike - 2 days overdue",
    time: "2 hours ago",
    iconBg: "bg-warning/20",
    iconColor: "text-warning",
  },
  {
    id: 5,
    type: "invoice",
    icon: FileText,
    title: "Invoice sent",
    description: "Monthly invoice to Creator Luna",
    time: "3 hours ago",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
];

export function ActivityFeed() {
  return (
    <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <button className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
          View all
        </button>
      </div>
      
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
    </div>
  );
}
