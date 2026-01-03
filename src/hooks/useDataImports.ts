import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useAgency } from "@/hooks/useAgency";

export interface DataImport {
  id: string;
  agency_id: string | null;
  creator_id: string | null;
  file_path: string;
  file_name: string;
  status: string;
  rejection_reason: string | null;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
  url?: string;
  creator?: {
    id: string;
    name: string;
  } | null;
}

export interface ExtractedData {
  id: string;
  import_id: string;
  data_type: string;
  value: number;
  period_start: string | null;
  period_end: string | null;
  platform: string | null;
  raw_text: string | null;
  confidence: number | null;
  created_at: string;
}

export function useDataImports() {
  const queryClient = useQueryClient();
  const { agencyId } = useAgency();
  const [uploading, setUploading] = useState(false);

  // Fetch all imports
  const { data: imports = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["data-imports", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_imports")
        .select(`
          *,
          creator:creators(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get signed URLs for each import
      const importsWithUrls = await Promise.all(
        (data || []).map(async (importItem) => {
          const { data: urlData } = await supabase.storage
            .from("data-imports")
            .createSignedUrl(importItem.file_path, 3600);
          return { ...importItem, url: urlData?.signedUrl };
        })
      );

      return importsWithUrls as DataImport[];
    },
    enabled: !!agencyId,
  });

  // Fetch extracted data for a specific import
  const getExtractedData = async (importId: string): Promise<ExtractedData[]> => {
    const { data, error } = await supabase
      .from("extracted_data")
      .select("*")
      .eq("import_id", importId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  };

  // Upload and analyze screenshot
  const uploadAndAnalyze = async (file: File, creatorId?: string) => {
    if (!agencyId) {
      toast.error("Agency not found");
      return null;
    }

    setUploading(true);
    try {
      // Generate unique file path
      const fileExt = file.name.split(".").pop();
      const filePath = `${agencyId}/${crypto.randomUUID()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("data-imports")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create import record
      const { data: importRecord, error: insertError } = await supabase
        .from("data_imports")
        .insert({
          agency_id: agencyId,
          creator_id: creatorId || null,
          file_path: filePath,
          file_name: file.name,
          status: "processing",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Get signed URL for AI analysis
      const { data: urlData } = await supabase.storage
        .from("data-imports")
        .createSignedUrl(filePath, 3600);

      if (!urlData?.signedUrl) {
        throw new Error("Could not generate signed URL");
      }

      // Call edge function to analyze
      const { data: analysisResult, error: analysisError } = await supabase.functions
        .invoke("analyze-screenshot", {
          body: {
            importId: importRecord.id,
            imageUrl: urlData.signedUrl,
          },
        });

      if (analysisError) {
        console.error("Analysis error:", analysisError);
        toast.error("Failed to analyze screenshot");
      } else if (analysisResult.status === "rejected") {
        toast.error(analysisResult.message || "Uploaded information is irrelevant to our Business");
      } else if (analysisResult.status === "approved") {
        toast.success("Screenshot analyzed and data extracted successfully!");
      } else if (analysisResult.status === "pending_review") {
        toast.info("Screenshot analyzed. Manual review required.");
      }

      queryClient.invalidateQueries({ queryKey: ["data-imports"] });
      return importRecord;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload screenshot");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Approve pending import
  const approveImport = useMutation({
    mutationFn: async ({ importId, creatorId }: { importId: string; creatorId?: string }) => {
      // Update status to approved
      const { error } = await supabase
        .from("data_imports")
        .update({ 
          status: "approved",
          creator_id: creatorId || undefined,
        })
        .eq("id", importId);

      if (error) throw error;

      // If creator is linked, insert earnings
      if (creatorId) {
        const extractedData = await getExtractedData(importId);
        const earnings = extractedData.filter(d => d.data_type === "earnings");
        
        for (const earning of earnings) {
          if (earning.period_start && earning.period_end) {
            await supabase.from("creator_earnings").insert({
              creator_id: creatorId,
              amount: earning.value,
              period_start: earning.period_start,
              period_end: earning.period_end,
              platform: earning.platform || "Unknown",
              notes: `Imported from screenshot. Raw text: ${earning.raw_text || "N/A"}`,
            });
          }
        }
      }
    },
    onSuccess: () => {
      toast.success("Import approved successfully");
      queryClient.invalidateQueries({ queryKey: ["data-imports"] });
      queryClient.invalidateQueries({ queryKey: ["creator-earnings"] });
    },
    onError: (error) => {
      console.error("Approve error:", error);
      toast.error("Failed to approve import");
    },
  });

  // Reject pending import
  const rejectImport = useMutation({
    mutationFn: async ({ importId, reason }: { importId: string; reason: string }) => {
      const { error } = await supabase
        .from("data_imports")
        .update({ 
          status: "rejected",
          rejection_reason: reason,
        })
        .eq("id", importId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Import rejected");
      queryClient.invalidateQueries({ queryKey: ["data-imports"] });
    },
    onError: (error) => {
      console.error("Reject error:", error);
      toast.error("Failed to reject import");
    },
  });

  // Delete import
  const deleteImport = useMutation({
    mutationFn: async ({ importId, filePath }: { importId: string; filePath: string }) => {
      // Delete from storage
      await supabase.storage.from("data-imports").remove([filePath]);
      
      // Delete record (cascades to extracted_data)
      const { error } = await supabase
        .from("data_imports")
        .delete()
        .eq("id", importId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Import deleted");
      queryClient.invalidateQueries({ queryKey: ["data-imports"] });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete import");
    },
  });

  // Filter helpers
  const processingImports = imports.filter(i => i.status === "processing");
  const pendingReviewImports = imports.filter(i => i.status === "pending_review");
  const approvedImports = imports.filter(i => i.status === "approved");
  const rejectedImports = imports.filter(i => i.status === "rejected");

  return {
    imports,
    loading,
    uploading,
    processingImports,
    pendingReviewImports,
    approvedImports,
    rejectedImports,
    uploadAndAnalyze,
    approveImport: approveImport.mutate,
    rejectImport: rejectImport.mutate,
    deleteImport: deleteImport.mutate,
    getExtractedData,
    refetch,
  };
}
