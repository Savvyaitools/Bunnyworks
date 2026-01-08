import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  className?: string;
}

const ranges = [
  { id: "7d", label: "7 Days" },
  { id: "1m", label: "1 Month" },
  { id: "3m", label: "3 Month" },
];

export function DateRangePicker({ className }: DateRangePickerProps) {
  const [activeRange, setActiveRange] = useState("1m");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
        {ranges.map((range) => (
          <button
            key={range.id}
            onClick={() => setActiveRange(range.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              activeRange === range.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {range.label}
          </button>
        ))}
      </div>
      <Button variant="outline" size="sm" className="gap-2 text-xs">
        <Calendar className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Jan 1 - Jan 8, 2026</span>
      </Button>
    </div>
  );
}
