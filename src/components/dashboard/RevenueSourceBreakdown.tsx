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
  tips?: number;
  subscriptions?: number;
  messagesRevenue?: number;
  referrals?: number;
  delay?: number;
}

export function RevenueSourceBreakdown({ grossRevenue, tips = 0, subscriptions = 0, messagesRevenue = 0, referrals = 0, delay = 0 }: RevenueSourceBreakdownProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const total = tips + subscriptions + messagesRevenue + referrals;
  const hasBreakdown = total > 0;
  
  // Use real data if available, otherwise estimate from grossRevenue
  const getPercentage = (value: number) => {
    if (hasBreakdown && total > 0) return Math.round((value / total) * 100);
    return 0;
  };

  const sources: RevenueSource[] = [
    { 
      label: "Subscriptions", 
      value: hasBreakdown ? subscriptions : grossRevenue * 0.55, 
      percentage: hasBreakdown ? getPercentage(subscriptions) : 55, 
      icon: CreditCard,
      color: "hsl(var(--primary))" 
    },
    { 
      label: "Tips", 
      value: hasBreakdown ? tips : grossRevenue * 0.25, 
      percentage: hasBreakdown ? getPercentage(tips) : 25, 
      icon: Gift,
      color: "hsl(var(--accent))" 
    },
    { 
      label: "Messages", 
      value: hasBreakdown ? messagesRevenue : grossRevenue * 0.15, 
      percentage: hasBreakdown ? getPercentage(messagesRevenue) : 15, 
      icon: MessageSquare,
      color: "hsl(var(--success))" 
    },
    { 
      label: "Referrals", 
      value: hasBreakdown ? referrals : grossRevenue * 0.05, 
      percentage: hasBreakdown ? getPercentage(referrals) : 5, 
      icon: Share2,
      color: "hsl(var(--warning))" 
    },
  ];

  if (grossRevenue <= 0) {
    return (
      <motion.div
        ref={ref}
        className="glass-card p-6"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: delay / 1000, type: "spring", stiffness: 100, damping: 15 }}
      >
        <h3 className="text-lg font-semibold text-foreground mb-1">Revenue</h3>
        <p className="text-xs text-muted-foreground mb-6">Overview</p>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <DollarSign className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No revenue sources yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Revenue breakdown will appear once earnings are synced</p>
        </div>
      </motion.div>
    );
  }

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
      <p className="text-xs text-muted-foreground mb-6">
        {hasBreakdown ? "Breakdown" : "Estimated breakdown"}
      </p>

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
