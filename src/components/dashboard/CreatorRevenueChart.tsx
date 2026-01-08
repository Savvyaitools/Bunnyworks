import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function CreatorRevenueChart() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["creator-revenue-chart"],
    queryFn: async () => {
      // Fetch creators with their earnings
      const { data: creators, error: creatorsError } = await supabase
        .from("creators")
        .select("id, name, alias")
        .eq("status", "Active")
        .limit(8);

      if (creatorsError) throw creatorsError;

      if (!creators || creators.length === 0) {
        return [];
      }

      // Fetch earnings for each creator
      const { data: earnings, error: earningsError } = await supabase
        .from("creator_earnings")
        .select("creator_id, amount");

      if (earningsError) throw earningsError;

      // Aggregate earnings by creator
      const earningsByCreator: Record<string, number> = {};
      earnings?.forEach((e) => {
        earningsByCreator[e.creator_id] = (earningsByCreator[e.creator_id] || 0) + Number(e.amount);
      });

      return creators.map((creator) => ({
        name: creator.alias || creator.name.split(" ")[0],
        net: earningsByCreator[creator.id] || 0,
        gross: (earningsByCreator[creator.id] || 0) * 1.25, // Estimate gross
      }));
    },
  });

  const hasData = chartData && chartData.length > 0 && chartData.some((d) => d.net > 0);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="flex-1" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Creator Revenue</h3>
          <p className="text-sm text-muted-foreground">Net vs Gross by creator</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Net</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-muted-foreground">Gross</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No creator revenue data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
              />
              <Bar
                dataKey="net"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                name="Net"
              />
              <Bar
                dataKey="gross"
                fill="hsl(var(--accent))"
                radius={[4, 4, 0, 0]}
                name="Gross"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
