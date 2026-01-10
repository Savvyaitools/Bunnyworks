import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "./useAgency";
import { toast } from "sonner";

export interface CustomRequest {
  id: string;
  agency_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  price: number | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomRequestInput {
  creator_id: string;
  title: string;
  description?: string;
  price?: number;
  due_date?: string;
  notes?: string;
}

export function useCustomRequests(creatorId?: string) {
  const queryClient = useQueryClient();
  const { agencyId } = useAgency();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["custom-requests", agencyId, creatorId],
    queryFn: async () => {
      if (!agencyId) return [];

      let query = supabase
        .from("custom_requests")
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false });

      if (creatorId) {
        query = query.eq("creator_id", creatorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CustomRequest[];
    },
    enabled: !!agencyId,
  });

  const createRequest = useMutation({
    mutationFn: async (input: CreateCustomRequestInput) => {
      if (!agencyId) throw new Error("No agency ID");

      const { data, error } = await supabase
        .from("custom_requests")
        .insert({
          agency_id: agencyId,
          creator_id: input.creator_id,
          title: input.title,
          description: input.description || null,
          price: input.price || null,
          due_date: input.due_date || null,
          notes: input.notes || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-requests"] });
      toast.success("Custom request created");
    },
    onError: () => {
      toast.error("Failed to create custom request");
    },
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from("custom_requests")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-requests"] });
      toast.success("Request updated");
    },
    onError: () => {
      toast.error("Failed to update request");
    },
  });

  const deleteRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-requests"] });
      toast.success("Request deleted");
    },
    onError: () => {
      toast.error("Failed to delete request");
    },
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in_progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
    totalValue: requests.reduce((sum, r) => sum + (r.price || 0), 0),
  };

  return {
    requests,
    loading: isLoading,
    stats,
    createRequest,
    updateRequest,
    deleteRequest,
  };
}
