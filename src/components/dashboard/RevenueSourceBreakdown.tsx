import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { DollarSign, CreditCard, MessageSquare, Gift, Share2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface RevenueSource {
  label: string;
  value: number;
  percentage: number;
  icon: React.ElementType;
  color: string;
}

interface RevenueSourceBreakdownProps {
  grossRevenue: number;
  delay?: number;
}

export function RevenueSourceBreakdown({ grossRevenue, delay = 0 }: RevenueSourceBreakdownProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const sources: RevenueSource[] = [
    { 
      label: "Subscriptions", 
      value: grossRevenue * 0.55, 
      percentage: 55, 
      icon: CreditCard,
      color: "hsl(var(--primary))" 
    },
    { 
      label: "Tips", 
      value: grossRevenue * 0.25, 
      percentage: 25, 
      icon: Gift,
      color: "hsl(var(--accent))" 
    },
    { 
      label: "Messages", 
      value: grossRevenue * 0.15, 
      percentage: 15, 
      icon: MessageSquare,
      color: "hsl(var(--success))" 
    },
    { 
      label: "Referrals", 
      value: grossRevenue * 0.05, 
      percentage: 5, 
      icon: Share2,
      color: "hsl(var(--warning))" 
    },
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
        <h3 className="text-lg font-semibold text-foreground">Revenue</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-6">Overview</p>

      <div className="space-y-5">
        {sources.map((source, i) => {
          const IconComp = source.icon;
          return (
            <motion.div
              key={source.label}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: delay / 1000 + 0.2 + i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${source.color}20` }}
                  >
                    <IconComp className="h-4 w-4" style={{ color: source.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{source.label}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(source.value)}</p>
                  </div>
                </div>
                <span 
                  className="text-sm font-bold px-2.5 py-1 rounded-full"
                  style={{ 
                    color: source.color, 
                    backgroundColor: `${source.color}15`,
                    border: `1px solid ${source.color}30`
                  }}
                >
                  {source.percentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: source.color }}
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${source.percentage}%` } : {}}
                  transition={{ delay: delay / 1000 + 0.4 + i * 0.15, duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
