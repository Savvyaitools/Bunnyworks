import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo } from "react";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "To Do" | "In Progress" | "Review" | "Completed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignee_id: string | null;
  creator_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateTaskInput = Omit<Task, "id" | "created_at" | "updated_at">;
export type UpdateTaskInput = Partial<CreateTaskInput>;

export function useTasks() {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create task: " + error.message);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTaskInput }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update task: " + error.message);
    },
  });

  const updateTask = async (id: string, input: UpdateTaskInput) => {
    return updateTaskMutation.mutateAsync({ id, input });
  };

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete task: " + error.message);
    },
  });

  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "To Do").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    review: tasks.filter((t) => t.status === "Review").length,
    completed: tasks.filter((t) => t.status === "Completed").length,
  }), [tasks]);

  return {
    tasks,
    loading,
    stats,
    createTask: createTask.mutateAsync,
    updateTask,
    deleteTask: deleteTask.mutateAsync,
  };
}
