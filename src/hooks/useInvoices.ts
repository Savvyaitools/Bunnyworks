import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAgency } from "./useAgency";

export interface Invoice {
  id: string;
  invoice_number: string;
  creator_id: string | null;
  agency_id: string | null;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    name: string;
  };
}

export function useInvoices() {
  const queryClient = useQueryClient();
  const { agencyId } = useAgency();

  const { data: invoices = [], isLoading: loading } = useQuery({
    queryKey: ["invoices", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          creator:creators(name)
        `)
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!agencyId,
  });

  const createInvoice = useMutation({
    mutationFn: async (invoice: Omit<Invoice, "id" | "created_at" | "updated_at" | "creator" | "agency_id">) => {
      if (!agencyId) {
        throw new Error("Agency ID not found");
      }

      const { data, error } = await supabase
        .from("invoices")
        .insert({ ...invoice, agency_id: agencyId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create invoice: " + error.message);
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update invoice: " + error.message);
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete invoice: " + error.message);
    },
  });

  const stats = {
    total: invoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
    paid: invoices.filter(i => i.status === "Paid").reduce((sum, inv) => sum + Number(inv.amount), 0),
    pending: invoices.filter(i => i.status === "Pending" || i.status === "Overdue").reduce((sum, inv) => sum + Number(inv.amount), 0),
  };

  return {
    invoices,
    loading,
    stats,
    createInvoice: createInvoice.mutateAsync,
    updateInvoice: updateInvoice.mutateAsync,
    deleteInvoice: deleteInvoice.mutateAsync,
  };
}

// Generate invoice number
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `INV-${year}-${random}`;
}
