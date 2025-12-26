import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  delay?: number;
}

export function MetricCard({ title, value, change, changeType, icon: Icon, delay = 0 }: MetricCardProps) {
  return (
    <div 
      className="stat-card animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          <div className="flex items-center gap-1 text-sm">
            <span className={cn(
              "flex items-center gap-0.5 font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {changeType === "positive" && "↗"}
              {changeType === "negative" && "↘"}
              {change}
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </div>
        <div className="metric-icon">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
}
