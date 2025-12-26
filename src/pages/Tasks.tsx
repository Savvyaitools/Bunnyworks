import { useState } from "react";
import { Search, Plus, Clock, User, Calendar, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTasks, Task, CreateTaskInput } from "@/hooks/useTasks";
import { useCreators } from "@/hooks/useCreators";
import { useEmployees } from "@/hooks/useEmployees";
import { Skeleton } from "@/components/ui/skeleton";

type Priority = "Low" | "Medium" | "High" | "Urgent";
type TaskStatus = "To Do" | "In Progress" | "Review" | "Completed";

const priorityColors: Record<Priority, string> = {
  Urgent: "bg-destructive/20 text-destructive border-destructive/30",
  High: "bg-destructive/20 text-destructive border-destructive/30",
  Medium: "bg-warning/20 text-warning border-warning/30",
  Low: "bg-muted text-muted-foreground border-border",
};

const statusColors: Record<TaskStatus, string> = {
  "To Do": "bg-muted text-muted-foreground",
  "In Progress": "bg-accent/20 text-accent",
  Review: "bg-warning/20 text-warning",
  Completed: "bg-success/20 text-success",
};

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "All">("All");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateTaskInput>>({
    title: "",
    description: "",
    status: "To Do",
    priority: "Medium",
    assignee_id: null,
    creator_id: null,
    due_date: null,
  });

  const { tasks, loading, stats, createTask, updateTask, deleteTask } = useTasks();
  const { creators } = useCreators();
  const { employees } = useEmployees();

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "All" || task.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses: (TaskStatus | "All")[] = ["All", "To Do", "In Progress", "Review", "Completed"];

  const groupedTasks = {
    "To Do": filteredTasks.filter(t => t.status === "To Do"),
    "In Progress": filteredTasks.filter(t => t.status === "In Progress"),
    "Review": filteredTasks.filter(t => t.status === "Review"),
    "Completed": filteredTasks.filter(t => t.status === "Completed"),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    await createTask({
      title: formData.title,
      description: formData.description || null,
      status: formData.status as TaskStatus,
      priority: formData.priority as Priority,
      assignee_id: formData.assignee_id || null,
      creator_id: formData.creator_id || null,
      due_date: formData.due_date || null,
    });

    setFormData({ title: "", description: "", status: "To Do", priority: "Medium", assignee_id: null, creator_id: null, due_date: null });
    setIsAddDialogOpen(false);
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    await updateTask(task.id, { status: newStatus });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getCreatorName = (creatorId: string | null) => {
    if (!creatorId) return "No creator";
    const creator = creators.find(c => c.id === creatorId);
    return creator?.name || "Unknown";
  };

  const getAssigneeName = (assigneeId: string | null) => {
    if (!assigneeId) return "Unassigned";
    const employee = employees.find(e => e.id === assigneeId);
    return employee?.name || "Unknown";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">
              {loading ? "Loading..." : `${stats.total} tasks • ${stats.inProgress} in progress`}
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Task title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Task description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v) => setFormData({ ...formData, priority: v as Priority })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={formData.due_date || ""}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value || null })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Select
                      value={formData.assignee_id || "none"}
                      onValueChange={(v) => setFormData({ ...formData, assignee_id: v === "none" ? null : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Creator</Label>
                    <Select
                      value={formData.creator_id || "none"}
                      onValueChange={(v) => setFormData({ ...formData, creator_id: v === "none" ? null : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select creator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No creator</SelectItem>
                        {creators.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-primary">
                  Create Task
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary input-glow"
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
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Task Columns */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((col) => (
              <div key={col} className="space-y-4">
                <Skeleton className="h-8 w-32" />
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {(Object.keys(groupedTasks) as TaskStatus[]).map((status, colIndex) => (
              <div 
                key={status} 
                className="space-y-4 animate-fade-in"
                style={{ animationDelay: `${150 + colIndex * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-foreground">{status}</h2>
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      {groupedTasks[status].length}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {groupedTasks[status].map((task, index) => (
                    <div
                      key={task.id}
                      className={cn(
                        "glass-card p-4 cursor-pointer transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5 group",
                        isOverdue(task.due_date) && task.status !== "Completed" && "border-destructive/50"
                      )}
                      style={{ animationDelay: `${200 + colIndex * 100 + index * 50}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={task.status === "Completed"}
                          onCheckedChange={(checked) => handleStatusChange(task, checked ? "Completed" : "To Do")}
                          className="mt-1 border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className={cn(
                            "font-medium text-foreground mb-1",
                            task.status === "Completed" && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge className={cn("border", priorityColors[task.priority as Priority])}>
                              {task.priority}
                            </Badge>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <User className="h-3 w-3" />
                              {getCreatorName(task.creator_id)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.due_date)}
                            </div>
                            {isOverdue(task.due_date) && task.status !== "Completed" && (
                              <Badge className="bg-destructive/20 text-destructive border-0 text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">{getAssigneeName(task.assignee_id)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTask(task.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {groupedTasks[status].length === 0 && (
                    <div className="glass-card p-8 text-center">
                      <p className="text-muted-foreground text-sm">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
