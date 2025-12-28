import { useState, useEffect } from "react";
import { Clock, LogIn, LogOut, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChatterTimeLogs } from "@/hooks/useChatterTimeLogs";
import { cn } from "@/lib/utils";

interface ClockInWidgetProps {
  chatterId: string;
  chatterName: string;
  compact?: boolean;
}

export function ClockInWidget({ chatterId, chatterName, compact = false }: ClockInWidgetProps) {
  const { activeSession, clockIn, clockOut, getStatsForChatter } = useChatterTimeLogs(chatterId);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const stats = getStatsForChatter(chatterId);

  useEffect(() => {
    if (!activeSession) {
      setElapsedTime("00:00:00");
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeSession.clock_in);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleClockIn = () => clockIn(chatterId);
  const handleClockOut = () => {
    if (activeSession) {
      clockOut(activeSession.id);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {activeSession ? (
          <>
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
              <Timer className="h-3 w-3 mr-1" />
              {elapsedTime}
            </Badge>
            <Button size="sm" variant="destructive" onClick={handleClockOut}>
              <LogOut className="h-3 w-3 mr-1" />
              Out
            </Button>
          </>
        ) : (
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleClockIn}>
            <LogIn className="h-3 w-3 mr-1" />
            Clock In
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge className={cn(
              activeSession 
                ? "bg-green-500/20 text-green-400 border-green-500/30" 
                : "bg-muted text-muted-foreground"
            )}>
              {activeSession ? "Clocked In" : "Clocked Out"}
            </Badge>
          </div>

          {/* Timer Display */}
          {activeSession && (
            <div className="text-center py-4">
              <div className="text-3xl font-mono font-bold text-primary">
                {elapsedTime}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Started at {new Date(activeSession.clock_in).toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-lg font-semibold">{stats.totalHoursToday}h</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">This Week</p>
              <p className="text-lg font-semibold">{stats.totalHoursWeek}h</p>
            </div>
          </div>

          {/* Clock Button */}
          {activeSession ? (
            <Button 
              className="w-full bg-destructive hover:bg-destructive/90" 
              onClick={handleClockOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Clock Out
            </Button>
          ) : (
            <Button 
              className="w-full bg-green-600 hover:bg-green-700" 
              onClick={handleClockIn}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Clock In
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
