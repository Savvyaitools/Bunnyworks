import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useMemo, useCallback } from "react";

export interface CreatorTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface CreatorInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string | null;
}

export interface CreatorEarning {
  id: string;
  amount: number;
  period_start: string;
  period_end: string;
  platform: string | null;
  notes: string | null;
}

export interface CreatorProfile {
  id: string;
  name: string;
  email: string;
  status: string;
}

export function useCreatorPortal() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const isCreator = profile?.user_type === "creator";

  const { data: creatorData, isLoading: creatorLoading } = useQuery({
    queryKey: ["creator-portal-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("creators")
        .select("id, name, email, status")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as CreatorProfile | null;
    },
    enabled: !!user?.id && isCreator,
  });

  const creatorId = creatorData?.id;

  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ["creator-portal-tasks", creatorId],
    queryFn: async () => {
      if (!creatorId) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, priority, status, due_date, created_at")
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CreatorTask[];
    },
    enabled: !!creatorId,
  });

  const { data: invoices = [], isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery({
    queryKey: ["creator-portal-invoices", creatorId],
    queryFn: async () => {
      if (!creatorId) return [];

      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, amount, status, issue_date, due_date, notes")
        .eq("creator_id", creatorId)
        .order("issue_date", { ascending: false });

      if (error) throw error;
      return data as CreatorInvoice[];
    },
    enabled: !!creatorId,
  });

  const { data: earnings = [], isLoading: earningsLoading, refetch: refetchEarnings } = useQuery({
    queryKey: ["creator-portal-earnings", creatorId],
    queryFn: async () => {
      if (!creatorId) return [];

      const { data, error } = await supabase
        .from("creator_earnings")
        .select("*")
        .eq("creator_id", creatorId)
        .order("period_end", { ascending: false });

      if (error) throw error;
      return data as CreatorEarning[];
    },
    enabled: !!creatorId,
  });

  const updateTaskStatus = useCallback(async (taskId: string, status: string) => {
    // Get task details first for notification
    const { data: taskData } = await supabase
      .from("tasks")
      .select("title, agency_id")
      .eq("id", taskId)
      .single();

    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
      return false;
    }

    // Create notification for agency when task is completed
    if (status === "Completed" && creatorData && taskData) {
      // Get agency owner profile ID
      const { data: agencyProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("agency_id", taskData.agency_id)
        .eq("user_type", "agency")
        .limit(1);

      if (agencyProfiles && agencyProfiles.length > 0) {
        await supabase.from("notifications").insert({
          user_id: agencyProfiles[0].id,
          title: "Task Completed",
          message: `${creatorData.name} completed task: ${taskData.title}`,
          type: "task_completed",
          link: `/tasks?id=${taskId}`,
        });
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ["creator-portal-tasks"] });
    return true;
  }, [queryClient, creatorData]);

  const loading = creatorLoading || tasksLoading || invoicesLoading || earningsLoading;

  // Computed stats
  const totalEarnings = useMemo(() => 
    earnings.reduce((sum, e) => sum + Number(e.amount), 0), 
    [earnings]
  );
  
  const activeTasks = useMemo(() => 
    tasks.filter((t) => t.status !== "Completed").length, 
    [tasks]
  );
  
  const pendingInvoices = useMemo(() => 
    invoices.filter((i) => i.status === "Pending").length, 
    [invoices]
  );
  
  const pendingInvoiceAmount = useMemo(() => 
    invoices
      .filter((i) => i.status === "Pending")
      .reduce((sum, i) => sum + Number(i.amount), 0),
    [invoices]
  );

  return {
    creatorId,
    creatorProfile: creatorData,
    tasks,
    invoices,
    earnings,
    loading,
    totalEarnings,
    activeTasks,
    pendingInvoices,
    pendingInvoiceAmount,
    updateTaskStatus,
    refetchTasks,
    refetchInvoices,
    refetchEarnings,
  };
}
