import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo } from "react";

export interface EmployeePayroll {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  commission_earned: number;
  bonus: number;
  deductions: number;
  total_payout: number;
  status: "pending" | "approved" | "paid";
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    name: string;
    email: string;
    role: string;
    commission_rate: number;
  };
}

export interface CreatePayrollInput {
  employee_id: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  commission_earned?: number;
  bonus?: number;
  deductions?: number;
  notes?: string;
}

export function useEmployeePayroll() {
  const queryClient = useQueryClient();

  const { data: payrolls = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["employee-payroll"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_payroll")
        .select(`
          *,
          employee:employees(id, name, email, role, commission_rate)
        `)
        .order("period_end", { ascending: false });

      if (error) throw error;
      return data as unknown as EmployeePayroll[];
    },
  });

  const createPayrollMutation = useMutation({
    mutationFn: async (input: CreatePayrollInput) => {
      const total_payout = 
        input.base_salary + 
        (input.commission_earned || 0) + 
        (input.bonus || 0) - 
        (input.deductions || 0);

      const { data, error } = await supabase
        .from("employee_payroll")
        .insert({
          ...input,
          total_payout,
          status: "pending",
        })
        .select(`
          *,
          employee:employees(id, name, email, role, commission_rate)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-payroll"] });
      toast.success("Payroll record created");
    },
    onError: (error) => {
      toast.error("Failed to create payroll record: " + error.message);
    },
  });

  const updatePayrollStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "approved" | "paid" }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === "paid") {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("employee_payroll")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["employee-payroll"] });
      toast.success(`Payroll ${status}`);
    },
    onError: (error) => {
      toast.error("Failed to update payroll: " + error.message);
    },
  });

  const deletePayrollMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employee_payroll").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-payroll"] });
      toast.success("Payroll record deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete payroll: " + error.message);
    },
  });

  const calculateCommission = async (employeeId: string, periodStart: string, periodEnd: string) => {
    try {
      const { data: employee } = await supabase
        .from("employees")
        .select("commission_rate")
        .eq("id", employeeId)
        .single();

      if (!employee?.commission_rate) return 0;

      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("manager_id", employeeId);

      if (!creators?.length) return 0;

      const creatorIds = creators.map((c) => c.id);
      const { data: earnings } = await supabase
        .from("creator_earnings")
        .select("amount")
        .in("creator_id", creatorIds)
        .gte("period_start", periodStart)
        .lte("period_end", periodEnd);

      if (!earnings?.length) return 0;

      const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
      return (totalEarnings * employee.commission_rate) / 100;
    } catch (error) {
      console.error("Error calculating commission:", error);
      return 0;
    }
  };

  const updatePayrollStatus = async (id: string, status: "pending" | "approved" | "paid") => {
    return updatePayrollStatusMutation.mutateAsync({ id, status });
  };

  const stats = useMemo(() => ({
    totalPending: payrolls.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.total_payout, 0),
    totalPaid: payrolls.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.total_payout, 0),
    pendingCount: payrolls.filter((p) => p.status === "pending").length,
  }), [payrolls]);

  return {
    payrolls,
    loading,
    stats,
    createPayroll: createPayrollMutation.mutateAsync,
    updatePayrollStatus,
    deletePayroll: deletePayrollMutation.mutateAsync,
    calculateCommission,
    refetch,
  };
}
