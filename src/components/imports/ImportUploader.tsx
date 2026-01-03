import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCreators } from "@/hooks/useCreators";

interface ImportUploaderProps {
  onUpload: (file: File, creatorId?: string) => Promise<any>;
  uploading: boolean;
}

export function ImportUploader({ onUpload, uploading }: ImportUploaderProps) {
  const [selectedCreator, setSelectedCreator] = useState<string>("");
  const { creators } = useCreators();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await onUpload(file, selectedCreator || undefined);
    }
  }, [onUpload, selectedCreator]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      {/* Creator Selection */}
      <div className="space-y-2">
        <Label htmlFor="creator-select">Link to Creator (Optional)</Label>
        <Select value={selectedCreator} onValueChange={setSelectedCreator}>
          <SelectTrigger id="creator-select" className="w-full md:w-80">
            <SelectValue placeholder="Select a creator to link..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No creator (general import)</SelectItem>
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
          {uploading ? (
            <>
              <div className="p-4 rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <p className="font-medium">Uploading & Analyzing...</p>
                <p className="text-sm text-muted-foreground">AI is extracting data from your screenshot</p>
              </div>
            </>
          ) : isDragActive ? (
            <>
              <div className="p-4 rounded-full bg-primary/10">
                <Image className="h-8 w-8 text-primary" />
              </div>
              <p className="font-medium text-primary">Drop your screenshot here...</p>
            </>
          ) : (
            <>
              <div className="p-4 rounded-full bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Drag & drop screenshots here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse • PNG, JPG, WEBP supported
                </p>
              </div>
            </>
          )}
        </div>
      </div>

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
