import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data as Task[]);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = async (input: CreateTaskInput) => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      setTasks((prev) => [data as Task, ...prev]);
      toast.success("Task created successfully");
      return data as Task;
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
      return null;
    }
  };

  const updateTask = async (id: string, input: UpdateTaskInput) => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setTasks((prev) => prev.map((t) => (t.id === id ? (data as Task) : t)));
      toast.success("Task updated successfully");
      return data as Task;
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
      return null;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
      return false;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "To Do").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    review: tasks.filter((t) => t.status === "Review").length,
    completed: tasks.filter((t) => t.status === "Completed").length,
  };

  return {
    tasks,
    loading,
    stats,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
