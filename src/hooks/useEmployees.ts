import { useSupabaseCRUD } from "./useSupabaseCRUD";
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

export type CreateEmployeeInput = Omit<Employee, "id" | "created_at" | "updated_at">;
export type UpdateEmployeeInput = Partial<Omit<Employee, "id" | "created_at" | "updated_at">>;

export function useEmployees() {
  const crud = useSupabaseCRUD<Employee>({
    table: "employees",
    queryKey: "employees",
    orderBy: { column: "created_at", ascending: false },
    messages: {
      createSuccess: "Employee added successfully",
      updateSuccess: "Employee updated successfully",
      deleteSuccess: "Employee deleted successfully",
    },
  });

  const stats = useMemo(() => ({
    total: crud.items.length,
    active: crud.items.filter((e) => e.status === "Active").length,
    onLeave: crud.items.filter((e) => e.status === "On Leave").length,
  }), [crud.items]);

  return {
    employees: crud.items,
    loading: crud.loading,
    stats,
    createEmployee: crud.create,
    updateEmployee: crud.update,
    deleteEmployee: crud.remove,
    refetch: crud.refetch,
  };
}
