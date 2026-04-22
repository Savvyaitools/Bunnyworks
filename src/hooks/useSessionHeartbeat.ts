import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const HEARTBEAT_INTERVAL_MS = 60_000; // 60 seconds

export function useSessionHeartbeat(
  browserbaseSessionId: string | null,
  chatterId?: string
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!browserbaseSessionId) return;

    const sendHeartbeat = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) return;

        await supabase.functions.invoke("browserbase-session", {
          body: {
            action: "session_heartbeat",
            browserbaseSessionId,
            chatterId,
          },
        });
      } catch (err) {
        console.warn("Heartbeat failed:", err);
      }
    };

    // Send immediately on mount
    sendHeartbeat();

    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [browserbaseSessionId, chatterId]);
}
