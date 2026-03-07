import { DollarSign, MessageSquare, UserPlus, Heart, Zap, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency } from "@/lib/formatters";
import { useEffect, useState } from "react";

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
  const [realtimeActivities, setRealtimeActivities] = useState<LiveActivity[]>([]);
  const { agency } = useAgency();
  const agencyId = agency?.id;

  const { data: activities, isLoading } = useQuery({
    queryKey: ["live-activity-feed", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      const liveActivities: LiveActivity[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch OnlyFans webhook events first
      const { data: ofEvents } = await supabase
        .from("onlyfans_events")
        .select("id, event_type, payload, created_at, creator_id")
        .eq("agency_id", agencyId!)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      // Get creator names for OF events
      const eventCreatorIds = [...new Set(ofEvents?.map(e => e.creator_id).filter(Boolean) || [])];
      const { data: eventCreators } = await supabase
        .from("creators")
        .select("id, name, alias")
        .in("id", eventCreatorIds.length > 0 ? eventCreatorIds : [agencyId!]);
      
      const eventCreatorMap = new Map(eventCreators?.map(c => [c.id, c.alias || c.name]) || []);

      // Convert OF events to activities
      ofEvents?.forEach((event) => {
        let type: LiveActivity["type"] = "tip";
        let icon = DollarSign;
        let title = event.event_type;
        let iconBg = "bg-success/20";
        let iconColor = "text-success";
        let amount: number | undefined;

        switch (event.event_type) {
          case "tip_received":
            type = "tip";
            icon = Heart;
            title = "Tip received";
            iconBg = "bg-pink-500/20";
            iconColor = "text-pink-500";
            amount = (event.payload as { amount?: number })?.amount;
            break;
          case "new_subscription":
            type = "subscription";
            icon = UserPlus;
            title = "New subscription";
            iconBg = "bg-accent/20";
            iconColor = "text-accent";
            amount = (event.payload as { price?: number })?.price;
            break;
          case "purchase":
            type = "ppv";
            icon = Gift;
            title = "PPV purchased";
            iconBg = "bg-primary/20";
            iconColor = "text-primary";
            amount = (event.payload as { amount?: number })?.amount;
            break;
          case "subscription_expired":
            type = "renewal";
            icon = MessageSquare;
            title = "Sub expired";
            iconBg = "bg-muted";
            iconColor = "text-muted-foreground";
            break;
          case "new_message":
            type = "message";
            icon = MessageSquare;
            title = "New message";
            iconBg = "bg-primary/20";
            iconColor = "text-primary";
            break;
          default:
            return; // Skip unknown event types
        }

        liveActivities.push({
          id: event.id,
          type,
          icon,
          title,
          amount,
          creatorName: event.creator_id ? eventCreatorMap.get(event.creator_id) || "Unknown" : "Unknown",
          time: formatDistanceToNow(new Date(event.created_at), { addSuffix: true }),
          iconBg,
          iconColor,
        });
      });

      // Also fetch recent earnings as fallback - scoped to agency creators
      const { data: agencyCreators } = await supabase
        .from("creators")
        .select("id")
        .eq("agency_id", agencyId!);
      const agencyCreatorIds = agencyCreators?.map(c => c.id) || [];

      const { data: earnings } = agencyCreatorIds.length > 0
        ? await supabase
            .from("creator_earnings")
            .select("id, amount, created_at, creator_id, notes, platform")
            .in("creator_id", agencyCreatorIds)
            .gte("created_at", today.toISOString())
            .order("created_at", { ascending: false })
            .limit(5)
        : { data: [] as any[] };

      // Get creator names
      const creatorIds = [...new Set(earnings?.map(e => e.creator_id) || [])];
      const { data: creators } = await supabase
        .from("creators")
        .select("id, name, alias")
        .in("id", creatorIds.length > 0 ? creatorIds : [agencyId!]);

      const creatorMap = new Map(creators?.map(c => [c.id, c.alias || c.name]) || []);

      earnings?.forEach((earning) => {
        // Skip if we already have this from OF events
        if (liveActivities.some(a => a.amount === Number(earning.amount))) return;

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

      // Return empty array if no real data
      if (liveActivities.length === 0) {
        return [];
      }

      return liveActivities.slice(0, 8);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Subscribe to realtime OnlyFans events
  useEffect(() => {
    const channel = supabase
      .channel("live-activity-events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "onlyfans_events",
        },
        (payload) => {
          const event = payload.new as {
            id: string;
            event_type: string;
            payload: Record<string, unknown>;
            created_at: string;
          };

          let type: LiveActivity["type"] = "tip";
          let icon = DollarSign;
          let title = event.event_type;
          let iconBg = "bg-success/20";
          let iconColor = "text-success";
          let amount: number | undefined;

          switch (event.event_type) {
            case "tip_received":
              type = "tip";
              icon = Heart;
              title = "Tip received";
              iconBg = "bg-pink-500/20";
              iconColor = "text-pink-500";
              amount = (event.payload as { amount?: number })?.amount;
              break;
            case "new_subscription":
              type = "subscription";
              icon = UserPlus;
              title = "New subscription";
              iconBg = "bg-accent/20";
              iconColor = "text-accent";
              break;
            case "purchase":
              type = "ppv";
              icon = Gift;
              title = "PPV purchased";
              iconBg = "bg-primary/20";
              iconColor = "text-primary";
              amount = (event.payload as { amount?: number })?.amount;
              break;
            default:
              return;
          }

          const newActivity: LiveActivity = {
            id: event.id,
            type,
            icon,
            title,
            amount,
            creatorName: "Creator",
            time: "just now",
            iconBg,
            iconColor,
          };

          setRealtimeActivities((prev) => [newActivity, ...prev].slice(0, 3));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Merge realtime and fetched activities
  const allActivities = [...realtimeActivities, ...(activities || [])];
  const uniqueActivities = Array.from(
    new Map(allActivities.map((a) => [a.id, a])).values()
  ).slice(0, 8);

  const totalRevenue = uniqueActivities?.reduce((sum, a) => sum + (a.amount || 0), 0) || 0;

  return (
    <motion.div 
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, type: "spring" as const, stiffness: 100, damping: 15 }}
    >
      <div className="section-header">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Zap className="h-4 w-4 text-warning" />
            <motion.span 
              className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-success rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <div>
            <h3 className="section-title">Live Activity</h3>
            <p className="section-subtitle">Real-time events today</p>
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground/60">Auto-refreshing</span>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">
          Loading activity...
        </div>
      ) : !uniqueActivities || uniqueActivities.length === 0 ? (
        <motion.div 
          className="text-center py-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Zap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No activity yet today</p>
          <p className="text-sm text-muted-foreground/70">
            Tips, subs, and purchases will appear here
          </p>
        </motion.div>
      ) : (
        <div className="space-y-1 max-h-[280px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {uniqueActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                layout
                whileHover={{ scale: 1.02, x: 3 }}
              >
                <motion.div 
                  className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", activity.iconBg)}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <activity.icon className={cn("h-4 w-4", activity.iconColor)} />
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.creatorName}</p>
                </div>

                <div className="text-right shrink-0">
                  {activity.amount && (
                    <motion.p 
                      className="text-sm font-semibold text-success"
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                    >
                      +{formatCurrency(activity.amount)}
                    </motion.p>
                  )}
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {uniqueActivities && uniqueActivities.length > 0 && (
        <motion.div 
          className="mt-4 pt-4 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Today's Total</span>
            <motion.span 
              className="text-lg font-bold text-success"
              key={totalRevenue}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
            >
              {formatCurrency(totalRevenue)}
            </motion.span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
