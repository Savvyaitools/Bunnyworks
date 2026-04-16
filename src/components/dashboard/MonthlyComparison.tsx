import { memo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, CalendarRange, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { formatCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthBucket {
  key: string;        // YYYY-MM
  label: string;      // e.g. "Apr"
  fullLabel: string;  // e.g. "April 2026"
  start: string;      // YYYY-MM-DD inclusive
  end: string;        // YYYY-MM-DD inclusive
  net: number;
}

/**
 * Builds the last N calendar months (inclusive of current) as buckets.
 */
function buildMonthBuckets(monthsBack: number): MonthBucket[] {
  const now = new Date();
  return Array.from({ length: monthsBack }, (_, i) => {
    const d = subMonths(now, monthsBack - 1 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    return {
      key: format(start, "yyyy-MM"),
      label: format(start, "MMM"),
      fullLabel: format(start, "MMMM yyyy"),
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd"),
      net: 0,
    };
  });
}

export const MonthlyComparison = memo(function MonthlyComparison() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const { agency } = useAgency();
  const agencyId = agency?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-monthly-comparison", agencyId],
    enabled: Boolean(agencyId),
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const buckets = buildMonthBuckets(4); // current + 3 prior

      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("agency_id", agencyId!);
      const creatorIds = (creators || []).map((c) => c.id);
      if (creatorIds.length === 0) return { buckets };

      const earliest = buckets[0].start;
      const { data: rows, error } = await supabase
        .from("creator_earnings")
        .select("creator_id, amount, period_start")
        .in("creator_id", creatorIds)
        .gte("period_start", earliest);
      if (error) throw error;

      (rows || []).forEach((r) => {
        const monthKey = (r.period_start as string).slice(0, 7);
        const bucket = buckets.find((b) => b.key === monthKey);
        if (bucket) bucket.net += Number(r.amount) || 0;
      });
      return { buckets };
    },
  });

  const buckets = data?.buckets ?? buildMonthBuckets(4);
  const current = buckets[buckets.length - 1];
  const previous = buckets[buckets.length - 2];
  const change =
    previous && previous.net > 0
      ? ((current.net - previous.net) / previous.net) * 100
      : 0;
  const positive = change >= 0;
  const total3mo = buckets.slice(0, 3).reduce((s, b) => s + b.net, 0);
  const avg3mo = total3mo / 3;

  return (
    <motion.div
      ref={ref}
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
    >
      <div className="section-header">
        <div>
          <h3 className="section-title">Monthly Performance</h3>
          <p className="section-subtitle">
            Calendar months — current vs previous and 3-month trend
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
          <CalendarRange className="h-3 w-3" />
          <span>Net earnings</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[180px] w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Top metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <MetricTile
              label={current?.fullLabel || "This Month"}
              value={formatCurrency(current?.net || 0)}
              caption="Current calendar month"
              accent="primary"
            />
            <MetricTile
              label={previous?.fullLabel || "Last Month"}
              value={formatCurrency(previous?.net || 0)}
              caption={
                previous && previous.net > 0 ? (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                      positive ? "text-success" : "text-destructive"
                    }`}
                  >
                    {positive ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(change).toFixed(1)}% vs previous
                  </span>
                ) : (
                  "Previous calendar month"
                )
              }
              accent="accent"
            />
            <MetricTile
              label="3-Month Average"
              value={formatCurrency(avg3mo)}
              caption={`Total ${formatCurrency(total3mo)} over prior 3 months`}
              accent="success"
              icon={TrendingUp}
            />
          </div>

          {/* Chart */}
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(v: number) => [formatCurrency(v), "Net"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullLabel ?? ""
                  }
                />
                <Bar
                  dataKey="net"
                  radius={[6, 6, 0, 0]}
                  fill="hsl(var(--primary))"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </motion.div>
  );
});

interface MetricTileProps {
  label: string;
  value: string;
  caption: React.ReactNode;
  accent: "primary" | "accent" | "success";
  icon?: typeof TrendingUp;
}

const accentMap = {
  primary: "border-primary/20 bg-primary/5",
  accent: "border-accent/20 bg-accent/5",
  success: "border-success/20 bg-success/5",
};

function MetricTile({ label, value, caption, accent, icon: Icon }: MetricTileProps) {
  return (
    <div className={`p-4 rounded-xl border ${accentMap[accent]}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />}
      </div>
      <p className="text-xl font-bold text-foreground tracking-tight">{value}</p>
      <div className="text-xs text-muted-foreground mt-1">{caption}</div>
    </div>
  );
}
