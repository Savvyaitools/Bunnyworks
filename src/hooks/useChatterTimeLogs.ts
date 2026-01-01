import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo, useCallback } from "react";

export interface ChatterTimeLog {
  id: string;
  chatter_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  shift_id: string | null;
  notes: string | null;
  created_at: string;
  chatter?: {
    id: string;
    name: string;
    skill_grade: string;
  };
}

export interface TimeLogStats {
  totalHoursToday: number;
  totalHoursWeek: number;
  activeClockIn: ChatterTimeLog | null;
}

export function useChatterTimeLogs(chatterId?: string) {
  const queryClient = useQueryClient();

  const { data: timeLogs = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["chatter-time-logs", chatterId],
    queryFn: async () => {
      let query = supabase
        .from("chatter_time_logs")
        .select(`
          *,
          chatter:chatters(id, name, skill_grade)
        `)
        .order("clock_in", { ascending: false });

      if (chatterId) {
        query = query.eq("chatter_id", chatterId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ChatterTimeLog[];
    },
  });

  const activeSession = useMemo(() => {
    return timeLogs.find(log => !log.clock_out) || null;
  }, [timeLogs]);

  const clockIn = useCallback(async (chatterIdParam: string, shiftId?: string, notes?: string) => {
    const { data: existing } = await supabase
      .from("chatter_time_logs")
      .select("id")
      .eq("chatter_id", chatterIdParam)
      .is("clock_out", null)
      .maybeSingle();

    if (existing) {
      toast.error("Already clocked in. Please clock out first.");
      return null;
    }

    const { data, error } = await supabase
      .from("chatter_time_logs")
      .insert({
        chatter_id: chatterIdParam,
        shift_id: shiftId || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error clocking in:", error);
      toast.error("Failed to clock in");
      return null;
    }

    toast.success("Clocked in successfully!");
    queryClient.invalidateQueries({ queryKey: ["chatter-time-logs"] });
    return data;
  }, [queryClient]);

  const clockOut = useCallback(async (logId: string) => {
    const { error } = await supabase
      .from("chatter_time_logs")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", logId);

    if (error) {
      console.error("Error clocking out:", error);
      toast.error("Failed to clock out");
      return false;
    }

    toast.success("Clocked out successfully!");
    queryClient.invalidateQueries({ queryKey: ["chatter-time-logs"] });
    return true;
  }, [queryClient]);

  const getStatsForChatter = useCallback((chatterIdParam: string): TimeLogStats => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);

    const chatterLogs = timeLogs.filter(log => log.chatter_id === chatterIdParam);
    
    const totalMinutesToday = chatterLogs
      .filter(log => new Date(log.clock_in) >= startOfDay)
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

    const totalMinutesWeek = chatterLogs
      .filter(log => new Date(log.clock_in) >= startOfWeek)
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

    const activeClockIn = chatterLogs.find(log => !log.clock_out) || null;

    return {
      totalHoursToday: Math.round(totalMinutesToday / 60 * 10) / 10,
      totalHoursWeek: Math.round(totalMinutesWeek / 60 * 10) / 10,
      activeClockIn,
    };
  }, [timeLogs]);

  const getAllChatterStats = useCallback(() => {
    const chatterIds = [...new Set(timeLogs.map(log => log.chatter_id))];
    return chatterIds.map(id => ({
      chatterId: id,
      chatterName: timeLogs.find(log => log.chatter_id === id)?.chatter?.name || "Unknown",
      ...getStatsForChatter(id),
    }));
  }, [timeLogs, getStatsForChatter]);

  return {
    timeLogs,
    loading,
    activeSession,
    clockIn,
    clockOut,
    getStatsForChatter,
    getAllChatterStats,
    refetch,
  };
}
