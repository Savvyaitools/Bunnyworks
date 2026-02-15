import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  onAddCard?: () => void;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, color, count, onAddCard, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={cn(
        "flex flex-col min-w-[280px] w-[280px] rounded-xl bg-muted/30 border border-border transition-colors",
        isOver && "border-primary/50 bg-muted/50"
      )}
    >
      {/* Column Header */}
      <div className="p-3 flex items-center gap-2">
        <div className={cn("w-3 h-3 rounded-full shrink-0", color)} />
        <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
        <span className="text-xs text-muted-foreground ml-auto">{count}</span>
      </div>

      {/* Cards Area */}
      <div
        ref={setNodeRef}
        className="flex-1 px-2 pb-2 space-y-2 min-h-[60px] overflow-y-auto max-h-[calc(100vh-320px)]"
      >
        {children}
      </div>

      {/* Add Card */}
      {onAddCard && (
        <div className="px-2 pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground text-xs h-8"
            onClick={onAddCard}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add a card
          </Button>
        </div>
      )}
    </div>
  );
}
