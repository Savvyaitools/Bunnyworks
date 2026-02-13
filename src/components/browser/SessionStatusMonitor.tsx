import { useBrowserSessions } from "@/hooks/useBrowserSessions";
import { Badge } from "@/components/ui/badge";
import { Monitor } from "lucide-react";

export function SessionStatusMonitor() {
  const { activeSessions, sessionsLoading } = useBrowserSessions();

  if (sessionsLoading || activeSessions.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Monitor className="h-4 w-4 text-primary" />
      <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
        {activeSessions.length} active session{activeSessions.length !== 1 ? "s" : ""}
      </Badge>
    </div>
  );
}
