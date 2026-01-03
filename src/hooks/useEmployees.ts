import { useSupabaseCRUD } from "./useSupabaseCRUD";
import { useAgency } from "./useAgency";
import { useMemo, useCallback } from "react";
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
  agency_id: string | null;
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

export type CreateEmployeeInput = Omit<Employee, "id" | "created_at" | "updated_at" | "agency_id">;
export type UpdateEmployeeInput = Partial<Omit<Employee, "id" | "created_at" | "updated_at" | "agency_id">>;

export function useEmployees() {
  const { agencyId, limits, invalidateLimits } = useAgency();

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

  // Wrapper that adds agency_id and checks limits
  const createEmployee = useCallback(async (input: CreateEmployeeInput) => {
    if (!agencyId) {
      toast.error("Agency not found. Please log in again.");
      throw new Error("Agency ID not found");
    }

    // Check limit before creating
    if (limits && !limits.canAddEmployee) {
      toast.error(`Employee limit reached (${limits.currentEmployees}/${limits.maxEmployees}). Upgrade your plan to add more employees.`);
      throw new Error("Employee limit reached");
    }

    const result = await crud.create({ ...input, agency_id: agencyId });
    invalidateLimits();
    return result;
  }, [crud, agencyId, limits, invalidateLimits]);

  // Wrapper for delete to update limits
  const deleteEmployee = useCallback(async (id: string) => {
    const result = await crud.remove(id);
    invalidateLimits();
    return result;
  }, [crud, invalidateLimits]);

  return {
    employees: crud.items,
    loading: crud.loading,
    stats,
    limits,
    createEmployee,
    updateEmployee: crud.update,
    deleteEmployee,
    refetch: crud.refetch,
  };
}
