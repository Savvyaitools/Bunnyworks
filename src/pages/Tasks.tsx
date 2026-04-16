import { useState } from "react";
import { Search, Plus, Clock, User, Calendar, Trash2, Tag, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
import { TaskForm } from "@/components/forms/TaskForm";
import type { TaskFormValues } from "@/lib/validations";
import { PageHeader } from "@/components/shared/PageHeader";

type Priority = "Low" | "Medium" | "High" | "Urgent";
type TaskStatus = "To Do" | "In Progress" | "Review" | "Completed";
type RequestType = "general" | "custom";

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

const requestTypeColors: Record<RequestType, string> = {
  general: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  custom: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "All">("All");
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType | "all">("all");
  const isMobile = useIsMobile();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [collapsedStatuses, setCollapsedStatuses] = useState<Record<string, boolean>>({});

  const { tasks, loading, stats, createTask, updateTask, deleteTask } = useTasks();
  const { creators } = useCreators();
  const { employees } = useEmployees();

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "All" || task.status === selectedStatus;
    const matchesRequestType = selectedRequestType === "all" || 
      (task as any).request_type === selectedRequestType;
    return matchesSearch && matchesStatus && matchesRequestType;
  });

  const statuses: (TaskStatus | "All")[] = ["All", "To Do", "Completed"];
  const requestTypes: { value: RequestType | "all"; label: string }[] = [
    { value: "all", label: "All Types" },
    { value: "general", label: "General" },
    { value: "custom", label: "Custom Request" },
  ];

  const groupedTasks = {
    "To Do": filteredTasks.filter(t => t.status === "To Do" || t.status === "In Progress" || t.status === "Review"),
    "Completed": filteredTasks.filter(t => t.status === "Completed"),
  };

  const handleSubmit = async (data: TaskFormValues) => {
    await createTask({
      title: data.title,
      description: data.description || null,
      status: "To Do" as TaskStatus,
      priority: data.priority as Priority,
      assignee_id: data.assignee_id === "none" ? null : data.assignee_id || null,
      creator_id: data.creator_id === "none" ? null : data.creator_id || null,
      due_date: data.due_date || null,
      request_type: data.request_type || "general",
      media_url: data.media_url || null,
    } as CreateTaskInput);
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
      <div className="space-y-6 max-w-[1400px]">
        {/* Header */}
        <PageHeader
          title="Tasks"
          subtitle={loading ? "Loading..." : `${stats.total} tasks · ${stats.completed} completed`}
        >
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 transition-colors shadow-glow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <TaskForm 
                onSubmit={handleSubmit} 
                creators={creators}
                employees={employees}
              />
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/60 border-border focus:border-primary/50 h-9 text-sm"
            />
          </div>
          <Select
            value={selectedRequestType}
            onValueChange={(v) => setSelectedRequestType(v as RequestType | "all")}
          >
            <SelectTrigger className="w-40 bg-card border-border">
              <Tag className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {requestTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((col) => (
              <div key={col} className="space-y-4">
                <Skeleton className="h-8 w-32" />
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(
            isMobile ? "space-y-4" : "grid grid-cols-1 lg:grid-cols-2 gap-6"
          )}>
            {(Object.keys(groupedTasks) as TaskStatus[]).map((status, colIndex) => {
              const isCollapsed = isMobile && collapsedStatuses[status];
              const toggleCollapse = () => setCollapsedStatuses(prev => ({ ...prev, [status]: !prev[status] }));

              return (
                <div 
                  key={status} 
                  className="space-y-3 animate-fade-in"
                  style={{ animationDelay: `${150 + colIndex * 100}ms` }}
                >
                  <div 
                    className={cn("flex items-center justify-between", isMobile && "cursor-pointer p-3 glass-card")}
                    onClick={isMobile ? toggleCollapse : undefined}
                  >
                    <div className="flex items-center gap-2">
                      {isMobile && (
                        isCollapsed 
                          ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h2 className="font-semibold text-foreground">{status}</h2>
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">
                        {groupedTasks[status].length}
                      </Badge>
                    </div>
                  </div>

                  {!isCollapsed && (
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
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 whitespace-pre-wrap text-justify">
                                  {task.description}
                                </p>
                              )}

                              {task.media_url && (
                                <a
                                  href={task.media_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 mb-3 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Workflow / Directions
                                </a>
                              )}

                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <Badge className={cn("border", priorityColors[task.priority as Priority])}>
                                  {task.priority}
                                </Badge>
                                {(task as any).request_type === "custom" && (
                                  <Badge className={cn("border", requestTypeColors.custom)}>
                                    Custom
                                  </Badge>
                                )}
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredTasks.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No tasks found matching your criteria.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
