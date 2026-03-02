import { useSupabaseCRUD } from "./useSupabaseCRUD";
import { useAgency } from "./useAgency";
import { useMemo, useCallback } from "react";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "To Do" | "In Progress" | "Review" | "Completed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignee_id: string | null;
  creator_id: string | null;
  chatter_id: string | null;
  request_type: string | null;
  agency_id: string | null;
  due_date: string | null;
  media_url: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateTaskInput = Omit<Task, "id" | "created_at" | "updated_at" | "agency_id">;
export type UpdateTaskInput = Partial<CreateTaskInput>;

export function useTasks() {
  const { agencyId } = useAgency();

  const crud = useSupabaseCRUD<Task>({
    table: "tasks",
    queryKey: "tasks",
    enabled: Boolean(agencyId),
    filter: agencyId ? { column: "agency_id", value: agencyId } : undefined,
    orderBy: { column: "created_at", ascending: false },
    messages: {
      createSuccess: "Task created successfully",
      updateSuccess: "Task updated successfully",
      deleteSuccess: "Task deleted successfully",
    },
  });

  const stats = useMemo(() => ({
    total: crud.items.length,
    todo: crud.items.filter((t) => t.status === "To Do").length,
    inProgress: crud.items.filter((t) => t.status === "In Progress").length,
    review: crud.items.filter((t) => t.status === "Review").length,
    completed: crud.items.filter((t) => t.status === "Completed").length,
  }), [crud.items]);

  // Wrapper that adds agency_id when creating
  const createTask = useCallback(async (input: CreateTaskInput) => {
    if (!agencyId) {
      throw new Error("Agency ID not found");
    }
    return crud.create({ ...input, agency_id: agencyId });
  }, [crud, agencyId]);

  return {
    tasks: crud.items,
    loading: crud.loading,
    stats,
    createTask,
    updateTask: crud.update,
    deleteTask: crud.remove,
  };
}
