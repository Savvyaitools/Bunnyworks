import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAgency } from "./useAgency";

export interface SOPDocument {
  id: string;
  title: string;
  category: string;
  content: string | null;
  file_path: string | null;
  file_type: string | null;
  roles: string[];
  agency_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useSOPDocuments() {
  const queryClient = useQueryClient();
  const { agencyId } = useAgency();

  const { data: documents = [], isLoading: loading } = useQuery({
    queryKey: ["sop-documents", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      
      const { data, error } = await supabase
        .from("sop_documents")
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SOPDocument[];
    },
    enabled: !!agencyId,
  });

  const createDocument = useMutation({
    mutationFn: async (doc: Omit<SOPDocument, "id" | "created_at" | "updated_at" | "agency_id">) => {
      if (!agencyId) {
        throw new Error("Agency ID not found");
      }

      const { data, error } = await supabase
        .from("sop_documents")
        .insert({ ...doc, agency_id: agencyId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sop-documents"] });
      toast.success("Document added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add document: " + error.message);
    },
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SOPDocument> & { id: string }) => {
      const { data, error } = await supabase
        .from("sop_documents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sop-documents"] });
      toast.success("Document updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update document: " + error.message);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      // First get the document to check if it has a file
      const { data: doc } = await supabase
        .from("sop_documents")
        .select("file_path")
        .eq("id", id)
        .single();

      // Delete file from storage if exists
      if (doc?.file_path) {
        await supabase.storage.from("sop-documents").remove([doc.file_path]);
      }

      const { error } = await supabase.from("sop_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sop-documents"] });
      toast.success("Document deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete document: " + error.message);
    },
  });

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("sop-documents")
      .upload(fileName, file);

    if (error) throw error;
    return fileName;
  };

  const getFileUrl = (filePath: string): string => {
    const { data } = supabase.storage.from("sop-documents").getPublicUrl(filePath);
    return data.publicUrl;
  };

  return {
    documents,
    loading,
    createDocument: createDocument.mutateAsync,
    updateDocument: updateDocument.mutateAsync,
    deleteDocument: deleteDocument.mutateAsync,
    uploadFile,
    getFileUrl,
  };
}
