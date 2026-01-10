import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAgency } from "./useAgency";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  creator_id: string | null;
  agency_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useCalendarEvents() {
  const queryClient = useQueryClient();
  const { agencyId } = useAgency();

  const { data: events = [], isLoading: loading } = useQuery({
    queryKey: ["calendar-events", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("agency_id", agencyId)
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!agencyId,
  });

  const createEvent = useMutation({
    mutationFn: async (event: Omit<CalendarEvent, "id" | "created_at" | "updated_at" | "agency_id">) => {
      if (!agencyId) {
        throw new Error("Agency ID not found");
      }

      const { data, error } = await supabase
        .from("calendar_events")
        .insert({ ...event, agency_id: agencyId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Event created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create event: " + error.message);
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalendarEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Event updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update event: " + error.message);
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Event deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete event: " + error.message);
    },
  });

  // Get events for a specific month
  const getEventsForMonth = (year: number, month: number) => {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    return events.filter((event) => {
      const eventDate = new Date(event.start_date);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    });
  };

  // Group events by day number
  const getEventsByDay = (year: number, month: number) => {
    const monthEvents = getEventsForMonth(year, month);
    const grouped: Record<number, CalendarEvent[]> = {};

    monthEvents.forEach((event) => {
      const day = new Date(event.start_date).getDate();
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(event);
    });

    return grouped;
  };

  return {
    events,
    loading,
    createEvent: createEvent.mutateAsync,
    updateEvent: updateEvent.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync,
    getEventsForMonth,
    getEventsByDay,
  };
}
