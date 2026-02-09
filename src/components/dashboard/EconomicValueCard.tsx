import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { DollarSign, Info } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EconomicValueCardProps {
  grossRevenue: number;
  netRevenue: number;
  agencyEarnings: number;
  commissionRate: number;
  delay?: number;
}

export function EconomicValueCard({ 
  grossRevenue, 
  netRevenue, 
  agencyEarnings, 
  commissionRate,
  delay = 0 
}: EconomicValueCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const hasData = grossRevenue > 0 || netRevenue > 0;
  const creatorNet = netRevenue;
  const total = grossRevenue || 1;
  const creatorPercent = total > 0 ? (creatorNet / total) * 100 : 70;
  const agencyPercent = total > 0 ? (agencyEarnings / total) * 100 : 30;

  const breakdownRows = [
    { label: "Subscriptions", value: grossRevenue * 0.55, fee: `${(commissionRate * 100).toFixed(0)}% fee` },
    { label: "Tips", value: grossRevenue * 0.25, fee: `${(commissionRate * 100).toFixed(0)}% fee` },
    { label: "Messages", value: grossRevenue * 0.15, fee: `${(commissionRate * 100).toFixed(0)}% fee` },
    { label: "Other", value: grossRevenue * 0.05, fee: `${(commissionRate * 100).toFixed(0)}% fee` },
  ];

  if (!hasData) {
    return (
      <motion.div
        ref={ref}
        className="glass-card p-6 group"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: delay / 1000, type: "spring", stiffness: 100, damping: 15 }}
      >
        <h3 className="text-lg font-semibold text-foreground mb-2">Economic Value</h3>
        <p className="text-xs text-muted-foreground mb-6">Breakdown</p>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <DollarSign className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No revenue data yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Add creators and sync earnings to see the breakdown</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className="glass-card p-6 group"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: delay / 1000, type: "spring", stiffness: 100, damping: 15 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Economic Value</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Total revenue breakdown between creator and agency</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Breakdown</p>

      {/* Big number */}
      <motion.div
        className="text-3xl font-bold text-primary mb-5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: delay / 1000 + 0.2, type: "spring", stiffness: 100 }}
      >
        {formatCurrency(grossRevenue)}
      </motion.div>

      {/* Stacked progress bar */}
      <div className="mb-3">
        <div className="flex h-3 rounded-full overflow-hidden bg-muted/30">
          <motion.div
            className="bg-primary rounded-l-full"
            initial={{ width: 0 }}
            animate={isInView ? { width: `${creatorPercent}%` } : {}}
            transition={{ delay: delay / 1000 + 0.4, duration: 0.8, ease: "easeOut" }}
          />
          <motion.div
            className="bg-accent rounded-r-full"
            initial={{ width: 0 }}
            animate={isInView ? { width: `${agencyPercent}%` } : {}}
            transition={{ delay: delay / 1000 + 0.6, duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span>Creator Split</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span>Agency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3" />
            <span>OF</span>
          </div>
        </div>
      </div>

      {/* Breakdown rows */}
      <div className="border-t border-border pt-4 mt-4 space-y-3">
        <p className="text-sm font-medium text-foreground mb-2">OnlyFans</p>
        {breakdownRows.map((row, i) => (
          <motion.div
            key={row.label}
            className="flex items-center justify-between text-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: delay / 1000 + 0.5 + i * 0.1 }}
          >
            <span className="text-muted-foreground">{row.label}</span>
            <div className="flex items-center gap-4">
              <span className="text-foreground font-medium">{formatCurrency(row.value)}</span>
              <span className="text-xs text-muted-foreground">{row.fee}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
