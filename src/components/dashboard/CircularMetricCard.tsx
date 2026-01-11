import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface CircularMetricCardProps {
  title: string;
  value: string;
  percentage: number;
  color: string;
  icon: LucideIcon;
  delay?: number;
}

export function CircularMetricCard({ 
  title, 
  value, 
  percentage, 
  color, 
  icon: Icon, 
  delay = 0 
}: CircularMetricCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    if (!isInView) return;
    
    const timer = setTimeout(() => {
      // Animate percentage with easing
      const duration = 1500;
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out-expo
        const eased = 1 - Math.pow(2, -10 * progress);
        const current = percentage * eased;
        
        setAnimatedPercentage(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timer);
  }, [percentage, delay, isInView]);

  return (
    <motion.div 
      ref={ref}
      className="glass-card p-6 group hover:border-primary/30 transition-all duration-300 flex flex-col items-center"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ 
        delay: delay / 1000, 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: `0 0 40px ${color}20`,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
    >
      {/* Circular Progress */}
      <div className="relative w-28 h-28 mb-4">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          {/* Progress circle with animation */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              filter: `drop-shadow(0 0 8px ${color}50)`,
            }}
          />
        </svg>
        {/* Center value */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ delay: delay / 1000 + 0.3, type: "spring", stiffness: 200 }}
        >
          <span className="text-lg font-bold text-foreground">
            {Math.round(animatedPercentage)}%
          </span>
        </motion.div>
      </div>

      {/* Label with icon */}
      <motion.div 
        className="flex items-center gap-2 mb-1"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: delay / 1000 + 0.4 }}
      >
        <motion.div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}60` }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </motion.div>

      {/* Value */}
      <motion.p 
        className="text-xl font-bold text-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: delay / 1000 + 0.5 }}
      >
        {value}
      </motion.p>
    </motion.div>
  );
}
