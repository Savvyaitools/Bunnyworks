import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OnlyFansEvent {
  id: string;
  agency_id: string;
  of_account_id: string;
  creator_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  created_at: string;
}

export function useOnlyFansEvents(limit = 50) {
  const [realtimeEvents, setRealtimeEvents] = useState<OnlyFansEvent[]>([]);

  // Fetch initial events
  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ["onlyfans-events", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onlyfans_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as OnlyFansEvent[];
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("onlyfans-events-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "onlyfans_events",
        },
        (payload) => {
          const newEvent = payload.new as OnlyFansEvent;
          setRealtimeEvents((prev) => [newEvent, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  // Merge initial and realtime events
  const allEvents = [...realtimeEvents, ...(events || [])];
  const uniqueEvents = Array.from(
    new Map(allEvents.map((e) => [e.id, e])).values()
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    events: uniqueEvents.slice(0, limit),
    isLoading,
    refetch,
  };
}
