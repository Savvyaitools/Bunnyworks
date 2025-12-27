import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export function RevenueChart() {
  // Fetch earnings data grouped by month
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["revenue-chart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_earnings")
        .select("amount, period_start, period_end")
        .order("period_start", { ascending: true });
      
      if (error) throw error;
      
      // Group by month
      const monthlyData: Record<string, { agency: number; creator: number }> = {};
      
      // Initialize last 12 months with zeros
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, "MMM");
        monthlyData[monthKey] = { agency: 0, creator: 0 };
      }
      
      // Fill in actual data
      data?.forEach((earning) => {
        const monthKey = format(new Date(earning.period_start), "MMM");
        if (monthlyData[monthKey]) {
          const amount = Number(earning.amount);
          monthlyData[monthKey].creator += amount;
          monthlyData[monthKey].agency += amount * 0.3; // 30% agency cut
        }
      });
      
      return Object.entries(monthlyData).map(([month, values]) => ({
        month,
        ...values,
      }));
    },
  });

  const displayData = chartData || [];
  const hasData = displayData.some(d => d.agency > 0 || d.creator > 0);

  return (
    <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Revenue Overview</h3>
          <p className="text-sm text-muted-foreground">Agency vs Creator earnings</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Agency</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">Creator</span>
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
                <linearGradient id="colorAgency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(330, 85%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(330, 85%, 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCreator" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(180, 70%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(180, 70%, 50%)" stopOpacity={0} />
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
                dataKey="creator"
                stroke="hsl(180, 70%, 50%)"
                strokeWidth={2}
                fill="url(#colorCreator)"
              />
              <Area
                type="monotone"
                dataKey="agency"
                stroke="hsl(330, 85%, 60%)"
                strokeWidth={2}
                fill="url(#colorAgency)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
