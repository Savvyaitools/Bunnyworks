import { TrendingUp, CheckSquare, MessageSquare, FileText, Calendar } from "lucide-react";
import { PortalLayout } from "@/components/portal";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
          <Icon className="h-6 w-6 text-accent" />
        </div>
        {trend && (
          <Badge className={cn(
            "text-xs",
            trendUp ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
          )}>
            {trendUp ? "↑" : "↓"} {trend}
          </Badge>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

const upcomingTasks = [
  { id: "1", title: "Record weekly video content", dueDate: "Today", priority: "High" },
  { id: "2", title: "Review edited footage", dueDate: "Tomorrow", priority: "Medium" },
  { id: "3", title: "Approve social media posts", dueDate: "Dec 28", priority: "Low" },
];

const recentMessages = [
  { id: "1", from: "Sarah (Account Manager)", message: "Content schedule for next week is ready!", time: "2h ago" },
  { id: "2", from: "Alex (Editor)", message: "Finished editing your latest video", time: "5h ago" },
];

export default function PortalDashboard() {
  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Welcome back, <span className="gradient-text">Emma</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your content</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Monthly Earnings"
            value="$12,450"
            subtitle="This month"
            icon={TrendingUp}
            trend="12%"
            trendUp={true}
          />
          <StatCard
            title="Active Tasks"
            value="8"
            subtitle="3 due today"
            icon={CheckSquare}
          />
          <StatCard
            title="Unread Messages"
            value="5"
            subtitle="2 from team"
            icon={MessageSquare}
          />
          <StatCard
            title="Pending Invoices"
            value="2"
            subtitle="$3,200 total"
            icon={FileText}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Tasks */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Upcoming Tasks</h2>
              <Badge variant="outline" className="border-accent/30 text-accent">
                {upcomingTasks.length} tasks
              </Badge>
            </div>
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-sm text-foreground">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "text-xs",
                      task.priority === "High" && "bg-destructive/20 text-destructive",
                      task.priority === "Medium" && "bg-warning/20 text-warning",
                      task.priority === "Low" && "bg-muted text-muted-foreground"
                    )}>
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Messages</h2>
              <Badge variant="outline" className="border-accent/30 text-accent">
                {recentMessages.length} new
              </Badge>
            </div>
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{msg.from}</span>
                    <span className="text-xs text-muted-foreground">{msg.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Progress */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">This Month's Content Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">Videos Completed</span>
                <span className="text-sm text-muted-foreground">8/12</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">Photos Uploaded</span>
                <span className="text-sm text-muted-foreground">24/30</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">Social Posts Scheduled</span>
                <span className="text-sm text-muted-foreground">15/20</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
