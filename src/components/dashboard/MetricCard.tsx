import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  delay?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: delay / 1000,
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  }),
};

export function MetricCard({ title, value, change, changeType, icon: Icon, delay = 0 }: MetricCardProps) {
  const getChangeIcon = () => {
    switch (changeType) {
      case "positive":
        return <TrendingUp className="h-4 w-4" />;
      case "negative":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-success";
      case "negative":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <motion.div 
      className="glass-card p-6 group hover:border-primary/30 transition-all duration-300"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={delay}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 0 30px hsl(var(--primary) / 0.15)",
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <motion.p 
            className="text-3xl font-bold text-foreground tracking-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay / 1000 + 0.2, type: "spring", stiffness: 100 }}
          >
            {value}
          </motion.p>
          {change !== "—" ? (
            <motion.div 
              className={cn("flex items-center gap-1 text-sm font-medium", getChangeColor())}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay / 1000 + 0.3 }}
            >
              {getChangeIcon()}
              <span>{change}</span>
            </motion.div>
          ) : (
            <motion.div 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay / 1000 + 0.3 }}
            >
              No historical data yet
            </motion.div>
          )}
        </div>
        <motion.div 
          className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="h-6 w-6 text-primary" />
        </motion.div>
      </div>
    </motion.div>
  );
}
