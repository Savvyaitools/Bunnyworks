import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MiniSparklineCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  data: { value: number }[];
  color: string;
  delay?: number;
}

export function MiniSparklineCard({
  title,
  value,
  change,
  changeType,
  data,
  color,
  delay = 0,
}: MiniSparklineCardProps) {
  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            changeType === "positive" ? "text-success" : "text-destructive"
          )}
        >
          {changeType === "positive" ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {change}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground mb-3">{value}</p>
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${title.replace(/\s/g, "")})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
