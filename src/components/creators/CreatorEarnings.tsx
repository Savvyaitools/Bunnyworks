import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, TrendingUp, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface CreatorEarningsProps {
  creatorId: string;
  creatorCommissionRate: number | null;
}

interface EarningsData {
  total: number;
  subscriptions: number;
  tips: number;
  messages: number;
  referrals: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Generate simple sparkline data for visual effect
function generateSparklineData(value: number) {
  const points = 12;
  const data = [];
  const baseValue = value / points;
  for (let i = 0; i < points; i++) {
    const variance = baseValue * (0.5 + Math.random());
    data.push({ value: Math.max(0, variance) });
  }
  return data;
}

export function CreatorEarnings({ creatorId, creatorCommissionRate }: CreatorEarningsProps) {
  const { agency } = useAgency();
  
  // Use creator's custom rate or fall back to agency default
  const agencyRate = creatorCommissionRate ?? agency?.commission_rate ?? 0.3;

  const { data: earningsData, isLoading } = useQuery({
    queryKey: ["creator-earnings-dashboard", creatorId],
    queryFn: async (): Promise<EarningsData> => {
      const { data: imports, error: importsError } = await supabase
        .from("data_imports")
        .select("id")
        .eq("creator_id", creatorId)
        .eq("status", "approved");

      if (importsError) throw importsError;

      const importIds = imports?.map((i) => i.id) || [];

      if (importIds.length === 0) {
        return { total: 0, subscriptions: 0, tips: 0, messages: 0, referrals: 0 };
      }

      const { data: extractedData, error } = await supabase
        .from("extracted_data")
        .select("data_type, value")
        .in("import_id", importIds);

      if (error) throw error;

      const aggregated: EarningsData = {
        total: 0,
        subscriptions: 0,
        tips: 0,
        messages: 0,
        referrals: 0,
      };

      extractedData?.forEach((item) => {
        const value = Number(item.value) || 0;
        switch (item.data_type) {
          case "earnings":
            aggregated.total += value;
            break;
          case "subscriptions":
            aggregated.subscriptions += value;
            break;
          case "tips":
            aggregated.tips += value;
            break;
          case "messages":
            aggregated.messages += value;
            break;
          case "referrals":
            aggregated.referrals += value;
            break;
        }
      });

      return aggregated;
    },
    enabled: !!creatorId,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const data = earningsData || { total: 0, subscriptions: 0, tips: 0, messages: 0, referrals: 0 };
  const agencyEarnings = data.total * agencyRate;
  const creatorNet = data.total - agencyEarnings;
  const isEmpty = data.total === 0;

  if (isEmpty) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <DollarSign className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Earnings Data</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Upload OnlyFans dashboard screenshots from the Data Import Hub to see earnings here.
        </p>
      </div>
    );
  }

  const earningsRows = [
    { label: "Total", value: data.total, color: "#10b981", sparkData: generateSparklineData(data.total) },
    { label: "Subscriptions", value: data.subscriptions, color: "#22c55e", sparkData: generateSparklineData(data.subscriptions) },
    { label: "Tips", value: data.tips, color: "#8b5cf6", sparkData: generateSparklineData(data.tips) },
    { label: "Messages", value: data.messages, color: "#f97316", sparkData: generateSparklineData(data.messages) },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content Area - can be expanded later */}
      <div className="flex-1 space-y-4">
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Earnings Overview
          </h3>
          <p className="text-muted-foreground text-sm">
            Data extracted from imported OnlyFans dashboard screenshots. Upload more screenshots to keep this updated.
          </p>
        </div>

        {/* Agency Rate Info */}
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Percent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Agency Commission Rate</p>
              <p className="text-xl font-bold text-foreground">{(agencyRate * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>

        {/* Creator Net */}
        <div className="p-5 rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Creator Net Earnings</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(creatorNet)}</p>
          <p className="text-xs text-muted-foreground mt-1">After agency commission</p>
        </div>

        {/* Agency Earnings */}
        <div className="p-5 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Agency Earnings</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(agencyEarnings)}</p>
          <p className="text-xs text-muted-foreground mt-1">{(agencyRate * 100).toFixed(0)}% commission</p>
        </div>
      </div>

      {/* Right Sidebar - OnlyFans Style Earnings Panel */}
      <div className="lg:w-80 p-5 rounded-xl border border-border bg-card">
        <h3 className="text-base font-semibold text-foreground mb-4">Earnings</h3>
        <div className="space-y-4">
          {earningsRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{row.label}</p>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(row.value)}</p>
              </div>
              <div className="w-20 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={row.sparkData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={row.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        {/* Referrals if exists */}
        {data.referrals > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Referrals</p>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(data.referrals)}</p>
              </div>
              <div className="w-20 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateSparklineData(data.referrals)}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}