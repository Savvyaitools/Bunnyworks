import { useState, useEffect, useCallback } from "react";
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
  const [kpis, setKPIs] = useState<EmployeeKPI[]>([]);
  const [performanceSummaries, setPerformanceSummaries] = useState<EmployeePerformanceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKPIs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("employee_kpis")
        .select(`
          *,
          employee:employees(id, name, email, role)
        `)
        .order("period_end", { ascending: false });

      if (error) throw error;
      setKPIs(data as unknown as EmployeeKPI[]);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      toast.error("Failed to load KPI records");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPerformanceSummaries = useCallback(async () => {
    try {
      // Get all employees
      const { data: employees } = await supabase
        .from("employees")
        .select("id, name, role, assigned_creators");

      if (!employees) return;

      // Get aggregated KPI data for each employee
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

      setPerformanceSummaries(summaries);
    } catch (error) {
      console.error("Error fetching performance summaries:", error);
    }
  }, []);

  const createKPI = async (input: Omit<EmployeeKPI, "id" | "created_at" | "updated_at" | "employee">) => {
    try {
      const { data, error } = await supabase
        .from("employee_kpis")
        .insert(input)
        .select(`
          *,
          employee:employees(id, name, email, role)
        `)
        .single();

      if (error) throw error;
      setKPIs((prev) => [data as unknown as EmployeeKPI, ...prev]);
      toast.success("KPI record created");
      return data;
    } catch (error) {
      console.error("Error creating KPI:", error);
      toast.error("Failed to create KPI record");
      return null;
    }
  };

  const updateKPI = async (id: string, input: Partial<EmployeeKPI>) => {
    try {
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
      setKPIs((prev) => prev.map((k) => (k.id === id ? (data as unknown as EmployeeKPI) : k)));
      toast.success("KPI updated");
      return data;
    } catch (error) {
      console.error("Error updating KPI:", error);
      toast.error("Failed to update KPI");
      return null;
    }
  };

  const deleteKPI = async (id: string) => {
    try {
      const { error } = await supabase.from("employee_kpis").delete().eq("id", id);
      if (error) throw error;
      setKPIs((prev) => prev.filter((k) => k.id !== id));
      toast.success("KPI record deleted");
    } catch (error) {
      console.error("Error deleting KPI:", error);
      toast.error("Failed to delete KPI");
    }
  };

  // Auto-generate KPIs from existing data
  const generateKPIsForEmployee = async (employeeId: string, periodStart: string, periodEnd: string) => {
    try {
      // Get tasks assigned/completed
      const { data: tasks } = await supabase
        .from("tasks")
        .select("status")
        .eq("assignee_id", employeeId)
        .gte("created_at", periodStart)
        .lte("created_at", periodEnd);

      const tasksAssigned = tasks?.length || 0;
      const tasksCompleted = tasks?.filter((t) => t.status === "Completed").length || 0;

      // Get creators managed
      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("manager_id", employeeId);

      const creatorsManaged = creators?.length || 0;

      // Get revenue from managed creators
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

      // Get messages sent
      const { data: messages } = await supabase
        .from("internal_messages")
        .select("id")
        .eq("sender_id", employeeId)
        .eq("sender_type", "employee")
        .gte("created_at", periodStart)
        .lte("created_at", periodEnd);

      const messagesSent = messages?.length || 0;

      return createKPI({
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

  useEffect(() => {
    fetchKPIs();
    fetchPerformanceSummaries();
  }, [fetchKPIs, fetchPerformanceSummaries]);

  return {
    kpis,
    performanceSummaries,
    loading,
    createKPI,
    updateKPI,
    deleteKPI,
    generateKPIsForEmployee,
    refetch: () => {
      fetchKPIs();
      fetchPerformanceSummaries();
    },
  };
}
