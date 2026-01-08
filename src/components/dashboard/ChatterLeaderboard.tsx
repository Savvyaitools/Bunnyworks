import { Trophy, MessageSquare, DollarSign, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatterStats {
  id: string;
  name: string;
  messagesSent: number;
  revenue: number;
  avatarSeed: string | null;
}

export function ChatterLeaderboard() {
  const { data: chatters, isLoading } = useQuery({
    queryKey: ["chatter-leaderboard"],
    queryFn: async () => {
      // Get chatters with their time logs for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: employees, error } = await supabase
        .from("employees")
        .select("id, name, avatar_seed")
        .eq("status", "Active")
        .eq("role", "Chatter");
      
      if (error) throw error;

      // Get today's time logs to see who's active
      const { data: timeLogs } = await supabase
        .from("chatter_time_logs")
        .select("chatter_id, duration_minutes")
        .gte("clock_in", today.toISOString());

      // Get message counts - using internal_messages as proxy
      const { data: messages } = await supabase
        .from("messages")
        .select("sender_name, id")
        .eq("sender_type", "chatter")
        .gte("created_at", today.toISOString());

      // Map employees to stats
      const chatterStats: ChatterStats[] = (employees || []).map((emp) => {
        const empTimeLogs = timeLogs?.filter(log => log.chatter_id === emp.id) || [];
        const totalMinutes = empTimeLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
        const messageCount = messages?.filter(m => m.sender_name === emp.name).length || 0;
        
        // Estimate revenue based on activity (placeholder until real tracking)
        const estimatedRevenue = messageCount * 2.5 + totalMinutes * 0.5;

        return {
          id: emp.id,
          name: emp.name,
          messagesSent: messageCount,
          revenue: estimatedRevenue,
          avatarSeed: emp.avatar_seed,
        };
      });

      // Sort by revenue and take top 5
      return chatterStats
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return "text-yellow-400";
      case 1: return "text-slate-300";
      case 2: return "text-amber-600";
      default: return "text-muted-foreground";
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-4 w-4 text-yellow-400" />;
    return <span className={`text-sm font-bold ${getRankColor(index)}`}>#{index + 1}</span>;
  };

  return (
    <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-foreground">Chatter Leaderboard</h3>
        </div>
        <span className="text-xs text-muted-foreground">Today</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      ) : !chatters || chatters.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No chatters active today</p>
          <p className="text-sm text-muted-foreground/70">
            Chatter stats will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {chatters.map((chatter, index) => (
            <div
              key={chatter.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${300 + index * 50}ms` }}
            >
              <div className="w-6 flex justify-center">
                {getRankIcon(index)}
              </div>
              
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-white/10">
                <span className="text-sm font-medium text-foreground">
                  {chatter.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{chatter.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>{chatter.messagesSent} msgs</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-success flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatCurrency(chatter.revenue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {chatters && chatters.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Team Revenue</span>
            <span className="font-semibold text-success flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {formatCurrency(chatters.reduce((sum, c) => sum + c.revenue, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
