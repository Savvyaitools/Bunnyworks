import { useState, useCallback, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle, Image, Video, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UploadProgress } from "@/hooks/useContentFiles";

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  uploading: boolean;
  uploadProgress: UploadProgress[];
}

export function FileDropZone({ onFilesSelected, uploading, uploadProgress }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["mp4", "mov", "avi", "webm"].includes(ext || "")) return Video;
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return Image;
    return FileText;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer text-center",
          isDragging
            ? "border-accent bg-accent/10 scale-[1.02]"
            : "border-border hover:border-accent/50 hover:bg-muted/30",
          uploading && "pointer-events-none opacity-50"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          accept="video/*,image/*,.pdf,.doc,.docx,.zip"
        />

        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
              isDragging ? "bg-accent/20" : "bg-muted"
            )}
          >
            {uploading ? (
              <Loader2 className="h-7 w-7 text-accent animate-spin" />
            ) : (
              <Upload className={cn("h-7 w-7", isDragging ? "text-accent" : "text-muted-foreground")} />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse • Videos, Images, Documents
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 bg-transparent border-border hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={uploading}
          >
            Select Files
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          {uploadProgress.map((item, index) => {
            const FileIcon = getFileIcon(item.fileName);
            return (
              <div
                key={index}
                className="glass-card p-3 flex items-center gap-3"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    item.status === "complete"
                      ? "bg-success/20"
                      : item.status === "error"
                      ? "bg-destructive/20"
                      : "bg-accent/20"
                  )}
                >
                  {item.status === "complete" ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : item.status === "error" ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-accent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.fileName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={item.progress}
                      className={cn(
                        "h-1.5 flex-1",
                        item.status === "error" && "[&>div]:bg-destructive"
                      )}
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {item.progress}%
                    </span>
                  </div>
                </div>
                {item.status === "uploading" && (
                  <Loader2 className="h-4 w-4 text-accent animate-spin shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
