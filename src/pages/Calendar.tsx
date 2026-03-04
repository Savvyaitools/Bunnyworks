import { useState, DragEvent } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, MoreHorizontal, Pencil, XCircle, UserX, Trash2, GripVertical, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";
import { format } from "date-fns";
import { toast } from "sonner";

const eventTypeColors: Record<string, string> = {
  task: "bg-primary/80 text-primary-foreground",
  meeting: "bg-accent/80 text-accent-foreground",
  deadline: "bg-destructive/80 text-destructive-foreground",
  content: "bg-success/80 text-success-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
  no_show: "bg-warning/80 text-warning-foreground",
};

const eventTypeLabels: Record<string, string> = {
  task: "Task",
  meeting: "Meeting",
  deadline: "Deadline",
  content: "Content",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dropTargetDay, setDropTargetDay] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "task",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
  });

  const { events, loading, createEvent, updateEvent, deleteEvent, getEventsByDay } = useCalendarEvents();

  const today = new Date();
  const isCurrentMonth = 
    currentDate.getMonth() === today.getMonth() && 
    currentDate.getFullYear() === today.getFullYear();
  const todayDay = isCurrentMonth ? today.getDate() : -1;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const eventsByDay = getEventsByDay(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setIsDayDetailOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return;

    const startDate = new Date(`${formData.date}T${formData.time}:00`);

    await createEvent({
      title: formData.title,
      description: formData.description || null,
      event_type: formData.event_type,
      start_date: startDate.toISOString(),
      end_date: null,
      all_day: false,
      creator_id: null,
    });

    setFormData({
      title: "",
      description: "",
      event_type: "task",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "09:00",
    });
    setIsAddDialogOpen(false);
  };

  const handleEditClick = (event: CalendarEvent) => {
    const eventDate = new Date(event.start_date);
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      date: format(eventDate, "yyyy-MM-dd"),
      time: format(eventDate, "HH:mm"),
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !formData.title || !formData.date) return;

    const startDate = new Date(`${formData.date}T${formData.time}:00`);

    await updateEvent({
      id: selectedEvent.id,
      title: formData.title,
      description: formData.description || null,
      event_type: formData.event_type,
      start_date: startDate.toISOString(),
    });

    setFormData({
      title: "",
      description: "",
      event_type: "task",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "09:00",
    });
    setSelectedEvent(null);
    setIsEditDialogOpen(false);
  };

  const handleStatusChange = async (event: CalendarEvent, newStatus: string) => {
    await updateEvent({
      id: event.id,
      event_type: newStatus,
    });
  };

  const handleDeleteClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return;
    await deleteEvent(selectedEvent.id);
    setSelectedEvent(null);
    setIsDeleteDialogOpen(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, event: CalendarEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", event.id);
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDropTargetDay(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, day: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetDay(day);
  };

  const handleDragLeave = () => {
    setDropTargetDay(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetDay: number) => {
    e.preventDefault();
    setDropTargetDay(null);

    if (!draggedEvent) return;

    const originalDate = new Date(draggedEvent.start_date);
    const newDate = new Date(year, month, targetDay, originalDate.getHours(), originalDate.getMinutes());

    if (originalDate.getDate() === targetDay && originalDate.getMonth() === month && originalDate.getFullYear() === year) {
      return; // Same day, no need to update
    }

    await updateEvent({
      id: draggedEvent.id,
      start_date: newDate.toISOString(),
    });

    toast.success(`Event moved to ${format(newDate, "MMM d, yyyy")}`);
    setDraggedEvent(null);
  };

  const selectedDayEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];
  const selectedFullDate = selectedDay ? new Date(year, month, selectedDay) : null;

  const days = [];
  
  // Empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-28 bg-muted/20 rounded-lg" />);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = eventsByDay[day] || [];
    const isToday = day === todayDay;
    const isDropTarget = dropTargetDay === day;

    days.push(
      <div
        key={day}
        onClick={() => handleDayClick(day)}
        onDragOver={(e) => handleDragOver(e, day)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, day)}
        className={cn(
          "h-28 p-2 rounded-lg border transition-all duration-200 cursor-pointer",
          isToday ? "border-primary bg-primary/5" : "border-border bg-card/50 hover:bg-card",
          isDropTarget && "border-primary border-2 bg-primary/10 scale-[1.02]"
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            "text-sm font-medium",
            isToday ? "text-primary" : "text-foreground"
          )}>
            {day}
          </span>
          {isToday && (
            <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0">
              Today
            </Badge>
          )}
        </div>
        <div className="space-y-1 overflow-hidden">
          {dayEvents.slice(0, 2).map((event) => (
            <div
              key={event.id}
              draggable
              onDragStart={(e) => handleDragStart(e, event)}
              onDragEnd={handleDragEnd}
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(event);
              }}
              className={cn(
                "text-xs px-1.5 py-0.5 rounded truncate flex items-center justify-between group cursor-grab active:cursor-grabbing",
                eventTypeColors[event.event_type] || eventTypeColors.task,
                draggedEvent?.id === event.id && "opacity-50"
              )}
            >
              <div className="flex items-center gap-1 truncate">
                <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-50 flex-shrink-0" />
                <span className="truncate">
                  {format(new Date(event.start_date), "h:mm a")} {event.title}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 rounded hover:bg-black/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => handleEditClick(event)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatusChange(event, "cancelled")}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Mark Cancelled
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(event, "no_show")}>
                    <UserX className="h-4 w-4 mr-2" />
                    Mark No Show
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDeleteClick(event)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-xs text-muted-foreground px-1.5">
              +{dayEvents.length - 2} more
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
        <div className="space-y-6 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Calendar</h1>
            <p className="text-sm text-muted-foreground mt-1">View and manage your schedule</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Event title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="[color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="[color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Event details..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full bg-gradient-primary">
                  Add Event
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h2 className="text-xl font-semibold text-foreground">{monthName}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevMonth}
              className="bg-transparent border-border hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={goToToday}
              className="bg-transparent border-border hover:bg-muted"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="bg-transparent border-border hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "150ms" }}>
          {[
            { type: "task", label: "Tasks" },
            { type: "meeting", label: "Meetings" },
            { type: "deadline", label: "Deadlines" },
            { type: "content", label: "Content" },
            { type: "cancelled", label: "Cancelled" },
            { type: "no_show", label: "No Show" },
          ].map((item) => (
            <div key={item.type} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded", eventTypeColors[item.type])} />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Drag hint */}
        <p className="text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: "180ms" }}>
          💡 Tip: Drag events to reschedule them to a different day
        </p>

        {/* Calendar Grid */}
        <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days}
          </div>
        </div>

        {/* Empty state for no events */}
        {!loading && events.length === 0 && (
          <div className="text-center py-8 animate-fade-in glass-card">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No events scheduled yet</p>
            <p className="text-sm text-muted-foreground/70">Click "Add Event" to create your first event</p>
          </div>
        )}
      </div>

      {/* Day Detail Dialog */}
      <Dialog open={isDayDetailOpen} onOpenChange={setIsDayDetailOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {selectedFullDate && format(selectedFullDate, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No events on this day</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setIsDayDetailOpen(false);
                    if (selectedFullDate) {
                      setFormData({
                        ...formData,
                        date: format(selectedFullDate, "yyyy-MM-dd"),
                      });
                    }
                    setIsAddDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents
                  .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                  .map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      setIsDayDetailOpen(false);
                      handleEditClick(event);
                    }}
                    className={cn(
                      "p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                      "bg-card/80 border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={cn("text-xs", eventTypeColors[event.event_type])}>
                            {eventTypeLabels[event.event_type] || event.event_type}
                          </Badge>
                        </div>
                        <h4 className={cn(
                          "font-medium text-foreground",
                          event.event_type === "cancelled" && "line-through text-muted-foreground"
                        )}>
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          {format(new Date(event.start_date), "h:mm a")}
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => {
                            setIsDayDetailOpen(false);
                            handleEditClick(event);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(event, "cancelled")}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Mark Cancelled
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(event, "no_show")}>
                            <UserX className="h-4 w-4 mr-2" />
                            Mark No Show
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setIsDayDetailOpen(false);
                              handleDeleteClick(event);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => {
                    setIsDayDetailOpen(false);
                    if (selectedFullDate) {
                      setFormData({
                        ...formData,
                        date: format(selectedFullDate, "yyyy-MM-dd"),
                      });
                    }
                    setIsAddDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="[color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="[color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event details..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-primary">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
