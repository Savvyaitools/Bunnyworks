import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import { useAgency } from "./useAgency";

export interface ContentFile {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: string;
  uploaded_at: string;
  agency_id: string | null;
  url?: string;
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "complete" | "error";
}

export function useContentFiles() {
  const queryClient = useQueryClient();
  const { agencyId } = useAgency();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);

  const { data: files = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["content-files", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_files")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData, error: urlError } = await supabase.storage
            .from("content-vault")
            .createSignedUrl(file.file_path, 3600);
          return { ...file, url: urlError ? undefined : urlData?.signedUrl };
        })
      );

      return filesWithUrls as ContentFile[];
    },
    enabled: !!agencyId,
  });

  const uploadFile = async (file: File): Promise<boolean> => {
    if (!agencyId) {
      toast.error("Agency not found");
      return false;
    }

    const fileId = crypto.randomUUID();
    
    setUploadProgress((prev) => [
      ...prev,
      { fileName: file.name, progress: 0, status: "uploading" },
    ]);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${fileId}.${fileExt}`;

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileName === file.name && p.progress < 90
              ? { ...p, progress: p.progress + 10 }
              : p
          )
        );
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from("content-vault")
        .upload(filePath, file);

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      let fileType = "Document";
      if (file.type.startsWith("video/")) fileType = "Video";
      else if (file.type.startsWith("image/")) fileType = "Image";

      const { error: insertError } = await supabase.from("content_files").insert({
        name: file.name,
        file_path: filePath,
        file_type: fileType,
        file_size: file.size,
        status: "Pending Review",
        agency_id: agencyId,
      });

      if (insertError) throw insertError;

      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileName === file.name ? { ...p, progress: 100, status: "complete" } : p
        )
      );

      return true;
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileName === file.name ? { ...p, status: "error" } : p
        )
      );
      toast.error(`Failed to upload ${file.name}`);
      return false;
    }
  };

  const uploadMultipleFiles = async (fileList: File[]) => {
    setUploading(true);
    setUploadProgress([]);
    
    const results = await Promise.all(fileList.map(uploadFile));
    const successCount = results.filter(Boolean).length;
    
    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded successfully`);
      queryClient.invalidateQueries({ queryKey: ["content-files"] });
    }
    
    setTimeout(() => {
      setUploadProgress([]);
    }, 2000);
    
    setUploading(false);
  };

  const deleteFile = async (id: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("content-vault")
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("content_files")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast.success("File deleted");
      queryClient.invalidateQueries({ queryKey: ["content-files"] });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  return {
    files,
    loading,
    uploading,
    uploadProgress,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    refetch,
    clearProgress,
  };
}
