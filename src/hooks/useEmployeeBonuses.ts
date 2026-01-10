import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "./useAgency";
import { toast } from "sonner";

export interface BonusStructure {
  id: string;
  agency_id: string;
  name: string;
  period_month: number;
  period_year: number;
  department: "chatting" | "marketing";
  grade_a_bonus: number;
  grade_b_bonus: number;
  grade_c_bonus: number;
  grade_a_threshold: number;
  grade_b_threshold: number;
  grade_c_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface BonusAward {
  id: string;
  bonus_structure_id: string;
  employee_id: string;
  grade_earned: "A" | "B" | "C";
  performance_score: number;
  bonus_amount: number;
  metrics_snapshot: Record<string, unknown> | null;
  created_at: string;
  employee?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface CreateBonusStructureInput {
  name: string;
  period_month: number;
  period_year: number;
  department: "chatting" | "marketing";
  grade_a_bonus: number;
  grade_b_bonus: number;
  grade_c_bonus: number;
  grade_a_threshold?: number;
  grade_b_threshold?: number;
  grade_c_threshold?: number;
}

export function useEmployeeBonuses() {
  const queryClient = useQueryClient();
  const { agencyId } = useAgency();

  const { data: bonusStructures = [], isLoading: structuresLoading } = useQuery({
    queryKey: ["bonus-structures", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from("employee_bonus_structures")
        .select("*")
        .eq("agency_id", agencyId)
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false });

      if (error) throw error;
      return data as BonusStructure[];
    },
    enabled: !!agencyId,
  });

  const { data: bonusAwards = [], isLoading: awardsLoading } = useQuery({
    queryKey: ["bonus-awards", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from("employee_bonus_awards")
        .select(`
          *,
          employee:employees(id, name, role)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BonusAward[];
    },
    enabled: !!agencyId,
  });

  const createBonusStructure = useMutation({
    mutationFn: async (input: CreateBonusStructureInput) => {
      if (!agencyId) throw new Error("No agency ID");

      const { data, error } = await supabase
        .from("employee_bonus_structures")
        .insert({
          agency_id: agencyId,
          name: input.name,
          period_month: input.period_month,
          period_year: input.period_year,
          department: input.department,
          grade_a_bonus: input.grade_a_bonus,
          grade_b_bonus: input.grade_b_bonus,
          grade_c_bonus: input.grade_c_bonus,
          grade_a_threshold: input.grade_a_threshold ?? 90,
          grade_b_threshold: input.grade_b_threshold ?? 75,
          grade_c_threshold: input.grade_c_threshold ?? 60,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonus-structures"] });
      toast.success("Bonus structure created");
    },
    onError: (error) => {
      console.error("Error creating bonus structure:", error);
      toast.error("Failed to create bonus structure");
    },
  });

  const updateBonusStructure = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BonusStructure> & { id: string }) => {
      const { data, error } = await supabase
        .from("employee_bonus_structures")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonus-structures"] });
      toast.success("Bonus structure updated");
    },
    onError: () => {
      toast.error("Failed to update bonus structure");
    },
  });

  const deleteBonusStructure = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employee_bonus_structures")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonus-structures"] });
      toast.success("Bonus structure deleted");
    },
    onError: () => {
      toast.error("Failed to delete bonus structure");
    },
  });

  const awardBonus = useMutation({
    mutationFn: async (input: {
      bonus_structure_id: string;
      employee_id: string;
      grade_earned: "A" | "B" | "C";
      performance_score: number;
      bonus_amount: number;
      metrics_snapshot?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("employee_bonus_awards")
        .insert({
          bonus_structure_id: input.bonus_structure_id,
          employee_id: input.employee_id,
          grade_earned: input.grade_earned,
          performance_score: input.performance_score,
          bonus_amount: input.bonus_amount,
          metrics_snapshot: input.metrics_snapshot ? JSON.parse(JSON.stringify(input.metrics_snapshot)) : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonus-awards"] });
      toast.success("Bonus awarded");
    },
    onError: () => {
      toast.error("Failed to award bonus");
    },
  });

  const getCurrentMonthStructure = (department: "chatting" | "marketing") => {
    const now = new Date();
    return bonusStructures.find(
      (s) =>
        s.department === department &&
        s.period_month === now.getMonth() + 1 &&
        s.period_year === now.getFullYear()
    );
  };

  const calculateGrade = (score: number, structure: BonusStructure): "A" | "B" | "C" | null => {
    if (score >= structure.grade_a_threshold) return "A";
    if (score >= structure.grade_b_threshold) return "B";
    if (score >= structure.grade_c_threshold) return "C";
    return null;
  };

  const getBonusAmount = (grade: "A" | "B" | "C", structure: BonusStructure): number => {
    switch (grade) {
      case "A":
        return structure.grade_a_bonus;
      case "B":
        return structure.grade_b_bonus;
      case "C":
        return structure.grade_c_bonus;
      default:
        return 0;
    }
  };

  return {
    bonusStructures,
    bonusAwards,
    loading: structuresLoading || awardsLoading,
    createBonusStructure,
    updateBonusStructure,
    deleteBonusStructure,
    awardBonus,
    getCurrentMonthStructure,
    calculateGrade,
    getBonusAmount,
  };
}
