import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Users, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Link } from "react-router-dom";

export interface CreatorEarningsSummary {
  creatorId: string;
  name: string;
  grossRevenue: number;
  netRevenue: number;
  agencyEarnings: number;
  commissionRate?: number;
}

interface CreatorEarningsBreakdownProps {
  creators: CreatorEarningsSummary[];
  commissionRate: number;
  loading?: boolean;
  delay?: number;
}

export function CreatorEarningsBreakdown({ creators, commissionRate, loading, delay = 0 }: CreatorEarningsBreakdownProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const sorted = [...creators].sort((a, b) => b.grossRevenue - a.grossRevenue);
  const maxRevenue = sorted[0]?.grossRevenue || 1;

  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(330, 85%, 60%)",
    "hsl(200, 70%, 55%)",
  ];

  return (
    <motion.div
      ref={ref}
      className="glass-card p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: delay / 1000, type: "spring", stiffness: 100, damping: 15 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-lg font-semibold text-foreground">Earnings by Creator</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Revenue breakdown per creator
      </p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-32 bg-muted/40 rounded mb-2" />
              <div className="h-2 w-full bg-muted/30 rounded" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No creator earnings yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Earnings will appear once synced</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sorted.map((creator, i) => {
            const color = colors[i % colors.length];
            const barWidth = maxRevenue > 0 ? (creator.grossRevenue / maxRevenue) * 100 : 0;

            return (
              <motion.div
                key={creator.creatorId}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: delay / 1000 + 0.2 + i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {creator.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <Link
                        to={`/creators/${creator.creatorId}`}
                        className="text-sm font-medium text-foreground hover:text-accent transition-colors"
                      >
                        {creator.name}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Gross: {formatCurrency(creator.grossRevenue)}</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span>Net: {formatCurrency(creator.netRevenue)}</span>
                        {creator.commissionRate && (
                          <>
                            <span className="text-muted-foreground/40">•</span>
                            <span>{(creator.commissionRate * 100).toFixed(0)}% rate</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-sm font-bold px-2.5 py-1 rounded-full"
                      style={{
                        color,
                        backgroundColor: `${color}15`,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      {formatCurrency(creator.agencyEarnings)}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">agency cut</p>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${barWidth}%` } : {}}
                    transition={{ delay: delay / 1000 + 0.4 + i * 0.15, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
