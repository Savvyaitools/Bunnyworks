import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  type: "task" | "meeting" | "deadline" | "content";
  time?: string;
}

interface DayEvents {
  [key: number]: CalendarEvent[];
}

const events: DayEvents = {
  2: [{ id: "1", title: "Content review", type: "task", time: "10:00 AM" }],
  5: [
    { id: "2", title: "Team standup", type: "meeting", time: "9:00 AM" },
    { id: "3", title: "Emma's content drop", type: "content", time: "2:00 PM" },
  ],
  8: [{ id: "4", title: "Invoice deadline", type: "deadline" }],
  12: [{ id: "5", title: "Creator call - Luna", type: "meeting", time: "11:00 AM" }],
  15: [{ id: "6", title: "Monthly report due", type: "deadline" }],
  18: [
    { id: "7", title: "New creator onboarding", type: "task", time: "10:00 AM" },
    { id: "8", title: "Content strategy meeting", type: "meeting", time: "3:00 PM" },
  ],
  22: [{ id: "9", title: "Holiday content schedule", type: "content" }],
  25: [{ id: "10", title: "Christmas", type: "deadline" }],
  26: [{ id: "11", title: "Video editing review", type: "task", time: "2:00 PM" }],
  28: [{ id: "12", title: "Year-end analytics", type: "task" }],
  31: [{ id: "13", title: "New Year preparation", type: "content" }],
};

const eventTypeColors: Record<string, string> = {
  task: "bg-primary/80 text-primary-foreground",
  meeting: "bg-accent/80 text-accent-foreground",
  deadline: "bg-destructive/80 text-destructive-foreground",
  content: "bg-success/80 text-success-foreground",
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 1)); // December 2024
  const today = 26; // Current day

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const days = [];
  
  // Empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-28 bg-muted/20 rounded-lg" />);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = events[day] || [];
    const isToday = day === today;

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
                eventTypeColors[event.type]
              )}
            >
              {event.time && <span className="opacity-80">{event.time} </span>}
              {event.title}
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
          <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
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
              onClick={() => setCurrentDate(new Date(2024, 11, 1))}
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
      </div>
    </DashboardLayout>
  );
}
