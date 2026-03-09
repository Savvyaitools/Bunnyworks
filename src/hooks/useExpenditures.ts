import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAgency } from "./useAgency";

export type ExpenditureCategory = "salary" | "promotion" | "ads" | "subscription" | "software" | "other";

export interface Expenditure {
  id: string;
  agency_id: string;
  category: string;
  description: string;
  amount: number;
  frequency: string;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const categoryLabels: Record<ExpenditureCategory, string> = {
  salary: "Employee Salaries",
  promotion: "Promotion / GGs",
  ads: "Advertising",
  subscription: "Subscriptions",
  software: "Software & Tools",
  other: "Other",
};

export function getCategoryLabel(cat: string): string {
  return categoryLabels[cat as ExpenditureCategory] || cat;
}

export function useExpenditures() {
  const queryClient = useQueryClient();
  const { agencyId } = useAgency();

  const { data: expenditures = [], isLoading: loading } = useQuery({
    queryKey: ["expenditures", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from("expenditures")
        .select("*")
        .eq("agency_id", agencyId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Expenditure[];
    },
    enabled: !!agencyId,
  });

  const createExpenditure = useMutation({
    mutationFn: async (exp: Omit<Expenditure, "id" | "created_at" | "updated_at" | "agency_id">) => {
      if (!agencyId) throw new Error("Agency ID not found");
      const { data, error } = await supabase
        .from("expenditures")
        .insert({ ...exp, agency_id: agencyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenditures"] });
      toast.success("Expenditure added");
    },
    onError: (error) => toast.error("Failed to add expenditure: " + error.message),
  });

  const deleteExpenditure = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenditures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenditures"] });
      toast.success("Expenditure deleted");
    },
    onError: (error) => toast.error("Failed to delete: " + error.message),
  });

  const totalExpenses = expenditures.reduce((sum, e) => sum + Number(e.amount), 0);

  const byCategory = expenditures.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});

  return {
    expenditures,
    loading,
    totalExpenses,
    byCategory,
    createExpenditure: createExpenditure.mutateAsync,
    deleteExpenditure: deleteExpenditure.mutateAsync,
  };
}
