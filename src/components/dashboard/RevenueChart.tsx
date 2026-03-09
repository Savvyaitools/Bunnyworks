import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { format, subMonths } from "date-fns";

export function RevenueChart() {
  const { agency } = useAgency();
  const agencyId = agency?.id;

  // Fetch earnings data grouped by month
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["revenue-chart", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      // Get creator IDs for this agency
      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("agency_id", agencyId!);
      const creatorIds = creators?.map(c => c.id) || [];

      // Get NET earnings from creator_earnings
      const { data: netData, error: netError } = creatorIds.length > 0
        ? await supabase
            .from("creator_earnings")
            .select("amount, period_start, notes")
            .in("creator_id", creatorIds)
            .order("period_start", { ascending: true })
        : { data: [] as { amount: number; period_start: string; notes: string | null }[], error: null };
      
      if (netError) throw netError;
      
      // Get GROSS from extracted_data (supplementary – fail gracefully)
      type GrossRow = { value: number; period_start: string; raw_text: string | null };
      let grossData: GrossRow[] = [];
      if (creatorIds.length > 0) {
        try {
          const query = supabase
            .from("extracted_data" as any)
            .select("value, period_start, raw_text")
            .eq("data_type", "earnings");
          const res = await query;
          grossData = (res.data as GrossRow[]) || [];
        } catch (e) {
          console.warn("extracted_data query failed, using net-only fallback:", e);
        }
      }
      
      // Group by month
      const monthlyData: Record<string, { net: number; gross: number; agency: number }> = {};
      
      // Initialize last 12 months with zeros
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, "MMM");
        monthlyData[monthKey] = { net: 0, gross: 0, agency: 0 };
      }
      
      // Fill in NET data from creator_earnings
      netData?.forEach((earning) => {
        const monthKey = format(new Date(earning.period_start), "MMM");
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].net += Number(earning.amount);
        }
      });
      
      // Fill in GROSS data from extracted_data
      grossData?.forEach((item) => {
        if (item.raw_text?.toLowerCase().includes("gross") && item.period_start) {
          const monthKey = format(new Date(item.period_start), "MMM");
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].gross += Number(item.value);
          }
        }
      });
      
      // Calculate agency earnings (GROSS - NET, or estimate if no GROSS)
      Object.keys(monthlyData).forEach(month => {
        const data = monthlyData[month];
        if (data.gross > 0) {
          data.agency = data.gross - data.net;
        } else if (data.net > 0) {
          data.gross = data.net / 0.8;
          data.agency = data.gross - data.net;
        }
      });
      
      return Object.entries(monthlyData).map(([month, values]) => ({
        month,
        ...values,
      }));
    },
  });

  const displayData = chartData || [];
  const hasData = displayData.some(d => d.net > 0 || d.agency > 0);

  return (
    <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Revenue Overview</h3>
          <p className="text-sm text-muted-foreground">Agency vs Creator earnings</p>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Creator Net</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Agency</span>
          </div>
        </div>
      </div>
      
      <div className="h-[300px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Loading chart data...
          </div>
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No revenue data yet. Add creator earnings to see the chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAgency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(330, 85%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(330, 85%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(240, 5%, 55%)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(240, 5%, 55%)', fontSize: 12 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(240, 8%, 12%)', 
                  border: '1px solid hsl(240, 6%, 18%)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                }}
                labelStyle={{ color: 'hsl(0, 0%, 95%)' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Area
                type="monotone"
                dataKey="net"
                stroke="hsl(142, 71%, 45%)"
                strokeWidth={2}
                fill="url(#colorNet)"
                name="Creator Net"
              />
              <Area
                type="monotone"
                dataKey="agency"
                stroke="hsl(330, 85%, 60%)"
                strokeWidth={2}
                fill="url(#colorAgency)"
                name="Agency"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
