import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

export const BOARD_COLUMNS = [
  { id: "resources", title: "Resources", color: "bg-emerald-500" },
  { id: "instructions", title: "Instructions", color: "bg-red-500" },
  { id: "to_do", title: "To Do", color: "bg-blue-500" },
  { id: "projects", title: "Projects", color: "bg-purple-500" },
  { id: "incomplete", title: "Incomplete", color: "bg-yellow-500" },
  { id: "completed", title: "Completed", color: "bg-green-500" },
] as const;

export type BoardColumnId = (typeof BOARD_COLUMNS)[number]["id"];

export interface KanbanItem {
  id: string;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  platform: string | null;
  board_column: string;
  board_position: number;
  status: string;
  reference_media?: { id: string; name: string; url: string; type: string; size: number; uploaded_at: string }[] | null;
}

interface KanbanBoardProps {
  items: KanbanItem[];
  onMoveCard: (cardId: string, newColumn: string, newPosition: number) => void;
  onCardClick?: (item: KanbanItem) => void;
  onAddCard?: (column: string) => void;
  onDeleteCard?: (cardId: string) => void;
  readOnly?: boolean;
}

export function KanbanBoard({
  items,
  onMoveCard,
  onCardClick,
  onAddCard,
  onDeleteCard,
  readOnly = false,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getColumnItems = useCallback(
    (columnId: string) =>
      items
        .filter((item) => item.board_column === columnId)
        .sort((a, b) => a.board_position - b.board_position),
    [items]
  );

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handled on drag end
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItemData = items.find((i) => i.id === active.id);
    if (!activeItemData) return;

    // Determine target column
    let targetColumn: string;
    let targetPosition: number;

    const overItem = items.find((i) => i.id === over.id);
    if (overItem) {
      // Dropped over another card
      targetColumn = overItem.board_column;
      targetPosition = overItem.board_position;
    } else {
      // Dropped over a column droppable
      targetColumn = over.id as string;
      const columnItems = getColumnItems(targetColumn);
      targetPosition = columnItems.length;
    }

    if (activeItemData.board_column === targetColumn && activeItemData.board_position === targetPosition) {
      return;
    }

    onMoveCard(active.id as string, targetColumn, targetPosition);
  };

  return (
    <DndContext
      sensors={readOnly ? [] : sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
        {BOARD_COLUMNS.map((column) => {
          const columnItems = getColumnItems(column.id);
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              count={columnItems.length}
              onAddCard={!readOnly && onAddCard ? () => onAddCard(column.id) : undefined}
            >
              <SortableContext
                items={columnItems.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnItems.map((item) => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    onClick={onCardClick ? () => onCardClick(item) : undefined}
                    onDelete={!readOnly && onDeleteCard ? () => onDeleteCard(item.id) : undefined}
                    disabled={readOnly}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeItem ? (
          <KanbanCard item={activeItem} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
