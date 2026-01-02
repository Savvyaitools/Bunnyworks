import { useRef, useState } from "react";
import { Upload, Trash2, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoUploadProps {
  currentLogoUrl?: string | null;
  agencyName: string;
  onUploadComplete: (url: string) => void;
  onDelete?: () => void;
  uploading?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

export function LogoUpload({
  currentLogoUrl,
  agencyName,
  onUploadComplete,
  onDelete,
  uploading = false,
  size = "md",
  disabled = false,
}: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (file: File) => {
    const url = await (window as any).__logoUploadHandler?.(file);
    if (url) {
      onUploadComplete(url);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const initials = agencyName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all cursor-pointer",
          sizeClasses[size],
          dragOver
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : currentLogoUrl ? (
          <img
            src={currentLogoUrl}
            alt={`${agencyName} logo`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Building2 className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{initials}</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled || uploading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {currentLogoUrl ? "Change" : "Upload"}
        </Button>

        {currentLogoUrl && onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={disabled || uploading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          PNG, JPG, WebP or SVG. Max 5MB
        </p>
      </div>
    </div>
  );
}
