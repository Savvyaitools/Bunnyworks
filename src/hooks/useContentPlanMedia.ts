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
  path?: string;
}

export function useContentPlanMedia() {
  const [uploading, setUploading] = useState(false);

  const uploadMedia = useCallback(async (file: File, creatorId: string, planId: string, agencyId?: string) => {
    setUploading(true);

    // Resolve agency_id (storage RLS requires the first folder to be the agency_id)
    let resolvedAgencyId = agencyId;
    if (!resolvedAgencyId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("agency_id")
          .eq("id", user.id)
          .maybeSingle();
        resolvedAgencyId = profile?.agency_id ?? undefined;
      }
    }

    if (!resolvedAgencyId) {
      console.error("No agency_id available for upload");
      toast.error("Failed to upload file: missing agency context");
      setUploading(false);
      return null;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${resolvedAgencyId}/${creatorId}/${planId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("content-references")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      toast.error(`Failed to upload file: ${uploadError.message}`);
      setUploading(false);
      return null;
    }

    // Use long-lived signed URL (7 days) — will be refreshed on read
    const { data: signedData, error: signedError } = await supabase.storage
      .from("content-references")
      .createSignedUrl(fileName, 60 * 60 * 24 * 7);

    if (signedError || !signedData?.signedUrl) {
      console.error("Error creating signed URL:", signedError);
      toast.error("Failed to get file URL");
      setUploading(false);
      return null;
    }

    const publicUrl = signedData.signedUrl;

    const mediaItem: ContentReferenceMedia = {
      id: crypto.randomUUID(),
      name: file.name,
      url: publicUrl,
      type: file.type.startsWith("video/") ? "video" : "image",
      size: file.size,
      uploaded_at: new Date().toISOString(),
      path: fileName,
    };

    setUploading(false);
    return mediaItem;
  }, []);

  const deleteMedia = useCallback(async (url: string) => {
    // Extract file path from URL (strip query string for signed URLs)
    const cleanUrl = url.split("?")[0];
    const urlParts = cleanUrl.split("/content-references/");
    if (urlParts.length < 2) return false;

    const filePath = decodeURIComponent(urlParts[1]);
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

  // Refresh signed URLs for stored media items. Falls back to extracting the
  // path from the existing URL when the stored item lacks a `path` field
  // (older records uploaded before path was persisted).
  const refreshMediaUrls = useCallback(async (media: ContentReferenceMedia[]): Promise<ContentReferenceMedia[]> => {
    if (!media || media.length === 0) return media;
    const result = await Promise.all(media.map(async (m) => {
      let path = m.path;
      if (!path && m.url) {
        const cleanUrl = m.url.split("?")[0];
        const parts = cleanUrl.split("/content-references/");
        if (parts.length === 2) path = decodeURIComponent(parts[1]);
      }
      if (!path) return m;
      const { data, error } = await supabase.storage
        .from("content-references")
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      if (error || !data?.signedUrl) return m;
      return { ...m, url: data.signedUrl, path };
    }));
    return result;
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
      path: m.path,
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
    refreshMediaUrls,
  };
}
