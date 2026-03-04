import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface FanSpendDistributionProps {
  fans: Array<{ total_spent: number | null }>;
  loading?: boolean;
}

const TIERS = [
  { name: "Whales ($500+)", min: 500, max: Infinity, color: "hsl(330, 100%, 64%)" },
  { name: "High ($100-500)", min: 100, max: 500, color: "hsl(38, 92%, 50%)" },
  { name: "Mid ($25-100)", min: 25, max: 100, color: "hsl(280, 80%, 65%)" },
  { name: "Low (<$25)", min: 0, max: 25, color: "hsl(0, 0%, 50%)" },
];

const chartConfig = {
  whales: { label: "Whales ($500+)", color: "hsl(330, 100%, 64%)" },
  high: { label: "High ($100-500)", color: "hsl(38, 92%, 50%)" },
  mid: { label: "Mid ($25-100)", color: "hsl(280, 80%, 65%)" },
  low: { label: "Low (<$25)", color: "hsl(0, 0%, 50%)" },
};

export function FanSpendDistribution({ fans, loading }: FanSpendDistributionProps) {
  const data = TIERS.map((tier) => ({
    name: tier.name,
    value: fans.filter((f) => {
      const spent = f.total_spent || 0;
      return spent >= tier.min && spent < tier.max;
    }).length,
    color: tier.color,
  })).filter((d) => d.value > 0);

  const total = fans.length;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Spend Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[250px] bg-muted/20 rounded-lg animate-pulse" />
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No fan data available</p>
        ) : (
          <div className="flex items-center gap-6">
            <ChartContainer config={chartConfig} className="h-[250px] w-[250px]">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="space-y-3 flex-1">
              {data.map((tier) => (
                <div key={tier.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                    <span className="text-sm text-foreground">{tier.name}</span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {tier.value} ({total > 0 ? ((tier.value / total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
