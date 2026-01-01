import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo } from "react";

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
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Employee[];
    },
  });

  const createEmployee = useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const { data, error } = await supabase
        .from("employees")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as Employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add employee: " + error.message);
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateEmployeeInput }) => {
      const { data, error } = await supabase
        .from("employees")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update employee: " + error.message);
    },
  });

  const updateEmployee = async (id: string, input: UpdateEmployeeInput) => {
    return updateEmployeeMutation.mutateAsync({ id, input });
  };

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete employee: " + error.message);
    },
  });

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => e.status === "Active").length,
    onLeave: employees.filter((e) => e.status === "On Leave").length,
  }), [employees]);

  return {
    employees,
    loading,
    stats,
    createEmployee: createEmployee.mutateAsync,
    updateEmployee,
    deleteEmployee: deleteEmployee.mutateAsync,
    refetch,
  };
}
