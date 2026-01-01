import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_seed: string | null;
  role: string;
  department: string | null;
  status: "Active" | "On Leave" | "Inactive";
  hire_date: string | null;
  assigned_creators: number;
  created_at: string;
  updated_at: string;
  auth_user_id: string | null;
  salary: number;
  commission_rate: number;
  bio: string | null;
  skills: string[] | null;
  education: string | null;
  experience: string | null;
  certifications: string[] | null;
  emergency_contact: string | null;
  address: string | null;
}

export type CreateEmployeeInput = Omit<Employee, "id" | "created_at" | "updated_at" | "auth_user_id">;
export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployees(data as Employee[]);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  const createEmployee = async (input: CreateEmployeeInput) => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      setEmployees((prev) => [data as Employee, ...prev]);
      toast.success("Employee added successfully");
      return data as Employee;
    } catch (error) {
      console.error("Error creating employee:", error);
      toast.error("Failed to add employee");
      return null;
    }
  };

  const updateEmployee = async (id: string, input: UpdateEmployeeInput) => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setEmployees((prev) => prev.map((e) => (e.id === id ? (data as Employee) : e)));
      toast.success("Employee updated successfully");
      return data as Employee;
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Failed to update employee");
      return null;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase.from("employees").delete().eq("id", id);

      if (error) throw error;
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      toast.success("Employee deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Failed to delete employee");
      return false;
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === "Active").length,
    onLeave: employees.filter((e) => e.status === "On Leave").length,
  };

  return {
    employees,
    loading,
    stats,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    refetch: fetchEmployees,
  };
}
