import { useMemo, useCallback } from "react";
import { useEmployees, SkillGrade, Employee } from "./useEmployees";

export type { SkillGrade };

// Chatter interface for backward compatibility
export interface Chatter {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string | null;
  skill_grade: SkillGrade;
  timezone: string | null;
  is_active: boolean;
  avatar_seed: string | null;
  agency_id: string | null;
  created_at: string;
  updated_at: string;
  daily_target_messages: number;
  daily_target_ppv: number;
}

export type CreateChatterInput = Omit<Chatter, "id" | "created_at" | "updated_at" | "agency_id">;
export type UpdateChatterInput = Partial<CreateChatterInput>;

// Map employee to chatter interface
function employeeToChatter(employee: Employee): Chatter {
  return {
    id: employee.id,
    auth_user_id: employee.auth_user_id,
    name: employee.name,
    email: employee.email,
    skill_grade: employee.skill_grade,
    timezone: employee.timezone,
    is_active: employee.status === "Active",
    avatar_seed: employee.avatar_seed,
    agency_id: employee.agency_id,
    created_at: employee.created_at,
    updated_at: employee.updated_at,
    daily_target_messages: employee.daily_target_messages,
    daily_target_ppv: employee.daily_target_ppv,
  };
}

export function useChatters() {
  const { 
    chatters: chatterEmployees, 
    chatterStats, 
    loading, 
    updateEmployee,
    deleteEmployee,
  } = useEmployees();

  // Map employees to chatter interface for backward compatibility
  const chatters = useMemo(() => 
    chatterEmployees.map(employeeToChatter),
    [chatterEmployees]
  );

  // Update chatter (maps to employee update)
  const updateChatter = useCallback(async (id: string, input: UpdateChatterInput) => {
    const employeeUpdate: Record<string, unknown> = {};
    
    if (input.skill_grade !== undefined) employeeUpdate.skill_grade = input.skill_grade;
    if (input.timezone !== undefined) employeeUpdate.timezone = input.timezone;
    if (input.is_active !== undefined) employeeUpdate.status = input.is_active ? "Active" : "Inactive";
    if (input.name !== undefined) employeeUpdate.name = input.name;
    if (input.email !== undefined) employeeUpdate.email = input.email;
    if (input.avatar_seed !== undefined) employeeUpdate.avatar_seed = input.avatar_seed;
    if (input.daily_target_messages !== undefined) employeeUpdate.daily_target_messages = input.daily_target_messages;
    if (input.daily_target_ppv !== undefined) employeeUpdate.daily_target_ppv = input.daily_target_ppv;
    
    return updateEmployee(id, employeeUpdate);
  }, [updateEmployee]);

  // Delete chatter (maps to employee delete)
  const deleteChatter = useCallback(async (id: string) => {
    return deleteEmployee(id);
  }, [deleteEmployee]);

  return {
    chatters,
    loading,
    stats: chatterStats,
    updateChatter,
    deleteChatter,
  };
}
