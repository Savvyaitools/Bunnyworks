import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContentFile {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: string;
  uploaded_at: string;
  url?: string;
}

export function useContentFiles() {
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("content_files")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      // Get public URLs for each file
      const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData } = supabase.storage
            .from("content-vault")
            .getPublicUrl(file.file_path);
          return { ...file, url: urlData.publicUrl };
        })
      );

      setFiles(filesWithUrls);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("content-vault")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Determine file type category
      let fileType = "Document";
      if (file.type.startsWith("video/")) fileType = "Video";
      else if (file.type.startsWith("image/")) fileType = "Image";

      // Insert metadata
      const { error: insertError } = await supabase.from("content_files").insert({
        name: file.name,
        file_path: filePath,
        file_type: fileType,
        file_size: file.size,
        status: "Pending Review",
      });

      if (insertError) throw insertError;

      toast.success(`${file.name} uploaded successfully`);
      await fetchFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (id: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("content-vault")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete metadata
      const { error: dbError } = await supabase
        .from("content_files")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast.success("File deleted");
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return { files, loading, uploading, uploadFile, deleteFile, refetch: fetchFiles };
}
