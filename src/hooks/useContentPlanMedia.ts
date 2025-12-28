import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface ContentReferenceMedia {
  id: string;
  name: string;
  url: string;
  type: "image" | "video";
  size: number;
  uploaded_at: string;
}

export function useContentPlanMedia() {
  const [uploading, setUploading] = useState(false);

  const uploadMedia = useCallback(async (file: File, creatorId: string, planId: string) => {
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${creatorId}/${planId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("content-references")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      toast.error("Failed to upload file");
      setUploading(false);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("content-references")
      .getPublicUrl(fileName);

    const mediaItem: ContentReferenceMedia = {
      id: crypto.randomUUID(),
      name: file.name,
      url: publicUrl,
      type: file.type.startsWith("video/") ? "video" : "image",
      size: file.size,
      uploaded_at: new Date().toISOString(),
    };

    setUploading(false);
    return mediaItem;
  }, []);

  const deleteMedia = useCallback(async (url: string) => {
    // Extract file path from URL
    const urlParts = url.split("/content-references/");
    if (urlParts.length < 2) return false;

    const filePath = urlParts[1];
    const { error } = await supabase.storage
      .from("content-references")
      .remove([filePath]);

    if (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
      return false;
    }

    return true;
  }, []);

  const updatePlanMedia = useCallback(async (planId: string, media: ContentReferenceMedia[]) => {
    // Convert to JSON-compatible format
    const jsonMedia = media.map(m => ({
      id: m.id,
      name: m.name,
      url: m.url,
      type: m.type,
      size: m.size,
      uploaded_at: m.uploaded_at,
    })) as unknown as Json;

    const { error } = await supabase
      .from("content_plans")
      .update({ reference_media: jsonMedia })
      .eq("id", planId);

    if (error) {
      console.error("Error updating plan media:", error);
      toast.error("Failed to update media references");
      return false;
    }

    return true;
  }, []);

  return {
    uploading,
    uploadMedia,
    deleteMedia,
    updatePlanMedia,
  };
}
