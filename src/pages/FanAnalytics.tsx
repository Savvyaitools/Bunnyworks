import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { useCreators } from "@/hooks/useCreators";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FanStatsBar } from "@/components/fan-analytics/FanStatsBar";
import { TopFansTable } from "@/components/fan-analytics/TopFansTable";
import { FanSpendDistribution } from "@/components/fan-analytics/FanSpendDistribution";
import { SubscriberGrowthChart } from "@/components/fan-analytics/SubscriberGrowthChart";
import { ChatEngagementPanel } from "@/components/fan-analytics/ChatEngagementPanel";
import { MarketingLinkPerformance } from "@/components/fan-analytics/MarketingLinkPerformance";
import { useState } from "react";
import { startOfMonth } from "date-fns";

export default function FanAnalytics() {
  const { agencyId } = useAgency();
  const { creators } = useCreators();
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("all");

  // Fetch fans
  const { data: fans = [], isLoading: fansLoading } = useQuery({
    queryKey: ["fan-analytics-fans", agencyId, selectedCreatorId],
    queryFn: async () => {
      let query = supabase.from("of_fans").select("*").eq("agency_id", agencyId!);
      if (selectedCreatorId !== "all") {
        query = query.eq("creator_id", selectedCreatorId);
      }
      const { data, error } = await query.order("total_spent", { ascending: false }).limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!agencyId,
  });

  // Fetch chats
  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ["fan-analytics-chats", agencyId, selectedCreatorId],
    queryFn: async () => {
      let query = supabase.from("of_chats").select("*").eq("agency_id", agencyId!);
      if (selectedCreatorId !== "all") {
        query = query.eq("creator_id", selectedCreatorId);
      }
      const { data, error } = await query.order("last_message_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!agencyId,
  });

  // Fetch tracking links
  const { data: trackingLinks = [], isLoading: linksLoading } = useQuery({
    queryKey: ["fan-analytics-links", agencyId, selectedCreatorId],
    queryFn: async () => {
      let query = supabase.from("tracking_links").select("*").eq("agency_id", agencyId!);
      if (selectedCreatorId !== "all") {
        query = query.eq("creator_id", selectedCreatorId);
      }
      const { data, error } = await query.order("revenue", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!agencyId,
  });

  // Compute stats
  const totalFans = fans.length;
  const activeFans = fans.filter((f) => f.is_active).length;
  const totalSpent = fans.reduce((sum, f) => sum + (f.total_spent || 0), 0);
  const avgSpend = totalFans > 0 ? totalSpent / totalFans : 0;
  const monthStart = startOfMonth(new Date()).toISOString();
  const newThisMonth = fans.filter((f) => f.subscribed_at && f.subscribed_at >= monthStart).length;
  const renewingFans = fans.filter((f) => f.is_active && f.renew_on).length;
  const renewalRate = activeFans > 0 ? (renewingFans / activeFans) * 100 : 0;

  const isLoading = fansLoading || chatsLoading || linksLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title="Fan Analytics"
            subtitle="Deep insights into your fan base, engagement & revenue"
          />
          <Select value={selectedCreatorId} onValueChange={setSelectedCreatorId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Creators" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Creators</SelectItem>
              {creators?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FanStatsBar
          totalFans={totalFans}
          activeFans={activeFans}
          avgSpend={avgSpend}
          newThisMonth={newThisMonth}
          renewalRate={renewalRate}
          loading={isLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopFansTable fans={fans.slice(0, 20)} loading={fansLoading} />
          <FanSpendDistribution fans={fans} loading={fansLoading} />
        </div>

        <SubscriberGrowthChart fans={fans} loading={fansLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChatEngagementPanel chats={chats} loading={chatsLoading} />
          <MarketingLinkPerformance links={trackingLinks} loading={linksLoading} />
        </div>
      </div>
    </DashboardLayout>
  );
}
