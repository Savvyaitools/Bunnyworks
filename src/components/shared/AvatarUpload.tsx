import { useRef, useState } from "react";
import { Upload, Loader2, User as UserIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { toast } from "sonner";
import { getInitials } from "@/lib/formatters";

interface AvatarUploadProps {
  name: string;
  currentUrl?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export function AvatarUpload({ name, currentUrl, onChange, label = "Profile Picture" }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { agencyId } = useAgency();

  const handleFile = async (file: File) => {
    if (!agencyId) {
      toast.error("Agency not found. Please log in again.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${agencyId}/avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("creator-avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("creator-avatars").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Profile picture uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 ring-2 ring-border">
          {currentUrl ? (
            <AvatarImage src={currentUrl} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-muted text-muted-foreground">
            {name ? getInitials(name) : <UserIcon className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {currentUrl ? "Change" : "Upload"}
            </Button>
            {currentUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(null)}
                disabled={uploading}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-2" /> Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, WebP. Max 5MB.</p>
        </div>
      </div>
    </div>
  );
}