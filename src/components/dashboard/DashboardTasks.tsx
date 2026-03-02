import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, ArrowUpRight, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useTasks, Task } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  Urgent: "bg-destructive/20 text-destructive border-destructive/30",
  High: "bg-destructive/20 text-destructive border-destructive/30",
  Medium: "bg-warning/20 text-warning border-warning/30",
  Low: "bg-muted text-muted-foreground border-border",
};

const isOverdue = (dueDate: string | null, status: string) => {
  if (!dueDate || status === "Completed") return false;
  return new Date(dueDate) < new Date();
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const TaskRow = React.forwardRef<HTMLDivElement, { task: Task }>(function TaskRow({ task }, ref) {
  const overdue = isOverdue(task.due_date, task.status);
  const isCompleted = task.status === "Completed";

  return (
    <div ref={ref} className={cn(
      "flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50",
      overdue && "bg-destructive/5"
    )}>
      {isCompleted ? (
        <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
      ) : (
        <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isCompleted ? "text-muted-foreground line-through" : "text-foreground"
        )}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", priorityColors[task.priority])}>
            {task.priority}
          </Badge>
          {task.due_date && (
            <span className={cn(
              "text-[11px] flex items-center gap-1",
              overdue ? "text-destructive font-medium" : "text-muted-foreground"
            )}>
              {overdue && <AlertTriangle className="h-3 w-3" />}
              <Clock className="h-3 w-3" />
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export function DashboardTasks() {
  const { tasks, loading, stats } = useTasks();

  // Show active tasks (not completed), sorted by priority then due date
  const priorityOrder: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
  const activeTasks = tasks
    .filter(t => t.status !== "Completed")
    .sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 3;
      const pb = priorityOrder[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    })
    .slice(0, 6);

  const overdueTasks = tasks.filter(t => isOverdue(t.due_date, t.status));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Tasks</h3>
        <Link
          to="/tasks"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          View all <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="glass-card p-4">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3 mb-4 pb-4 border-b border-border">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{stats.todo}</p>
            <p className="text-[11px] text-muted-foreground">To Do</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">{stats.inProgress}</p>
            <p className="text-[11px] text-muted-foreground">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-warning">{stats.review}</p>
            <p className="text-[11px] text-muted-foreground">Review</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-success">{stats.completed}</p>
            <p className="text-[11px] text-muted-foreground">Done</p>
          </div>
        </div>

        {/* Overdue alert */}
        {overdueTasks.length > 0 && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive font-medium">
              {overdueTasks.length} overdue {overdueTasks.length === 1 ? "task" : "tasks"}
            </p>
          </div>
        )}

        {/* Task list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : activeTasks.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 text-success/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activeTasks.map(task => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
