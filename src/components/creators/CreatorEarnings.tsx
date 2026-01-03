import { useQuery } from "@tanstack/react-query";
import { 
  DollarSign, 
  Users, 
  MessageSquare, 
  Gift, 
  Lock, 
  UserPlus,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CreatorEarningsProps {
  creatorId: string;
}

interface EarningsData {
  gross_earnings: number;
  net_earnings: number;
  subscribers: number;
  messages: number;
  tips: number;
  ppv_sales: number;
  referrals: number;
  subscriptions: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

export function CreatorEarnings({ creatorId }: CreatorEarningsProps) {
  const { data: earningsData, isLoading } = useQuery({
    queryKey: ["creator-earnings-dashboard", creatorId],
    queryFn: async (): Promise<EarningsData> => {
      // Get import IDs for this creator
      const { data: imports, error: importsError } = await supabase
        .from("data_imports")
        .select("id")
        .eq("creator_id", creatorId)
        .eq("status", "approved");

      if (importsError) throw importsError;
      
      const importIds = imports?.map((i) => i.id) || [];
      
      if (importIds.length === 0) {
        return {
          gross_earnings: 0,
          net_earnings: 0,
          subscribers: 0,
          messages: 0,
          tips: 0,
          ppv_sales: 0,
          referrals: 0,
          subscriptions: 0,
        };
      }

      // Get all extracted data
      const { data: extractedData, error } = await supabase
        .from("extracted_data")
        .select("data_type, value, raw_text")
        .in("import_id", importIds);

      if (error) throw error;

      // Aggregate by type
      const aggregated: EarningsData = {
        gross_earnings: 0,
        net_earnings: 0,
        subscribers: 0,
        messages: 0,
        tips: 0,
        ppv_sales: 0,
        referrals: 0,
        subscriptions: 0,
      };

      extractedData?.forEach((item) => {
        const value = Number(item.value) || 0;
        const rawText = item.raw_text?.toLowerCase() || "";
        
        switch (item.data_type) {
          case "earnings":
            if (rawText.includes("net")) {
              aggregated.net_earnings += value;
            } else if (rawText.includes("gross")) {
              aggregated.gross_earnings += value;
            } else {
              // If no distinction, treat as net
              aggregated.net_earnings += value;
            }
            break;
          case "subscribers":
            aggregated.subscribers += value;
            break;
          case "messages":
            aggregated.messages += value;
            break;
          case "tips":
            aggregated.tips += value;
            break;
          case "ppv_sales":
            aggregated.ppv_sales += value;
            break;
          case "referrals":
            aggregated.referrals += value;
            break;
          case "subscriptions":
            aggregated.subscriptions += value;
            break;
        }
      });

      // If we have net but no gross, estimate gross (OF takes ~20%)
      if (aggregated.net_earnings > 0 && aggregated.gross_earnings === 0) {
        aggregated.gross_earnings = aggregated.net_earnings / 0.8;
      }

      return aggregated;
    },
    enabled: !!creatorId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const data = earningsData || {
    gross_earnings: 0,
    net_earnings: 0,
    subscribers: 0,
    messages: 0,
    tips: 0,
    ppv_sales: 0,
    referrals: 0,
    subscriptions: 0,
  };

  const platformFee = data.gross_earnings - data.net_earnings;
  const totalRevenue = data.messages + data.tips + data.ppv_sales + data.referrals + data.subscriptions;

  const isEmpty = data.net_earnings === 0 && data.subscribers === 0 && totalRevenue === 0;

  if (isEmpty) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <DollarSign className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Earnings Data</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Upload OnlyFans dashboard screenshots from the Data Import Hub to see earnings breakdown here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Earnings Cards - OnlyFans Style */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Gross Earnings */}
        <div className="p-6 rounded-xl border border-border bg-gradient-to-br from-card to-card/80">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Gross Earnings
            </span>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(data.gross_earnings)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Before platform fees</p>
        </div>

        {/* Net Earnings */}
        <div className="p-6 rounded-xl border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-primary uppercase tracking-wider">
              Net Earnings
            </span>
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(data.net_earnings)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Platform fee: {formatCurrency(platformFee)}
          </p>
        </div>
      </div>

      {/* Stats Row - Subscribers */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Active Subscribers</p>
            <p className="text-2xl font-bold text-foreground">{formatNumber(data.subscribers)}</p>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown Grid */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Revenue Breakdown
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Subscriptions */}
          <RevenueCard
            icon={Users}
            label="Subscriptions"
            value={data.subscriptions}
            color="pink"
            total={totalRevenue}
          />
          
          {/* Messages */}
          <RevenueCard
            icon={MessageSquare}
            label="Messages"
            value={data.messages}
            color="blue"
            total={totalRevenue}
          />
          
          {/* Tips */}
          <RevenueCard
            icon={Gift}
            label="Tips"
            value={data.tips}
            color="amber"
            total={totalRevenue}
          />
          
          {/* PPV Sales */}
          <RevenueCard
            icon={Lock}
            label="PPV Sales"
            value={data.ppv_sales}
            color="purple"
            total={totalRevenue}
          />
        </div>
      </div>

      {/* Referrals */}
      {data.referrals > 0 && (
        <div className="p-4 rounded-xl border border-border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Referral Earnings</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(data.referrals)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface RevenueCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "pink" | "blue" | "amber" | "purple" | "green";
  total: number;
}

const colorClasses = {
  pink: {
    bg: "bg-pink-500/20",
    text: "text-pink-400",
    bar: "bg-pink-500/60",
  },
  blue: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    bar: "bg-blue-500/60",
  },
  amber: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    bar: "bg-amber-500/60",
  },
  purple: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    bar: "bg-purple-500/60",
  },
  green: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    bar: "bg-green-500/60",
  },
};

function RevenueCard({ icon: Icon, label, value, color, total }: RevenueCardProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colors = colorClasses[color];

  return (
    <div className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${colors.text}`} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground">{formatCurrency(value)}</p>
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={colors.text}>{percentage.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
