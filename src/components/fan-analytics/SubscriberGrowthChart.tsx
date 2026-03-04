import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, startOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

interface SubscriberGrowthChartProps {
  fans: Array<{ subscribed_at: string | null; expires_at: string | null; renew_on: boolean | null }>;
  loading?: boolean;
}

const chartConfig = {
  newSubs: { label: "New Subscribers", color: "hsl(330, 100%, 64%)" },
  churned: { label: "Churned", color: "hsl(0, 72%, 51%)" },
};

export function SubscriberGrowthChart({ fans, loading }: SubscriberGrowthChartProps) {
  const now = new Date();
  const months = eachMonthOfInterval({ start: subMonths(now, 5), end: now });

  const data = months.map((month) => {
    const monthStart = startOfMonth(month);
    const nextMonth = startOfMonth(new Date(month.getFullYear(), month.getMonth() + 1));
    
    const newSubs = fans.filter((f) => {
      if (!f.subscribed_at) return false;
      const d = new Date(f.subscribed_at);
      return d >= monthStart && d < nextMonth;
    }).length;

    const churned = fans.filter((f) => {
      if (!f.expires_at) return false;
      const d = new Date(f.expires_at);
      return d >= monthStart && d < nextMonth && !f.renew_on;
    }).length;

    return {
      month: format(month, "MMM yyyy"),
      newSubs,
      churned,
    };
  });

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Subscriber Growth</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[250px] bg-muted/20 rounded-lg animate-pulse" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="newSubs"
                stackId="1"
                stroke="hsl(330, 100%, 64%)"
                fill="hsl(330, 100%, 64%)"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="churned"
                stackId="2"
                stroke="hsl(0, 72%, 51%)"
                fill="hsl(0, 72%, 51%)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
