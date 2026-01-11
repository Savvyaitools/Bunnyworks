import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
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
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ 
        delay: delay / 1000, 
        type: "spring" as const, 
        stiffness: 100, 
        damping: 15 
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { type: "spring" as const, stiffness: 400, damping: 25 }
      }}
      className="cursor-default"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <motion.div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            changeType === "positive" ? "text-success" : "text-destructive"
          )}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: delay / 1000 + 0.2 }}
        >
          {changeType === "positive" ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {change}
        </motion.div>
      </div>
      <motion.p 
        className="text-2xl font-bold text-foreground mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: delay / 1000 + 0.1 }}
      >
        {value}
      </motion.p>
      <motion.div 
        className="h-16"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={isInView ? { opacity: 1, scaleY: 1 } : {}}
        transition={{ delay: delay / 1000 + 0.3, duration: 0.5 }}
        style={{ transformOrigin: "bottom" }}
      >
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
      </motion.div>
    </motion.div>
  );
}
