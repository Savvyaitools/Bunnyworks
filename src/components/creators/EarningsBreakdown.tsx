import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Gift, Lock, Users, CreditCard, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EarningsBreakdownProps {
  creatorId: string;
}

interface BreakdownItem {
  type: string;
  total: number;
  count: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  messages: {
    icon: MessageSquare,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    label: "Messages",
  },
  tips: {
    icon: Gift,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    label: "Tips",
  },
  ppv_sales: {
    icon: Lock,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    label: "PPV Sales",
  },
  referrals: {
    icon: Users,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    label: "Referrals",
  },
  subscriptions: {
    icon: CreditCard,
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    label: "Subscriptions",
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function EarningsBreakdown({ creatorId }: EarningsBreakdownProps) {
  const { data: breakdown, isLoading } = useQuery({
    queryKey: ["earnings-breakdown", creatorId],
    queryFn: async () => {
      // Get import IDs for this creator
      const { data: imports, error: importsError } = await supabase
        .from("data_imports")
        .select("id")
        .eq("creator_id", creatorId);

      if (importsError) throw importsError;
      if (!imports?.length) return [];

      const importIds = imports.map((i) => i.id);

      // Get extracted data grouped by type (excluding 'earnings' which is the total)
      const { data, error } = await supabase
        .from("extracted_data")
        .select("data_type, value")
        .in("import_id", importIds)
        .neq("data_type", "earnings");

      if (error) throw error;

      // Group and sum by type
      const grouped: Record<string, { total: number; count: number }> = {};
      data?.forEach((item) => {
        if (!grouped[item.data_type]) {
          grouped[item.data_type] = { total: 0, count: 0 };
        }
        grouped[item.data_type].total += Number(item.value);
        grouped[item.data_type].count += 1;
      });

      // Convert to array with config
      return Object.entries(grouped)
        .map(([type, stats]) => {
          const config = TYPE_CONFIG[type] || {
            icon: TrendingUp,
            color: "text-muted-foreground",
            bgColor: "bg-muted/20",
            label: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          };
          return {
            type,
            total: stats.total,
            count: stats.count,
            ...config,
          };
        })
        .filter((item) => item.total > 0)
        .sort((a, b) => b.total - a.total);
    },
    enabled: !!creatorId,
  });

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg border border-border bg-card animate-pulse">
        <div className="h-6 bg-muted rounded w-40 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!breakdown?.length) {
    return null;
  }

  const grandTotal = breakdown.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">Earnings Breakdown</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {breakdown.map((item) => {
          const Icon = item.icon;
          const percentage = grandTotal > 0 ? (item.total / grandTotal) * 100 : 0;
          
          return (
            <div
              key={item.type}
              className="p-3 rounded-lg border border-border bg-background/50 hover:bg-background/80 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(item.total)}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">{item.count} records</span>
                <span className={`text-xs font-medium ${item.color}`}>{percentage.toFixed(1)}%</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.bgColor.replace('/20', '/60')} rounded-full transition-all`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
