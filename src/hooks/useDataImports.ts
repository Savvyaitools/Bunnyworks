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

export interface UploadProgress {
  id: string;
  fileName: string;
  status: "uploading" | "analyzing" | "complete" | "error";
  progress: number;
  result?: "approved" | "pending_review" | "rejected";
  message?: string;
}

export function useDataImports() {
  const queryClient = useQueryClient();
  const { agencyId } = useAgency();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  // Fetch all imports
  const { data: imports = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["data-imports", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      
      const { data, error } = await supabase
        .from("data_imports")
        .select(`
          *,
          creator:creators(id, name)
        `)
        .eq("agency_id", agencyId)
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

  // Upload and analyze a single screenshot (internal use)
  const uploadSingleFile = async (file: File, creatorId?: string, progressId?: string): Promise<{ success: boolean; result?: string; message?: string }> => {
    if (!agencyId) {
      return { success: false, message: "Agency not found" };
    }

    const fileId = progressId || crypto.randomUUID();

    try {
      // Update progress: uploading
      setUploadProgress((prev) =>
        prev.map((p) => (p.id === fileId ? { ...p, status: "uploading" as const, progress: 30 } : p))
      );

      // Generate unique file path
      const fileExt = file.name.split(".").pop();
      const filePath = `${agencyId}/${crypto.randomUUID()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("data-imports")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update progress: creating record
      setUploadProgress((prev) =>
        prev.map((p) => (p.id === fileId ? { ...p, progress: 50 } : p))
      );

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

      // Update progress: analyzing
      setUploadProgress((prev) =>
        prev.map((p) => (p.id === fileId ? { ...p, status: "analyzing" as const, progress: 70 } : p))
      );

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
        return { success: false, message: "Failed to analyze screenshot" };
      }

      // Update progress: complete
      setUploadProgress((prev) =>
        prev.map((p) =>
          p.id === fileId
            ? {
                ...p,
                status: "complete" as const,
                progress: 100,
                result: analysisResult.status,
                message: analysisResult.message,
              }
            : p
        )
      );

      return { success: true, result: analysisResult.status, message: analysisResult.message };
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress((prev) =>
        prev.map((p) =>
          p.id === fileId
            ? { ...p, status: "error" as const, progress: 100, message: "Upload failed" }
            : p
        )
      );
      return { success: false, message: "Failed to upload screenshot" };
    }
  };

  // Upload multiple files with progress tracking
  const uploadMultipleFiles = async (files: File[], creatorId?: string) => {
    if (!agencyId) {
      toast.error("Agency not found");
      return;
    }

    setUploading(true);

    // Initialize progress for all files
    const initialProgress: UploadProgress[] = files.map((file) => ({
      id: crypto.randomUUID(),
      fileName: file.name,
      status: "uploading",
      progress: 0,
    }));
    setUploadProgress(initialProgress);

    // Process files in parallel (max 3 at a time)
    const results = await Promise.all(
      files.map((file, index) => uploadSingleFile(file, creatorId, initialProgress[index].id))
    );

    // Show summary toast
    const successCount = results.filter((r) => r.success).length;
    const approvedCount = results.filter((r) => r.result === "approved").length;
    const reviewCount = results.filter((r) => r.result === "pending_review").length;
    const rejectedCount = results.filter((r) => r.result === "rejected").length;

    if (successCount > 0) {
      const parts = [];
      if (approvedCount > 0) parts.push(`${approvedCount} approved`);
      if (reviewCount > 0) parts.push(`${reviewCount} pending review`);
      if (rejectedCount > 0) parts.push(`${rejectedCount} rejected`);
      toast.success(`Processed ${successCount} file(s): ${parts.join(", ")}`);
    }

    if (results.some((r) => !r.success)) {
      toast.error(`${results.filter((r) => !r.success).length} file(s) failed to upload`);
    }

    queryClient.invalidateQueries({ queryKey: ["data-imports"] });

    // Clear progress after delay
    setTimeout(() => {
      setUploadProgress([]);
    }, 3000);

    setUploading(false);
  };

  // Legacy single file upload (for backwards compatibility)
  const uploadAndAnalyze = async (file: File, creatorId?: string) => {
    await uploadMultipleFiles([file], creatorId);
  };

  // Clear upload progress
  const clearProgress = () => {
    setUploadProgress([]);
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

      // If creator is linked, insert earnings with import_id for cascade delete
      if (creatorId) {
        const extractedData = await getExtractedData(importId);
        const earnings = extractedData.filter(d => d.data_type === "earnings");
        
        for (const earning of earnings) {
          if (earning.period_start && earning.period_end) {
            await supabase.from("creator_earnings").insert({
              creator_id: creatorId,
              import_id: importId, // Link to source import for cascade deletion
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

  // Delete import - cascade delete handles extracted_data and creator_earnings automatically
  const deleteImport = useMutation({
    mutationFn: async ({ importId, filePath }: { importId: string; filePath: string }) => {
      // Delete from storage first
      await supabase.storage.from("data-imports").remove([filePath]);
      
      // Delete the import record - cascade delete handles extracted_data and creator_earnings
      const { error } = await supabase
        .from("data_imports")
        .delete()
        .eq("id", importId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Import deleted");
      // Invalidate all related queries to update dashboard and other views
      queryClient.invalidateQueries({ queryKey: ["data-imports"] });
      queryClient.invalidateQueries({ queryKey: ["creator-earnings"] });
      queryClient.invalidateQueries({ queryKey: ["creators"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete import");
    },
  });

  // Retry stuck/failed import
  const retryImport = useMutation({
    mutationFn: async (importId: string) => {
      // First, reset the import status to processing
      const { error: updateError } = await supabase
        .from("data_imports")
        .update({ 
          status: "processing",
          rejection_reason: null,
          confidence_score: null,
        })
        .eq("id", importId);

      if (updateError) throw updateError;

      // Delete any existing extracted data for this import
      await supabase
        .from("extracted_data")
        .delete()
        .eq("import_id", importId);

      // Get the import record to get the file path
      const { data: importRecord, error: fetchError } = await supabase
        .from("data_imports")
        .select("file_path")
        .eq("id", importId)
        .single();

      if (fetchError || !importRecord) throw new Error("Import not found");

      // Get a new signed URL
      const { data: urlData } = await supabase.storage
        .from("data-imports")
        .createSignedUrl(importRecord.file_path, 3600);

      if (!urlData?.signedUrl) {
        throw new Error("Could not generate signed URL");
      }

      // Call edge function to re-analyze
      const { data: analysisResult, error: analysisError } = await supabase.functions
        .invoke("analyze-screenshot", {
          body: {
            importId: importId,
            imageUrl: urlData.signedUrl,
          },
        });

      if (analysisError) {
        console.error("Analysis error:", analysisError);
        throw new Error("Failed to analyze screenshot");
      }

      return analysisResult;
    },
    onSuccess: (result) => {
      const statusMessage = result?.status === "approved" 
        ? "approved automatically" 
        : result?.status === "rejected"
        ? "rejected"
        : "sent for review";
      toast.success(`Import re-analyzed and ${statusMessage}`);
      queryClient.invalidateQueries({ queryKey: ["data-imports"] });
    },
    onError: (error) => {
      console.error("Retry error:", error);
      toast.error("Failed to retry import");
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
    uploadProgress,
    processingImports,
    pendingReviewImports,
    approvedImports,
    rejectedImports,
    uploadAndAnalyze,
    uploadMultipleFiles,
    clearProgress,
    approveImport: approveImport.mutate,
    rejectImport: rejectImport.mutate,
    deleteImport: deleteImport.mutate,
    retryImport: retryImport.mutate,
    retryingImportId: retryImport.isPending ? retryImport.variables : null,
    getExtractedData,
    refetch,
  };
}
