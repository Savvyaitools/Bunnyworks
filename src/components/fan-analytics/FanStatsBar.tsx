import { Users, DollarSign, UserPlus, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";

interface FanStatsBarProps {
  totalFans: number;
  activeFans: number;
  avgSpend: number;
  newThisMonth: number;
  renewalRate: number;
  loading?: boolean;
}

export function FanStatsBar({ totalFans, activeFans, avgSpend, newThisMonth, renewalRate, loading }: FanStatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Fans"
        value={totalFans.toLocaleString()}
        subtitle={`${activeFans} active`}
        icon={Users}
        loading={loading}
      />
      <StatCard
        title="Avg Spend / Fan"
        value={`$${avgSpend.toFixed(2)}`}
        icon={DollarSign}
        loading={loading}
      />
      <StatCard
        title="New This Month"
        value={newThisMonth.toLocaleString()}
        icon={UserPlus}
        loading={loading}
      />
      <StatCard
        title="Renewal Rate"
        value={`${renewalRate.toFixed(1)}%`}
        icon={RefreshCw}
        loading={loading}
      />
    </div>
  );
}
