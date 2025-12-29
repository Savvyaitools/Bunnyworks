import { useState } from "react";
import { Search, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { PortalLayout } from "@/components/portal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCreatorPortal } from "@/hooks/useCreatorPortal";
import { format, parseISO } from "date-fns";

type Priority = "High" | "Medium" | "Low";
type TaskStatus = "To Do" | "In Progress" | "Completed";

const priorityColors: Record<Priority, string> = {
  High: "bg-destructive/20 text-destructive border-destructive/30",
  Medium: "bg-warning/20 text-warning border-warning/30",
  Low: "bg-muted text-muted-foreground border-border",
};

const statusIcons: Record<TaskStatus, React.ElementType> = {
  "To Do": Clock,
  "In Progress": Clock,
  "Completed": CheckCircle2,
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "No date";
  return format(parseISO(dateString), "MMM d");
}

export default function PortalTasks() {
  const { tasks, loading } = useCreatorPortal();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "All">("All");

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "All" || task.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses: (TaskStatus | "All")[] = ["All", "To Do", "In Progress", "Completed"];

  const taskCounts = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === "To Do").length,
    inProgress: tasks.filter(t => t.status === "In Progress").length,
    completed: tasks.filter(t => t.status === "Completed").length,
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground mt-1">Tasks assigned to you by the agency team</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <div className="stat-card text-center">
            {loading ? <Skeleton className="h-8 w-12 mx-auto" /> : <p className="text-2xl font-bold text-foreground">{taskCounts.total}</p>}
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </div>
          <div className="stat-card text-center">
            {loading ? <Skeleton className="h-8 w-12 mx-auto" /> : <p className="text-2xl font-bold text-warning">{taskCounts.todo}</p>}
            <p className="text-sm text-muted-foreground">To Do</p>
          </div>
          <div className="stat-card text-center">
            {loading ? <Skeleton className="h-8 w-12 mx-auto" /> : <p className="text-2xl font-bold text-accent">{taskCounts.inProgress}</p>}
            <p className="text-sm text-muted-foreground">In Progress</p>
          </div>
          <div className="stat-card text-center">
            {loading ? <Skeleton className="h-8 w-12 mx-auto" /> : <p className="text-2xl font-bold text-success">{taskCounts.completed}</p>}
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-accent input-glow"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statuses.map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  selectedStatus === status 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground">No tasks found.</p>
            </div>
          ) : (
            filteredTasks.map((task, index) => {
              const StatusIcon = statusIcons[task.status as TaskStatus] || Clock;
              return (
                <div
                  key={task.id}
                  className={cn(
                    "glass-card p-4 transition-all duration-200 hover:border-accent/40 animate-fade-in",
                    task.status === "Completed" && "opacity-60"
                  )}
                  style={{ animationDelay: `${150 + index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox 
                      checked={task.status === "Completed"}
                      className="mt-1 border-muted-foreground data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                      disabled
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className={cn(
                          "font-medium text-foreground",
                          task.status === "Completed" && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h3>
                        <Badge className={cn("border shrink-0", priorityColors[task.priority as Priority] || priorityColors.Medium)}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{task.status}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Due: {formatDate(task.due_date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
