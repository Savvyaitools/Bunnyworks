import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, TrendingUp, Percent, MessageSquare, CreditCard, Gift, RefreshCw, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface CreatorEarningsProps {
  creatorId: string;
  creatorCommissionRate: number | null;
}

interface MonthlyEarning {
  id: string;
  amount: number;
  period_start: string;
  period_end: string;
  platform: string | null;
  notes: string | null;
  created_at: string;
}

interface ParsedEarnings {
  tips: number;
  subs: number;
  messages: number;
  allTime: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function parseNotesForBreakdown(notes: string | null): ParsedEarnings {
  if (!notes) return { tips: 0, subs: 0, messages: 0, allTime: 0 };
  
  const tipsMatch = notes.match(/Tips: \$([0-9.]+)/);
  const subsMatch = notes.match(/Subs: \$([0-9.]+)/);
  const messagesMatch = notes.match(/Messages: \$([0-9.]+)/);
  const allTimeMatch = notes.match(/All-time: \$([0-9.]+)/);
  
  return {
    tips: tipsMatch ? parseFloat(tipsMatch[1]) : 0,
    subs: subsMatch ? parseFloat(subsMatch[1]) : 0,
    messages: messagesMatch ? parseFloat(messagesMatch[1]) : 0,
    allTime: allTimeMatch ? parseFloat(allTimeMatch[1]) : 0,
  };
}

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
  const [syncing, setSyncing] = useState(false);
  
  const agencyRate = creatorCommissionRate ?? agency?.commission_rate ?? 0.3;

  // Fetch earnings from creator_earnings table (API synced data)
  const { data: earnings, isLoading, refetch } = useQuery({
    queryKey: ["creator-earnings-api", creatorId],
    queryFn: async (): Promise<MonthlyEarning[]> => {
      const { data, error } = await supabase
        .from("creator_earnings")
        .select("*")
        .eq("creator_id", creatorId)
        .order("period_start", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data || [];
    },
    enabled: !!creatorId,
  });

  // Fetch OnlyFans connection status
  const { data: ofAccount } = useQuery({
    queryKey: ["of-account-status", creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_social_accounts")
        .select("of_account_id, of_last_synced_at, username")
        .eq("creator_id", creatorId)
        .eq("platform", "onlyfans")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!creatorId,
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await supabase.functions.invoke("sync-onlyfans-earnings");
      if (response.error) throw response.error;
      toast.success("Earnings synced successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to sync earnings");
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

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

  const currentMonthEarning = earnings?.[0];
  const parsedBreakdown = parseNotesForBreakdown(currentMonthEarning?.notes || null);
  const currentMonthNet = currentMonthEarning?.amount || 0;
  const allTimeTotal = parsedBreakdown.allTime || currentMonthNet;
  
  const agencyEarnings = currentMonthNet * agencyRate;
  const creatorNet = currentMonthNet - agencyEarnings;
  
  const isEmpty = !currentMonthEarning && (!earnings || earnings.length === 0);

  // Prepare chart data for monthly earnings
  const chartData = (earnings || [])
    .slice(0, 6)
    .reverse()
    .map((e) => ({
      month: format(new Date(e.period_start), "MMM"),
      amount: e.amount,
    }));

  if (isEmpty && !ofAccount?.of_account_id) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <DollarSign className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Earnings Data</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Connect the creator's OnlyFans account via the Social Accounts tab to automatically sync earnings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with sync button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">OnlyFans Earnings</h2>
          {ofAccount?.of_last_synced_at && (
            <p className="text-sm text-muted-foreground">
              Last synced: {format(new Date(ofAccount.of_last_synced_at), "MMM d, yyyy h:mm a")}
            </p>
          )}
        </div>
        <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Summary Cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current Month Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-xs text-muted-foreground">This Month</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(currentMonthNet)}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-xs text-muted-foreground">Subscriptions</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(parsedBreakdown.subs)}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Gift className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-xs text-muted-foreground">Tips</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(parsedBreakdown.tips)}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-orange-400" />
                </div>
                <span className="text-xs text-muted-foreground">Messages</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(parsedBreakdown.messages)}</p>
            </div>
          </div>

          {/* Monthly Earnings Chart */}
          {chartData.length > 0 && (
            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Monthly Earnings</h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Net Earnings"]}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Commission Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Creator Net</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(creatorNet)}</p>
              <p className="text-xs text-muted-foreground mt-1">After {(agencyRate * 100).toFixed(0)}% commission</p>
            </div>

            <div className="p-5 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Percent className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Agency Cut</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(agencyEarnings)}</p>
              <p className="text-xs text-muted-foreground mt-1">{(agencyRate * 100).toFixed(0)}% of this month</p>
            </div>
          </div>
        </div>

        {/* Right Column - All-time Stats */}
        <div className="space-y-4">
          {/* All-time Total */}
          <div className="p-5 rounded-xl border border-border bg-gradient-to-br from-card to-muted/20">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">All-Time Earnings</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(allTimeTotal)}</p>
            <div className="mt-3 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateSparklineData(allTimeTotal)}>
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-5 rounded-xl border border-border bg-card space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Stats</h3>
            
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Platform</span>
              <span className="text-sm font-medium text-foreground">OnlyFans</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Commission Rate</span>
              <span className="text-sm font-medium text-foreground">{(agencyRate * 100).toFixed(0)}%</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Account Status</span>
              <span className="text-sm font-medium text-emerald-400">Connected</span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Months Tracked</span>
              <span className="text-sm font-medium text-foreground">{earnings?.length || 0}</span>
            </div>
          </div>

          {/* Recent Earnings History */}
          {earnings && earnings.length > 1 && (
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent History</h3>
              <div className="space-y-3">
                {earnings.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(e.period_start), "MMM yyyy")}
                    </span>
                    <span className="text-sm font-medium text-foreground">{formatCurrency(e.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
