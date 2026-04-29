import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode; // For action buttons
  className?: string;
}

export function PageHeader({ title, subtitle, children, className }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4", className)}
    >
      <div>
        <h1 className="ops-heading text-2xl sm:text-[28px] font-bold text-foreground">{title}</h1>
        <div className="ops-divider w-16 mt-2 opacity-70" />
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </motion.div>
  );
}
