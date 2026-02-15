import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAgency } from "./useAgency";

export interface QCAssignment {
  id: string;
  agency_id: string | null;
  shift_block: "night" | "day" | "evening";
  qc_employee_id: string;
  effective_date: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    name: string;
    role: string;
  };
}

export function useQCAssignments(date?: string) {
  const queryClient = useQueryClient();
  const { agencyId } = useAgency();
  const effectiveDate = date || new Date().toISOString().split("T")[0];

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["qc-assignments", effectiveDate, agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qc_shift_assignments")
        .select(`
          *,
          employee:employees!qc_shift_assignments_qc_employee_id_fkey(id, name, role)
        `)
        .eq("effective_date", effectiveDate);

      if (error) throw error;
      return (data || []) as QCAssignment[];
    },
    enabled: !!agencyId,
  });

  const assignQC = useMutation({
    mutationFn: async ({
      shiftBlock,
      employeeId,
      date,
    }: {
      shiftBlock: "night" | "day" | "evening";
      employeeId: string;
      date?: string;
    }) => {
      if (!agencyId) {
        throw new Error("Agency ID not found");
      }

      const effectiveDateToUse = date || effectiveDate;

      // First try to delete existing assignment for this shift block and date
      await supabase
        .from("qc_shift_assignments")
        .delete()
        .eq("shift_block", shiftBlock)
        .eq("effective_date", effectiveDateToUse);

      // Then insert the new assignment
      const { data, error } = await supabase
        .from("qc_shift_assignments")
        .insert({
          shift_block: shiftBlock,
          qc_employee_id: employeeId,
          effective_date: effectiveDateToUse,
          agency_id: agencyId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qc-assignments"] });
      toast.success("QC Assigned", {
        description: "Quality Controller has been assigned to the shift.",
      });
    },
    onError: (error) => {
      toast.error("Error", {
        description: "Failed to assign QC: " + error.message,
      });
    },
  });

  const removeQC = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("qc_shift_assignments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qc-assignments"] });
      toast.success("QC Removed", {
        description: "Quality Controller has been removed from the shift.",
      });
    },
    onError: (error) => {
      toast.error("Error", {
        description: "Failed to remove QC: " + error.message,
      });
    },
  });

  // Get QC for a specific shift block
  const getQCForShift = (shiftBlock: "night" | "day" | "evening") => {
    return assignments.find((a) => a.shift_block === shiftBlock);
  };

  return {
    assignments,
    isLoading,
    assignQC: assignQC.mutate,
    removeQC: removeQC.mutate,
    getQCForShift,
  };
}
