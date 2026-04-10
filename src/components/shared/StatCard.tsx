import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StatCard = memo(function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendUp, 
  loading, 
  onClick,
  className 
}: StatCardProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper 
      onClick={onClick}
      className={cn(
        "stat-card animate-fade-in text-left",
        onClick && "hover:border-primary/40 transition-colors cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/20 flex items-center justify-center">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
        </div>
        {trend && (
          <Badge className={cn(
            "text-xs",
            trendUp ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
          )}>
            {trendUp ? "↑" : "↓"} {trend}
          </Badge>
        )}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-8 w-24 mb-1" />
          <Skeleton className="h-4 w-32 mb-1" />
          {subtitle && <Skeleton className="h-3 w-20" />}
        </>
      ) : (
        <>
          <p className="text-xl sm:text-2xl font-bold text-foreground truncate">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </>
      )}
    </Wrapper>
  );
}
