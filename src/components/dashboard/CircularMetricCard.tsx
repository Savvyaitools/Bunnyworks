import { LucideIcon } from "lucide-react";

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
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div 
      className="glass-card p-6 animate-fade-in group hover:border-primary/30 transition-all duration-300 flex flex-col items-center"
      style={{ animationDelay: `${delay}ms` }}
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
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{ 
              animationDelay: `${delay + 200}ms`,
            }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{Math.round(percentage)}</span>
        </div>
      </div>

      {/* Label with icon */}
      <div className="flex items-center gap-2 mb-1">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>

      {/* Value */}
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
