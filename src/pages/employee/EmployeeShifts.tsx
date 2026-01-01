import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { cn } from "@/lib/utils";
import { format, parseISO, isToday, isFuture, isPast } from "date-fns";

interface Shift {
  id: string;
  shift_start: string;
  shift_end: string;
  shift_type: string | null;
  notes: string | null;
  creator_id: string;
  creators?: {
    name: string;
  };
}

export default function EmployeeShifts() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShifts = useCallback(async () => {
    if (!user?.id) return;

    // Get chatter ID for this user
    const { data: chatter } = await supabase
      .from("chatters")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!chatter) {
      setLoading(false);
      return;
    }

    // Fetch shifts for this chatter
    const { data, error } = await supabase
      .from("chatter_shifts")
      .select(`
        id,
        shift_start,
        shift_end,
        shift_type,
        notes,
        creator_id,
        creators (name)
      `)
      .eq("chatter_id", chatter.id)
      .order("shift_start", { ascending: true });

    if (!error && data) {
      setShifts(data);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const getShiftStatus = (shift: Shift) => {
    const start = parseISO(shift.shift_start);
    const end = parseISO(shift.shift_end);
    const now = new Date();

    if (now >= start && now <= end) return "active";
    if (isFuture(start)) return "upcoming";
    return "past";
  };

  const groupedShifts = {
    today: shifts.filter((s) => isToday(parseISO(s.shift_start))),
    upcoming: shifts.filter((s) => isFuture(parseISO(s.shift_start)) && !isToday(parseISO(s.shift_start))),
    past: shifts.filter((s) => isPast(parseISO(s.shift_end)) && !isToday(parseISO(s.shift_start))).slice(0, 5),
  };

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Shifts</h1>
          <p className="text-sm text-muted-foreground">View your scheduled shifts</p>
        </div>

        {/* Today's Shifts */}
        {groupedShifts.today.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today
            </h2>
            {groupedShifts.today.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} status={getShiftStatus(shift)} />
            ))}
          </div>
        )}

        {/* Upcoming Shifts */}
        {groupedShifts.upcoming.length > 0 && (
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: "50ms" }}>
            <h2 className="text-lg font-semibold text-foreground">Upcoming</h2>
            {groupedShifts.upcoming.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} status="upcoming" />
            ))}
          </div>
        )}

        {/* Past Shifts */}
        {groupedShifts.past.length > 0 && (
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <h2 className="text-lg font-semibold text-muted-foreground">Recent</h2>
            {groupedShifts.past.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} status="past" />
            ))}
          </div>
        )}

        {shifts.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No shifts scheduled yet.</p>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}

function ShiftCard({ shift, status }: { shift: Shift; status: "active" | "upcoming" | "past" }) {
  const start = parseISO(shift.shift_start);
  const end = parseISO(shift.shift_end);
  const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  return (
    <div
      className={cn(
        "glass-card p-4 transition-all",
        status === "active" && "border-success/50 bg-success/5",
        status === "past" && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-foreground">
            {format(start, "EEE, MMM d")}
          </p>
          <p className="text-sm text-muted-foreground">
            {shift.creators?.name || "General"}
          </p>
        </div>
        <Badge
          className={cn(
            status === "active" && "bg-success/20 text-success border-success/30",
            status === "upcoming" && "bg-primary/20 text-primary border-primary/30",
            status === "past" && "bg-muted text-muted-foreground border-border"
          )}
        >
          {status === "active" ? "Active" : status === "upcoming" ? "Upcoming" : "Completed"}
        </Badge>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {format(start, "h:mm a")} - {format(end, "h:mm a")}
          </span>
        </div>
        <span className="text-muted-foreground">({duration.toFixed(1)} hrs)</span>
      </div>
      {shift.notes && (
        <p className="text-sm text-muted-foreground mt-2 italic">{shift.notes}</p>
      )}
    </div>
  );
}