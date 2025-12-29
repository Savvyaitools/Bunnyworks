import { TrendingUp, CheckSquare, MessageSquare, FileText } from "lucide-react";
import { PortalLayout } from "@/components/portal";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useCreatorPortal } from "@/hooks/useCreatorPortal";
import { useUnreadMessages } from "@/hooks/useMessages";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, loading }: StatCardProps) {
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
      {loading ? (
        <>
          <Skeleton className="h-8 w-24 mb-1" />
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </>
      )}
    </div>
  );
}

function formatDueDate(dateString: string | null): string {
  if (!dateString) return "No date";
  const date = parseISO(dateString);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

export default function PortalDashboard() {
  const { 
    creatorProfile, 
    tasks, 
    invoices, 
    loading,
    totalEarnings,
    activeTasks,
    pendingInvoices,
    pendingInvoiceAmount
  } = useCreatorPortal();
  
  const { totalUnread } = useUnreadMessages("creator");

  const upcomingTasks = tasks
    .filter(t => t.status !== "Completed")
    .slice(0, 3);

  const tasksDueToday = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date))).length;

  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const totalTasks = tasks.length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Welcome back, <span className="gradient-text">{creatorProfile?.name || "Creator"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your content</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Earnings"
            value={formatCurrency(totalEarnings)}
            subtitle="All time"
            icon={TrendingUp}
            loading={loading}
          />
          <StatCard
            title="Active Tasks"
            value={activeTasks.toString()}
            subtitle={tasksDueToday > 0 ? `${tasksDueToday} due today` : "No tasks due today"}
            icon={CheckSquare}
            loading={loading}
          />
          <StatCard
            title="Unread Messages"
            value={totalUnread.toString()}
            subtitle="From agency team"
            icon={MessageSquare}
            loading={loading}
          />
          <StatCard
            title="Pending Invoices"
            value={pendingInvoices.toString()}
            subtitle={formatCurrency(pendingInvoiceAmount) + " total"}
            icon={FileText}
            loading={loading}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Tasks */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Upcoming Tasks</h2>
              <Badge variant="outline" className="border-accent/30 text-accent">
                {activeTasks} active
              </Badge>
            </div>
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))
              ) : upcomingTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No upcoming tasks</p>
              ) : (
                upcomingTasks.map((task) => (
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
                      <span className="text-xs text-muted-foreground">{formatDueDate(task.due_date)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Invoices</h2>
              <Badge variant="outline" className="border-accent/30 text-accent">
                {invoices.length} total
              </Badge>
            </div>
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))
              ) : invoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No invoices yet</p>
              ) : (
                invoices.slice(0, 3).map((inv) => (
                  <div key={inv.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{inv.invoice_number}</span>
                      <Badge className={cn(
                        "text-xs",
                        inv.status === "Paid" && "bg-success/20 text-success",
                        inv.status === "Pending" && "bg-warning/20 text-warning"
                      )}>
                        {inv.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatCurrency(inv.amount)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Task Progress */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Task Completion Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">Tasks Completed</span>
                <span className="text-sm text-muted-foreground">{completedTasks}/{totalTasks}</span>
              </div>
              <Progress value={taskProgress} className="h-2" />
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
