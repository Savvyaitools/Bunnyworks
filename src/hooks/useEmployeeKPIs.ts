import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmployeeKPI {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  tasks_completed: number;
  tasks_assigned: number;
  creators_managed: number;
  revenue_generated: number;
  messages_sent: number;
  avg_response_time_minutes: number | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface EmployeePerformanceSummary {
  employee_id: string;
  employee_name: string;
  employee_role: string;
  total_tasks_completed: number;
  total_tasks_assigned: number;
  completion_rate: number;
  total_revenue_generated: number;
  avg_rating: number | null;
  creators_count: number;
}

export function useEmployeeKPIs() {
  const queryClient = useQueryClient();

  const { data: kpis = [], isLoading: kpisLoading, refetch: refetchKPIs } = useQuery({
    queryKey: ["employee-kpis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_kpis")
        .select(`
          *,
          employee:employees(id, name, email, role)
        `)
        .order("period_end", { ascending: false });

      if (error) throw error;
      return data as unknown as EmployeeKPI[];
    },
  });

  const { data: performanceSummaries = [], isLoading: summariesLoading, refetch: refetchSummaries } = useQuery({
    queryKey: ["employee-performance-summaries"],
    queryFn: async () => {
      const { data: employees } = await supabase
        .from("employees")
        .select("id, name, role, assigned_creators");

      if (!employees) return [];

      const summaries: EmployeePerformanceSummary[] = [];

      for (const emp of employees) {
        const { data: empKPIs } = await supabase
          .from("employee_kpis")
          .select("*")
          .eq("employee_id", emp.id);

        const totalTasksCompleted = empKPIs?.reduce((sum, k) => sum + k.tasks_completed, 0) || 0;
        const totalTasksAssigned = empKPIs?.reduce((sum, k) => sum + k.tasks_assigned, 0) || 0;
        const totalRevenue = empKPIs?.reduce((sum, k) => sum + Number(k.revenue_generated), 0) || 0;
        const ratings = empKPIs?.filter((k) => k.rating !== null).map((k) => k.rating!) || [];
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

        summaries.push({
          employee_id: emp.id,
          employee_name: emp.name,
          employee_role: emp.role,
          total_tasks_completed: totalTasksCompleted,
          total_tasks_assigned: totalTasksAssigned,
          completion_rate: totalTasksAssigned > 0 ? (totalTasksCompleted / totalTasksAssigned) * 100 : 0,
          total_revenue_generated: totalRevenue,
          avg_rating: avgRating,
          creators_count: emp.assigned_creators,
        });
      }

      return summaries;
    },
  });

  const createKPIMutation = useMutation({
    mutationFn: async (input: Omit<EmployeeKPI, "id" | "created_at" | "updated_at" | "employee">) => {
      const { data, error } = await supabase
        .from("employee_kpis")
        .insert(input)
        .select(`
          *,
          employee:employees(id, name, email, role)
        `)
        .single();

      if (error) throw error;
      return data as unknown as EmployeeKPI;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["employee-performance-summaries"] });
      toast.success("KPI record created");
    },
    onError: (error) => {
      toast.error("Failed to create KPI record: " + error.message);
    },
  });

  const updateKPIMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<EmployeeKPI> }) => {
      const { data, error } = await supabase
        .from("employee_kpis")
        .update(input)
        .eq("id", id)
        .select(`
          *,
          employee:employees(id, name, email, role)
        `)
        .single();

      if (error) throw error;
      return data as unknown as EmployeeKPI;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["employee-performance-summaries"] });
      toast.success("KPI updated");
    },
    onError: (error) => {
      toast.error("Failed to update KPI: " + error.message);
    },
  });

  const deleteKPIMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employee_kpis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["employee-performance-summaries"] });
      toast.success("KPI record deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete KPI: " + error.message);
    },
  });

  const generateKPIsForEmployee = async (employeeId: string, periodStart: string, periodEnd: string) => {
    try {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("status")
        .eq("assignee_id", employeeId)
        .gte("created_at", periodStart)
        .lte("created_at", periodEnd);

      const tasksAssigned = tasks?.length || 0;
      const tasksCompleted = tasks?.filter((t) => t.status === "Completed").length || 0;

      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("manager_id", employeeId);

      const creatorsManaged = creators?.length || 0;

      const creatorIds = creators?.map((c) => c.id) || [];
      let revenueGenerated = 0;

      if (creatorIds.length > 0) {
        const { data: earnings } = await supabase
          .from("creator_earnings")
          .select("amount")
          .in("creator_id", creatorIds)
          .gte("period_start", periodStart)
          .lte("period_end", periodEnd);

        revenueGenerated = earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      }

      const { data: messages } = await supabase
        .from("internal_messages")
        .select("id")
        .eq("sender_id", employeeId)
        .eq("sender_type", "employee")
        .gte("created_at", periodStart)
        .lte("created_at", periodEnd);

      const messagesSent = messages?.length || 0;

      return createKPIMutation.mutateAsync({
        employee_id: employeeId,
        period_start: periodStart,
        period_end: periodEnd,
        tasks_completed: tasksCompleted,
        tasks_assigned: tasksAssigned,
        creators_managed: creatorsManaged,
        revenue_generated: revenueGenerated,
        messages_sent: messagesSent,
        avg_response_time_minutes: null,
        rating: null,
        notes: null,
      });
    } catch (error) {
      console.error("Error generating KPIs:", error);
      toast.error("Failed to generate KPIs");
      return null;
    }
  };

  const updateKPI = async (id: string, input: Partial<EmployeeKPI>) => {
    return updateKPIMutation.mutateAsync({ id, input });
  };

  const loading = kpisLoading || summariesLoading;

  return {
    kpis,
    performanceSummaries,
    loading,
    createKPI: createKPIMutation.mutateAsync,
    updateKPI,
    deleteKPI: deleteKPIMutation.mutateAsync,
    generateKPIsForEmployee,
    refetch: () => {
      refetchKPIs();
      refetchSummaries();
    },
  };
}
