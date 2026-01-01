import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [payrolls, setPayrolls] = useState<EmployeePayroll[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayrolls = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("employee_payroll")
        .select(`
          *,
          employee:employees(id, name, email, role, commission_rate)
        `)
        .order("period_end", { ascending: false });

      if (error) throw error;
      setPayrolls(data as unknown as EmployeePayroll[]);
    } catch (error) {
      console.error("Error fetching payrolls:", error);
      toast.error("Failed to load payroll records");
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayroll = async (input: CreatePayrollInput) => {
    try {
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
      setPayrolls((prev) => [data as unknown as EmployeePayroll, ...prev]);
      toast.success("Payroll record created");
      return data;
    } catch (error) {
      console.error("Error creating payroll:", error);
      toast.error("Failed to create payroll record");
      return null;
    }
  };

  const updatePayrollStatus = async (id: string, status: "pending" | "approved" | "paid") => {
    try {
      const updateData: Record<string, unknown> = { status };
      if (status === "paid") {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("employee_payroll")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      setPayrolls((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status, paid_at: status === "paid" ? new Date().toISOString() : p.paid_at }
            : p
        )
      );
      toast.success(`Payroll ${status}`);
    } catch (error) {
      console.error("Error updating payroll:", error);
      toast.error("Failed to update payroll");
    }
  };

  const deletePayroll = async (id: string) => {
    try {
      const { error } = await supabase.from("employee_payroll").delete().eq("id", id);
      if (error) throw error;
      setPayrolls((prev) => prev.filter((p) => p.id !== id));
      toast.success("Payroll record deleted");
    } catch (error) {
      console.error("Error deleting payroll:", error);
      toast.error("Failed to delete payroll");
    }
  };

  const calculateCommission = async (employeeId: string, periodStart: string, periodEnd: string) => {
    try {
      // Get employee's commission rate
      const { data: employee } = await supabase
        .from("employees")
        .select("commission_rate")
        .eq("id", employeeId)
        .single();

      if (!employee?.commission_rate) return 0;

      // Get creators managed by this employee
      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("manager_id", employeeId);

      if (!creators?.length) return 0;

      // Get earnings for those creators in the period
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

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const stats = {
    totalPending: payrolls.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.total_payout, 0),
    totalPaid: payrolls.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.total_payout, 0),
    pendingCount: payrolls.filter((p) => p.status === "pending").length,
  };

  return {
    payrolls,
    loading,
    stats,
    createPayroll,
    updatePayrollStatus,
    deletePayroll,
    calculateCommission,
    refetch: fetchPayrolls,
  };
}
