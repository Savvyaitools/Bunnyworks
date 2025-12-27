import { useState, useMemo } from "react";
import { 
  Plus, ChevronLeft, ChevronRight, Clock, 
  AlertTriangle, Users, Calendar as CalendarIcon
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useChatterShifts, CreateShiftInput } from "@/hooks/useChatterShifts";
import { useChatters } from "@/hooks/useChatters";
import { useCreators } from "@/hooks/useCreators";
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from "date-fns";

const gradeColors: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-yellow-500",
  C: "bg-orange-500",
};

export default function ShiftRoster() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    chatter_id: "",
    creator_id: "",
    shift_start: "",
    shift_end: "",
    shift_type: "regular",
    notes: "",
  });

  const { shifts, loading, createShift, deleteShift } = useChatterShifts();
  const { chatters } = useChatters();
  const { creators } = useCreators();

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const shiftsGroupedByDay = useMemo(() => {
    const grouped: Record<string, typeof shifts> = {};
    weekDays.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      grouped[dateStr] = shifts.filter((shift) => {
        const shiftDate = parseISO(shift.shift_start);
        return isSameDay(shiftDate, day);
      });
    });
    return grouped;
  }, [shifts, weekDays]);

  const coverageWarnings = useMemo(() => {
    const warnings: string[] = [];
    weekDays.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayShifts = shiftsGroupedByDay[dateStr] || [];
      if (dayShifts.length === 0) {
        warnings.push(`${format(day, "EEEE, MMM d")} has no coverage`);
      }
    });
    return warnings;
  }, [weekDays, shiftsGroupedByDay]);

  const handlePrevWeek = () => setCurrentWeekStart((prev) => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeekStart((prev) => addWeeks(prev, 1));

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chatter_id || !formData.creator_id || !formData.shift_start || !formData.shift_end) return;

    const input: CreateShiftInput = {
      chatter_id: formData.chatter_id,
      creator_id: formData.creator_id,
      shift_start: formData.shift_start,
      shift_end: formData.shift_end,
      shift_type: formData.shift_type,
      notes: formData.notes || null,
    };

    await createShift(input);
    setFormData({ chatter_id: "", creator_id: "", shift_start: "", shift_end: "", shift_type: "regular", notes: "" });
    setIsAddDialogOpen(false);
    setSelectedDate(null);
  };

  const openAddDialog = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
      const dateStr = format(date, "yyyy-MM-dd");
      setFormData((prev) => ({
        ...prev,
        shift_start: `${dateStr}T09:00`,
        shift_end: `${dateStr}T17:00`,
      }));
    }
    setIsAddDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Shift Roster</h1>
            <p className="text-muted-foreground mt-1">
              {format(currentWeekStart, "MMMM d")} - {format(addDays(currentWeekStart, 6), "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-card rounded-lg border border-border">
              <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                Today
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shift
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add New Shift</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddShift} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chatter *</Label>
                    <Select
                      value={formData.chatter_id}
                      onValueChange={(v) => setFormData({ ...formData, chatter_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select chatter" />
                      </SelectTrigger>
                      <SelectContent>
                        {chatters.filter((c) => c.is_active).map((chatter) => (
                          <SelectItem key={chatter.id} value={chatter.id}>
                            {chatter.name} (Grade {chatter.skill_grade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Creator *</Label>
                    <Select
                      value={formData.creator_id}
                      onValueChange={(v) => setFormData({ ...formData, creator_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select creator" />
                      </SelectTrigger>
                      <SelectContent>
                        {creators.filter((c) => c.status === "Active").map((creator) => (
                          <SelectItem key={creator.id} value={creator.id}>
                            {creator.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start *</Label>
                      <Input
                        type="datetime-local"
                        value={formData.shift_start}
                        onChange={(e) => setFormData({ ...formData, shift_start: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End *</Label>
                      <Input
                        type="datetime-local"
                        value={formData.shift_end}
                        onChange={(e) => setFormData({ ...formData, shift_end: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Shift Type</Label>
                    <Select
                      value={formData.shift_type}
                      onValueChange={(v) => setFormData({ ...formData, shift_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="overtime">Overtime</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="backup">Backup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary">
                    Add Shift
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Coverage Warnings */}
        {coverageWarnings.length > 0 && (
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <span className="font-medium text-yellow-400">Coverage Gaps</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {coverageWarnings.map((warning, i) => (
                <Badge key={i} variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  {warning}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Week Grid */}
        {loading ? (
          <div className="grid grid-cols-7 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="min-h-[300px] rounded-xl bg-card border border-border p-3">
                <Skeleton className="h-5 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayShifts = shiftsGroupedByDay[dateStr] || [];
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={dateStr}
                  className={cn(
                    "min-h-[300px] rounded-xl bg-card border p-3 transition-all",
                    isToday ? "border-primary ring-1 ring-primary" : "border-border"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        isToday ? "text-primary" : "text-muted-foreground"
                      )}>
                        {format(day, "EEE")}
                      </p>
                      <p className={cn(
                        "text-lg font-bold",
                        isToday ? "text-primary" : "text-foreground"
                      )}>
                        {format(day, "d")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openAddDialog(day)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {dayShifts.length === 0 ? (
                      <div className="p-3 rounded-lg border border-dashed border-border text-center">
                        <p className="text-xs text-muted-foreground">No shifts</p>
                      </div>
                    ) : (
                      dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="p-2 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${shift.chatter?.name}`} />
                              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                {shift.chatter?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-foreground truncate">
                              {shift.chatter?.name}
                            </span>
                            <span className={cn(
                              "w-2 h-2 rounded-full ml-auto shrink-0",
                              gradeColors[shift.chatter?.skill_grade || "B"]
                            )} />
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(parseISO(shift.shift_start), "HH:mm")} - {format(parseISO(shift.shift_end), "HH:mm")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            → {shift.creator?.name}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span>Grade A</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Grade B</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span>Grade C</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
