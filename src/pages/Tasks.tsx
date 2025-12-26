import { useState } from "react";
import { Search, Plus, Filter, Clock, User, Calendar } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Priority = "High" | "Medium" | "Low";
type TaskStatus = "To Do" | "In Progress" | "Done";

interface Task {
  id: string;
  title: string;
  description: string;
  creator: string;
  assignee: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  isOverdue: boolean;
}

const tasks: Task[] = [
  {
    id: "1",
    title: "Video editing for weekly content",
    description: "Edit and finalize 3 videos for Emma's weekly schedule",
    creator: "Emma Rose",
    assignee: "Alex Rivera",
    priority: "High",
    status: "In Progress",
    dueDate: "Dec 27",
    isOverdue: false,
  },
  {
    id: "2",
    title: "Content review and approval",
    description: "Review submitted content for quality and brand alignment",
    creator: "Luna Star",
    assignee: "Sarah Johnson",
    priority: "High",
    status: "To Do",
    dueDate: "Dec 25",
    isOverdue: true,
  },
  {
    id: "3",
    title: "Schedule social media posts",
    description: "Schedule next week's promotional posts across platforms",
    creator: "Mia Chen",
    assignee: "Jordan Lee",
    priority: "Medium",
    status: "Done",
    dueDate: "Dec 24",
    isOverdue: false,
  },
  {
    id: "4",
    title: "Onboarding checklist completion",
    description: "Complete remaining onboarding steps for new creator",
    creator: "Jessica Blake",
    assignee: "Mike Chen",
    priority: "High",
    status: "In Progress",
    dueDate: "Dec 28",
    isOverdue: false,
  },
  {
    id: "5",
    title: "Monthly analytics report",
    description: "Compile performance metrics and insights for stakeholders",
    creator: "All Creators",
    assignee: "Sarah Johnson",
    priority: "Medium",
    status: "To Do",
    dueDate: "Dec 31",
    isOverdue: false,
  },
  {
    id: "6",
    title: "Fan message responses",
    description: "Respond to priority fan messages in queue",
    creator: "Sophie Taylor",
    assignee: "Jordan Lee",
    priority: "Low",
    status: "To Do",
    dueDate: "Dec 26",
    isOverdue: false,
  },
];

const priorityColors: Record<Priority, string> = {
  High: "bg-destructive/20 text-destructive border-destructive/30",
  Medium: "bg-warning/20 text-warning border-warning/30",
  Low: "bg-muted text-muted-foreground border-border",
};

const statusColors: Record<TaskStatus, string> = {
  "To Do": "bg-muted text-muted-foreground",
  "In Progress": "bg-accent/20 text-accent",
  "Done": "bg-success/20 text-success",
};

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "All">("All");

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.creator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "All" || task.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses: (TaskStatus | "All")[] = ["All", "To Do", "In Progress", "Done"];

  const groupedTasks = {
    "To Do": filteredTasks.filter(t => t.status === "To Do"),
    "In Progress": filteredTasks.filter(t => t.status === "In Progress"),
    "Done": filteredTasks.filter(t => t.status === "Done"),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage and track all creator-related tasks</p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      "glass-card p-4 cursor-pointer transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5",
                      task.isOverdue && "border-destructive/50"
                    )}
                    style={{ animationDelay: `${200 + colIndex * 100 + index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={task.status === "Done"}
                        className="mt-1 border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "font-medium text-foreground mb-1",
                          task.status === "Done" && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {task.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge className={cn("border", priorityColors[task.priority])}>
                            {task.priority}
                          </Badge>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <User className="h-3 w-3" />
                            {task.creator}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {task.dueDate}
                          </div>
                          {task.isOverdue && (
                            <Badge className="bg-destructive/20 text-destructive border-0 text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
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
      </div>
    </DashboardLayout>
  );
}
