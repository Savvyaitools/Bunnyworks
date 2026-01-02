import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "./useAgency";
import { toast } from "sonner";

export function useAgencyLogo() {
  const { agency, agencyId, refetch } = useAgency();
  const [uploading, setUploading] = useState(false);

  const uploadLogo = async (file: File) => {
    if (!agencyId) {
      toast.error("No agency found");
      return null;
    }

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PNG, JPG, WebP, or SVG file");
      return null;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return null;
    }

    setUploading(true);

    try {
      // Delete existing logo if present
      const currentLogo = (agency as any)?.logo_url;
      if (currentLogo) {
        const existingPath = currentLogo.split("/agency-logos/")[1];
        if (existingPath) {
          await supabase.storage.from("agency-logos").remove([existingPath]);
        }
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${agencyId}/logo-${Date.now()}.${fileExt}`;

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from("agency-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("agency-logos")
        .getPublicUrl(fileName);

      // Update agency record
      const { error: updateError } = await supabase
        .from("agencies")
        .update({ logo_url: publicUrl })
        .eq("id", agencyId);

      if (updateError) throw updateError;

      await refetch();
      toast.success("Logo uploaded successfully");
      return publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteLogo = async () => {
    const currentLogo = (agency as any)?.logo_url;
    if (!agencyId || !currentLogo) return;

    setUploading(true);

    try {
      // Extract path from URL
      const path = currentLogo.split("/agency-logos/")[1];
      if (path) {
        await supabase.storage.from("agency-logos").remove([path]);
      }

      // Update agency record
      const { error } = await supabase
        .from("agencies")
        .update({ logo_url: null })
        .eq("id", agencyId);

      if (error) throw error;

      await refetch();
      toast.success("Logo removed");
    } catch (error) {
      console.error("Error deleting logo:", error);
      toast.error("Failed to remove logo");
    } finally {
      setUploading(false);
    }
  };

  return {
    logoUrl: (agency as any)?.logo_url as string | null,
    uploading,
    uploadLogo,
    deleteLogo,
  };
}
