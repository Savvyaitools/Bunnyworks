import { useQuery } from "@tanstack/react-query";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Percent, 
  MessageSquare, 
  CreditCard, 
  Gift, 
  RefreshCw, 
  Calendar, 
  Info,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CreatorEarningsProps {
  creatorId: string;
  creatorCommissionRate: number | null;
}

interface MonthlyEarning {
  id: string;
  amount: number;
  tips: number;
  subscriptions: number;
  messages_revenue: number;
  referrals: number;
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

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))"];

export function CreatorEarnings({ creatorId, creatorCommissionRate }: CreatorEarningsProps) {
  const { agency } = useAgency();
  const [syncing, setSyncing] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  
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
    toast.info("Earnings are now synced automatically via browser sessions.");
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

  // OnlyFans earnings statements are rolling 30-day windows, not calendar months.
  // Use the most recent scraped row as "Last 30 Days" and the next as "Previous 30 Days".
  const currentMonthEarning = earnings?.[0];
  const lastMonthEarning = earnings?.[1];
  const parsedBreakdown = parseNotesForBreakdown(currentMonthEarning?.notes || null);
  const lastMonthBreakdown = parseNotesForBreakdown(lastMonthEarning?.notes || null);
  const currentMonthNet = currentMonthEarning?.amount || 0;
  const lastMonthNet = lastMonthEarning?.amount || 0;
  const allTimeTotal = parsedBreakdown.allTime || currentMonthNet;
  
  // Use column data if available, fall back to notes parsing
  const currentTips = Number(currentMonthEarning?.tips) || parsedBreakdown.tips;
  const currentSubs = Number(currentMonthEarning?.subscriptions) || parsedBreakdown.subs;
  const currentMessages = Number(currentMonthEarning?.messages_revenue) || parsedBreakdown.messages;

  const agencyEarnings = currentMonthNet * agencyRate;
  const creatorNet = currentMonthNet - agencyEarnings;

  // Calculate month-over-month change
  const monthChange = lastMonthNet > 0 ? ((currentMonthNet - lastMonthNet) / lastMonthNet) * 100 : 0;
  const isPositiveChange = monthChange >= 0;
  
  const isEmpty = !currentMonthEarning && (!earnings || earnings.length === 0);

  // Prepare chart data for monthly earnings
  const chartData = (earnings || [])
    .slice(0, 6)
    .reverse()
    .map((e) => ({
      month: format(new Date(e.period_start), "MMM"),
      amount: e.amount,
    }));

  // Prepare pie chart data for earnings breakdown
  const breakdownData = [
    { name: "Subscriptions", value: currentSubs, color: PIE_COLORS[0] },
    { name: "Tips", value: currentTips, color: PIE_COLORS[1] },
    { name: "Messages", value: currentMessages, color: PIE_COLORS[2] },
  ].filter(d => d.value > 0);

  const totalBreakdown = currentSubs + currentTips + currentMessages;

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

  const StatTooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">OnlyFans Earnings</h2>
        {ofAccount?.of_last_synced_at && (
          <p className="text-sm text-muted-foreground">
            Last synced: {format(new Date(ofAccount.of_last_synced_at), "MMM d, yyyy h:mm a")}
          </p>
        )}
      </div>

      {/* How Earnings Work - Explainer */}
      <Collapsible open={showExplainer} onOpenChange={setShowExplainer}>
        <Card className="border-primary/20 bg-primary/5">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-primary/10 transition-colors py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">How Earnings Work</CardTitle>
                </div>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium text-foreground mb-1">💰 Net Earnings</p>
                  <p className="text-muted-foreground">Total after OnlyFans takes their 20% platform fee</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium text-foreground mb-1">💳 Subscriptions</p>
                  <p className="text-muted-foreground">Monthly/yearly recurring subscriber revenue</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium text-foreground mb-1">🎁 Tips</p>
                  <p className="text-muted-foreground">One-time tips from fans on posts or DMs</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium text-foreground mb-1">✉️ Messages</p>
                  <p className="text-muted-foreground">PPV message purchases and DM tips</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium text-foreground mb-1">🏢 Agency Cut</p>
                  <p className="text-muted-foreground">Your agreed commission rate ({(agencyRate * 100).toFixed(0)}%)</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium text-foreground mb-1">👤 Creator Net</p>
                  <p className="text-muted-foreground">What the creator receives after your commission</p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Summary Cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current Month Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTooltip content="Total net earnings over the last 30 days after OnlyFans platform fee (20%)">
              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors cursor-help">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">Last 30 Days</span>
                </div>
                <p className="text-xl font-bold text-foreground">{formatCurrency(currentMonthNet)}</p>
                {lastMonthNet > 0 && (
                  <div className={`flex items-center gap-1 text-xs mt-1 ${isPositiveChange ? 'text-success' : 'text-destructive'}`}>
                    {isPositiveChange ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(monthChange).toFixed(1)}% vs prior 30 days
                  </div>
                )}
              </div>
            </StatTooltip>

            <StatTooltip content="Revenue from monthly and yearly subscription renewals">
              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors cursor-help">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">Subscriptions</span>
                </div>
                <p className="text-xl font-bold text-foreground">{formatCurrency(currentSubs)}</p>
                {totalBreakdown > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {((currentSubs / totalBreakdown) * 100).toFixed(0)}% of total
                  </p>
                )}
              </div>
            </StatTooltip>

            <StatTooltip content="One-time tips from fans on posts, profile, or in DMs">
              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors cursor-help">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Gift className="h-4 w-4 text-purple-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">Tips</span>
                </div>
                <p className="text-xl font-bold text-foreground">{formatCurrency(currentTips)}</p>
                {totalBreakdown > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {((currentTips / totalBreakdown) * 100).toFixed(0)}% of total
                  </p>
                )}
              </div>
            </StatTooltip>

            <StatTooltip content="PPV (pay-per-view) message purchases and message tips">
              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors cursor-help">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-orange-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">Messages</span>
                </div>
                <p className="text-xl font-bold text-foreground">{formatCurrency(currentMessages)}</p>
                {totalBreakdown > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {((currentMessages / totalBreakdown) * 100).toFixed(0)}% of total
                  </p>
                )}
              </div>
            </StatTooltip>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly Earnings Bar Chart */}
            {chartData.length > 0 && (
              <div className="p-5 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Monthly Trend</h3>
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

            {/* Earnings Breakdown Pie Chart */}
            {breakdownData.length > 0 && (
              <div className="p-5 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <h3 className="text-base font-semibold text-foreground">Earnings Breakdown</h3>
                </div>
                <div className="h-48 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdownData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {breakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 ml-2">
                    {breakdownData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Commission Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <StatTooltip content="Amount the creator receives after your agency commission is deducted">
              <div className="p-5 rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 cursor-help">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Creator Net</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(creatorNet)}</p>
                <p className="text-xs text-muted-foreground mt-1">After {(agencyRate * 100).toFixed(0)}% commission</p>
              </div>
            </StatTooltip>

            <StatTooltip content="Your agency's share based on the agreed commission rate">
              <div className="p-5 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 cursor-help">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Percent className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Agency Cut</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(agencyEarnings)}</p>
                <p className="text-xs text-muted-foreground mt-1">{(agencyRate * 100).toFixed(0)}% of this month</p>
              </div>
            </StatTooltip>
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
                {earnings.slice(0, 5).map((e, index) => {
                  const prevEarning = earnings[index + 1];
                  const change = prevEarning ? ((e.amount - prevEarning.amount) / prevEarning.amount) * 100 : 0;
                  return (
                    <div key={e.id} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(e.period_start), "MMM yyyy")}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-foreground">{formatCurrency(e.amount)}</span>
                        {prevEarning && (
                          <span className={`text-xs ml-2 ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {change >= 0 ? '+' : ''}{change.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
