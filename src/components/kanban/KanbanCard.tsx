import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Image, X, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LinkifyText } from "@/components/shared/LinkifyText";
import type { KanbanItem } from "./KanbanBoard";

interface KanbanCardProps {
  item: KanbanItem;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDragOverlay?: boolean;
  disabled?: boolean;
}

export function KanbanCard({ item, onClick, onEdit, onDelete, isDragOverlay, disabled }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative rounded-lg border border-border bg-card p-3 cursor-pointer hover:border-primary/40 transition-all shadow-sm",
        isDragging && "opacity-40",
        isDragOverlay && "shadow-lg border-primary/50 rotate-2 scale-105"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Action Buttons */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded-md hover:bg-destructive/20 transition-colors"
          >
            <X className="h-3 w-3 text-destructive" />
          </button>
        )}
      </div>

      <h4 className="text-sm font-medium text-foreground pr-5 line-clamp-2">{item.title}</h4>

      {item.description && (
        <div className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap text-justify">
          <LinkifyText text={item.description} />
        </div>
      )}

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {item.platform && (
          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
            {item.platform}
          </Badge>
        )}
        {item.scheduled_date && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-2.5 w-2.5" />
            {new Date(item.scheduled_date).toLocaleDateString()}
          </span>
        )}
        {(item.reference_media?.length || 0) > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Image className="h-2.5 w-2.5" />
            {item.reference_media?.length}
          </span>
        )}
      </div>
    </div>
  );
}
