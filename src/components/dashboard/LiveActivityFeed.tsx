import { DollarSign, MessageSquare, UserPlus, Heart, Zap, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency } from "@/lib/formatters";

interface LiveActivity {
  id: string;
  type: "tip" | "subscription" | "message" | "ppv" | "renewal";
  icon: typeof DollarSign;
  title: string;
  amount?: number;
  creatorName: string;
  time: string;
  iconBg: string;
  iconColor: string;
}

export function LiveActivityFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["live-activity-feed"],
    queryFn: async () => {
      const liveActivities: LiveActivity[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch recent earnings as tips/purchases
      const { data: earnings } = await supabase
        .from("creator_earnings")
        .select("id, amount, created_at, creator_id, notes, platform")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false })
        .limit(5);

      // Get creator names
      const creatorIds = [...new Set(earnings?.map(e => e.creator_id) || [])];
      const { data: creators } = await supabase
        .from("creators")
        .select("id, name, alias")
        .in("id", creatorIds.length > 0 ? creatorIds : ["none"]);

      const creatorMap = new Map(creators?.map(c => [c.id, c.alias || c.name]) || []);

      earnings?.forEach((earning) => {
        const isPPV = earning.notes?.toLowerCase().includes("ppv");
        const isTip = earning.notes?.toLowerCase().includes("tip");
        const isSub = earning.notes?.toLowerCase().includes("sub");
        
        let type: LiveActivity["type"] = "tip";
        let icon = DollarSign;
        let title = "Tip received";
        let iconBg = "bg-success/20";
        let iconColor = "text-success";

        if (isPPV) {
          type = "ppv";
          icon = Gift;
          title = "PPV purchased";
          iconBg = "bg-primary/20";
          iconColor = "text-primary";
        } else if (isSub) {
          type = "subscription";
          icon = UserPlus;
          title = "New subscription";
          iconBg = "bg-accent/20";
          iconColor = "text-accent";
        } else if (isTip) {
          type = "tip";
          icon = Heart;
          title = "Tip received";
          iconBg = "bg-pink-500/20";
          iconColor = "text-pink-500";
        }

        liveActivities.push({
          id: earning.id,
          type,
          icon,
          title,
          amount: Number(earning.amount),
          creatorName: creatorMap.get(earning.creator_id) || "Unknown",
          time: formatDistanceToNow(new Date(earning.created_at), { addSuffix: true }),
          iconBg,
          iconColor,
        });
      });

      // Add some mock live activities if no real data
      if (liveActivities.length === 0) {
        return [
          {
            id: "mock-1",
            type: "tip" as const,
            icon: Heart,
            title: "Tip received",
            amount: 25,
            creatorName: "Demo Creator",
            time: "just now",
            iconBg: "bg-pink-500/20",
            iconColor: "text-pink-500",
          },
          {
            id: "mock-2",
            type: "subscription" as const,
            icon: UserPlus,
            title: "New subscription",
            amount: 14.99,
            creatorName: "Demo Creator",
            time: "2 min ago",
            iconBg: "bg-accent/20",
            iconColor: "text-accent",
          },
        ];
      }

      return liveActivities.slice(0, 8);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const totalRevenue = activities?.reduce((sum, a) => sum + (a.amount || 0), 0) || 0;

  return (
    <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "250ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Zap className="h-5 w-5 text-warning" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Live Activity</h3>
        </div>
        <span className="text-xs text-muted-foreground">Today</span>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">
          Loading activity...
        </div>
      ) : !activities || activities.length === 0 ? (
        <div className="text-center py-8">
          <Zap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No activity yet today</p>
          <p className="text-sm text-muted-foreground/70">
            Tips, subs, and purchases will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[280px] overflow-y-auto">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${350 + index * 50}ms` }}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", activity.iconBg)}>
                <activity.icon className={cn("h-4 w-4", activity.iconColor)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">{activity.creatorName}</p>
              </div>

              <div className="text-right shrink-0">
                {activity.amount && (
                  <p className="text-sm font-semibold text-success">
                    +{formatCurrency(activity.amount)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activities && activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Today's Total</span>
            <span className="text-lg font-bold text-success">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
