import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarIcon } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { format } from "date-fns";

const eventTypeColors: Record<string, string> = {
  task: "bg-primary/80 text-primary-foreground",
  meeting: "bg-accent/80 text-accent-foreground",
  deadline: "bg-destructive/80 text-destructive-foreground",
  content: "bg-success/80 text-success-foreground",
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "task",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
  });

  const { events, loading, createEvent, getEventsByDay } = useCalendarEvents();

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

  const days = [];
  
  // Empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-28 bg-muted/20 rounded-lg" />);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = eventsByDay[day] || [];
    const isToday = day === todayDay;

    days.push(
      <div
        key={day}
        className={cn(
          "h-28 p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:border-primary/50",
          isToday ? "border-primary bg-primary/5" : "border-border bg-card/50 hover:bg-card"
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
              className={cn(
                "text-xs px-1.5 py-0.5 rounded truncate",
                eventTypeColors[event.event_type] || eventTypeColors.task
              )}
            >
              {format(new Date(event.start_date), "h:mm a")} {event.title}
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Calendar</h1>
            <p className="text-muted-foreground mt-1">View and manage your schedule</p>
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
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
          ].map((item) => (
            <div key={item.type} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded", eventTypeColors[item.type])} />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

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
    </DashboardLayout>
  );
}
