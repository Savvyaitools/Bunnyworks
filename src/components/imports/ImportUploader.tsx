import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image, Loader2, CheckCircle, XCircle, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useCreators } from "@/hooks/useCreators";
import { UploadProgress } from "@/hooks/useDataImports";

interface ImportUploaderProps {
  onUpload: (files: File[], creatorId?: string) => Promise<void>;
  uploading: boolean;
  uploadProgress: UploadProgress[];
  onClearProgress: () => void;
}

const statusConfig = {
  uploading: { icon: Loader2, color: "text-primary", label: "Uploading..." },
  analyzing: { icon: Loader2, color: "text-primary", label: "Analyzing..." },
  complete: { icon: CheckCircle, color: "text-success", label: "Complete" },
  error: { icon: XCircle, color: "text-destructive", label: "Failed" },
};

const resultConfig = {
  approved: { icon: CheckCircle, color: "text-success", label: "Auto-approved" },
  pending_review: { icon: Clock, color: "text-warning", label: "Pending review" },
  rejected: { icon: XCircle, color: "text-destructive", label: "Rejected" },
};

export function ImportUploader({ onUpload, uploading, uploadProgress, onClearProgress }: ImportUploaderProps) {
  const [selectedCreator, setSelectedCreator] = useState<string>("");
  const { creators } = useCreators();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      await onUpload(acceptedFiles, selectedCreator || undefined);
    }
  }, [onUpload, selectedCreator]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    disabled: uploading,
    multiple: true,
  });

  const hasProgress = uploadProgress.length > 0;

  return (
    <div className="space-y-4">
      {/* Creator Selection */}
      <div className="space-y-2">
        <Label htmlFor="creator-select">Link to Creator (Optional)</Label>
        <Select value={selectedCreator} onValueChange={(val) => setSelectedCreator(val === "none" ? "" : val)}>
          <SelectTrigger id="creator-select" className="w-full md:w-80">
            <SelectValue placeholder="Select a creator to link..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No creator (general import)</SelectItem>
            {creators.map((creator) => (
              <SelectItem key={creator.id} value={creator.id}>
                {creator.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Linking to a creator allows auto-import of earnings data
        </p>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          isDragActive && "border-primary bg-primary/10",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {isDragActive ? (
            <>
              <div className="p-4 rounded-full bg-primary/10">
                <Image className="h-8 w-8 text-primary" />
              </div>
              <p className="font-medium text-primary">Drop your screenshots here...</p>
            </>
          ) : (
            <>
              <div className="p-4 rounded-full bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Drag & drop screenshots here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse • PNG, JPG, WEBP supported • Multiple files allowed
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {hasProgress && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Upload Progress</Label>
            {!uploading && (
              <Button variant="ghost" size="sm" onClick={onClearProgress}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadProgress.map((item) => {
              const status = statusConfig[item.status];
              const result = item.result ? resultConfig[item.result] : null;
              const StatusIcon = status.icon;
              const isAnimating = item.status === "uploading" || item.status === "analyzing";

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <StatusIcon
                    className={cn("h-5 w-5 shrink-0", status.color, isAnimating && "animate-spin")}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={item.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-8">{item.progress}%</span>
                    </div>
                    {item.status === "complete" && result && (
                      <div className="flex items-center gap-1 mt-1">
                        <result.icon className={cn("h-3 w-3", result.color)} />
                        <span className={cn("text-xs", result.color)}>{result.label}</span>
                      </div>
                    )}
                    {item.status === "error" && item.message && (
                      <p className="text-xs text-destructive mt-1">{item.message}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-muted/30 rounded-lg p-4 text-sm">
        <p className="font-medium mb-2">Supported Screenshots:</p>
        <ul className="text-muted-foreground space-y-1">
          <li>• OnlyFans statements & analytics</li>
          <li>• Fansly earnings reports</li>
          <li>• Subscriber counts & message stats</li>
          <li>• Tips & PPV sales summaries</li>
        </ul>
      </div>
    </div>
  );
}
