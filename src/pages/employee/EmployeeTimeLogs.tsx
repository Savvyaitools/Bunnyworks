import { useState, useEffect, useCallback } from "react";
import { Clock, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { cn } from "@/lib/utils";
import { format, parseISO, startOfWeek, endOfWeek, isThisWeek } from "date-fns";

interface TimeLog {
  id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  notes: string | null;
}

export default function EmployeeTimeLogs() {
  const { user } = useAuth();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyHours, setWeeklyHours] = useState(0);

  const fetchTimeLogs = useCallback(async () => {
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

    // Fetch time logs for this chatter
    const { data, error } = await supabase
      .from("chatter_time_logs")
      .select("*")
      .eq("chatter_id", chatter.id)
      .order("clock_in", { ascending: false })
      .limit(50);

    if (!error && data) {
      setTimeLogs(data);

      // Calculate weekly hours
      const thisWeekLogs = data.filter((log) => isThisWeek(parseISO(log.clock_in)));
      const totalMinutes = thisWeekLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      setWeeklyHours(totalMinutes / 60);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchTimeLogs();
  }, [fetchTimeLogs]);

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "In progress";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Time Logs</h1>
          <p className="text-sm text-muted-foreground">Your clock in/out history</p>
        </div>

        {/* Weekly Summary */}
        <div className="glass-card p-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-3xl font-bold text-foreground">{weeklyHours.toFixed(1)} hrs</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Time Logs List */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "50ms" }}>
          {timeLogs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No time logs yet.</p>
            </div>
          ) : (
            timeLogs.map((log, index) => (
              <div
                key={log.id}
                className={cn(
                  "glass-card p-4 animate-fade-in",
                  !log.clock_out && "border-success/50 bg-success/5"
                )}
                style={{ animationDelay: `${100 + index * 30}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-foreground">
                      {format(parseISO(log.clock_in), "EEE, MMM d")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      !log.clock_out ? "text-success" : "text-foreground"
                    )}
                  >
                    {formatDuration(log.duration_minutes)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>In: {format(parseISO(log.clock_in), "h:mm a")}</span>
                  {log.clock_out && (
                    <span>Out: {format(parseISO(log.clock_out), "h:mm a")}</span>
                  )}
                </div>
                {log.notes && (
                  <p className="text-sm text-muted-foreground mt-2 italic">{log.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}