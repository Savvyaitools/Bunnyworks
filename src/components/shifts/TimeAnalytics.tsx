import { useMemo } from "react";
import { Clock, TrendingUp, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useChatterTimeLogs } from "@/hooks/useChatterTimeLogs";
import { getAvatarUrl } from "@/lib/formatters";

export function TimeAnalytics() {
  const { timeLogs, loading, getAllChatterStats } = useChatterTimeLogs();
  const chatterStats = getAllChatterStats();

  const totalHoursToday = useMemo(() => {
    return chatterStats.reduce((sum, stat) => sum + stat.totalHoursToday, 0);
  }, [chatterStats]);

  const totalHoursWeek = useMemo(() => {
    return chatterStats.reduce((sum, stat) => sum + stat.totalHoursWeek, 0);
  }, [chatterStats]);

  const activeChatters = useMemo(() => {
    return chatterStats.filter(stat => stat.activeClockIn).length;
  }, [chatterStats]);

  const averageHoursPerChatter = useMemo(() => {
    if (chatterStats.length === 0) return 0;
    return Math.round((totalHoursWeek / chatterStats.length) * 10) / 10;
  }, [chatterStats, totalHoursWeek]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-3xl font-bold text-primary">{activeChatters}</p>
              </div>
              <Users className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hours Today</p>
                <p className="text-3xl font-bold">{totalHoursToday}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hours This Week</p>
                <p className="text-3xl font-bold">{totalHoursWeek}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg/Chatter</p>
                <p className="text-3xl font-bold">{averageHoursPerChatter}h</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chatter Breakdown */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Chatter Hours Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chatterStats.map((stat) => (
              <div key={stat.chatterId} className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getAvatarUrl(stat.chatterName, "avataaars")} />
                  <AvatarFallback>{stat.chatterName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{stat.chatterName}</span>
                      {stat.activeClockIn && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stat.totalHoursWeek}h / 40h
                    </span>
                  </div>
                  <Progress 
                    value={(stat.totalHoursWeek / 40) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}

            {chatterStats.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No time logs recorded yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
