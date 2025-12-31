import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, FolderPlus, Folder, File, Download, Trash2, ChevronRight, ArrowLeft, Image, Video, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ContentFolder {
  id: string;
  name: string;
  parent_id: string | null;
  creator_id: string;
}

interface ContentFile {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  folder_id: string | null;
  creator_id: string | null;
  content_type?: string;
}

type ContentCategory = "general" | "primary_platform" | "social";

const contentTypeColors: Record<ContentCategory, string> = {
  general: "bg-muted text-muted-foreground",
  primary_platform: "bg-pink-500/20 text-pink-400",
  social: "bg-blue-500/20 text-blue-400",
};

const contentTypeLabels: Record<ContentCategory, string> = {
  general: "General",
  primary_platform: "Primary Platform",
  social: "Social",
};

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "complete" | "error";
}

interface CreatorContentVaultProps {
  creatorId: string;
}

export function CreatorContentVault({ creatorId }: CreatorContentVaultProps) {
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<ContentFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<ContentFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<ContentCategory>("general");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchContent = useCallback(async () => {
    // Fetch folders
    let folderQuery = supabase
      .from("content_folders")
      .select("*")
      .eq("creator_id", creatorId);
    
    if (currentFolder) {
      folderQuery = folderQuery.eq("parent_id", currentFolder);
    } else {
      folderQuery = folderQuery.is("parent_id", null);
    }

    const { data: folderData } = await folderQuery;
    if (folderData) setFolders(folderData);

    // Fetch files
    let fileQuery = supabase
      .from("content_files")
      .select("*")
      .eq("creator_id", creatorId);
    
    if (currentFolder) {
      fileQuery = fileQuery.eq("folder_id", currentFolder);
    } else {
      fileQuery = fileQuery.is("folder_id", null);
    }

    const { data: fileData } = await fileQuery;
    if (fileData) setFiles(fileData as ContentFile[]);
  }, [creatorId, currentFolder]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    const { error } = await supabase
      .from("content_folders")
      .insert({
        name: newFolderName,
        creator_id: creatorId,
        parent_id: currentFolder,
      });

    if (error) {
      toast.error("Failed to create folder");
    } else {
      toast.success("Folder created");
      setNewFolderName("");
      setIsCreateFolderOpen(false);
      fetchContent();
    }
  };

  const navigateToFolder = async (folder: ContentFolder) => {
    setFolderPath([...folderPath, folder]);
    setCurrentFolder(folder.id);
  };

  const navigateBack = () => {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    setCurrentFolder(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
  };

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      uploadFiles(droppedFiles);
    }
  }, [creatorId, currentFolder]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      uploadFiles(Array.from(selectedFiles));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFiles = async (fileList: File[]) => {
    setUploading(true);
    setUploadProgress(fileList.map(f => ({ fileName: f.name, progress: 0, status: "uploading" })));

    for (const file of fileList) {
      try {
        const filePath = `${creatorId}/${Date.now()}_${file.name}`;

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => prev.map(p => 
            p.fileName === file.name && p.progress < 90 
              ? { ...p, progress: p.progress + 15 } 
              : p
          ));
        }, 150);

        const { error: uploadError } = await supabase.storage
          .from('content-vault')
          .upload(filePath, file);

        clearInterval(progressInterval);

        if (uploadError) {
          setUploadProgress(prev => prev.map(p => 
            p.fileName === file.name ? { ...p, status: "error" } : p
          ));
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { error: dbError } = await supabase
          .from('content_files')
          .insert({
            name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            folder_id: currentFolder,
            creator_id: creatorId,
            content_type: selectedContentType,
          });

        if (dbError) {
          setUploadProgress(prev => prev.map(p => 
            p.fileName === file.name ? { ...p, status: "error" } : p
          ));
          toast.error(`Failed to save ${file.name}`);
        } else {
          setUploadProgress(prev => prev.map(p => 
            p.fileName === file.name ? { ...p, progress: 100, status: "complete" } : p
          ));
        }
      } catch (error) {
        setUploadProgress(prev => prev.map(p => 
          p.fileName === file.name ? { ...p, status: "error" } : p
        ));
      }
    }

    setUploading(false);
    toast.success("Upload complete");
    fetchContent();

    // Clear progress after delay
    setTimeout(() => setUploadProgress([]), 3000);
  };

  const downloadFile = async (file: ContentFile) => {
    const { data, error } = await supabase.storage
      .from('content-vault')
      .download(file.file_path);

    if (error) {
      toast.error("Failed to download file");
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteFile = async (file: ContentFile) => {
    const { error: storageError } = await supabase.storage
      .from('content-vault')
      .remove([file.file_path]);

    if (storageError) {
      toast.error("Failed to delete file from storage");
      return;
    }

    const { error: dbError } = await supabase
      .from('content_files')
      .delete()
      .eq('id', file.id);

    if (dbError) {
      toast.error("Failed to delete file record");
    } else {
      toast.success("File deleted");
      fetchContent();
    }
  };

  const deleteFolder = async (folder: ContentFolder) => {
    const { error } = await supabase
      .from('content_folders')
      .delete()
      .eq('id', folder.id);

    if (error) {
      toast.error("Failed to delete folder");
    } else {
      toast.success("Folder deleted");
      fetchContent();
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-8 w-8 text-primary" />;
    if (fileType.startsWith('video/')) return <Video className="h-8 w-8 text-primary" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from('content-vault').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getUploadIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["mp4", "mov", "avi", "webm"].includes(ext || "")) return Video;
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return Image;
    return File;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {currentFolder && (
            <Button variant="ghost" size="sm" onClick={navigateBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="cursor-pointer hover:text-foreground" onClick={() => {
              setCurrentFolder(null);
              setFolderPath([]);
            }}>
              Root
            </span>
            {folderPath.map((folder) => (
              <span key={folder.id} className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="cursor-pointer hover:text-foreground">{folder.name}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Content Type Selector */}
          <Select
            value={selectedContentType}
            onValueChange={(v: ContentCategory) => setSelectedContentType(v)}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="primary_platform">Primary Platform</SelectItem>
              <SelectItem value="social">Social</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <Button onClick={createFolder} className="w-full">Create Folder</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={handleFileInputChange}
            accept="video/*,image/*,.pdf,.doc,.docx,.zip"
          />
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all text-center",
          isDragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          uploading && "pointer-events-none opacity-50"
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
            isDragging ? "bg-primary/20" : "bg-muted"
          )}>
            {uploading ? (
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            ) : (
              <Upload className={cn("h-7 w-7", isDragging ? "text-primary" : "text-muted-foreground")} />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click Upload button • Videos, Images, Documents
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((item, index) => {
            const FileIcon = getUploadIcon(item.fileName);
            return (
              <div key={index} className="p-3 rounded-lg border border-border bg-card flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  item.status === "complete" ? "bg-green-500/20" : item.status === "error" ? "bg-destructive/20" : "bg-primary/20"
                )}>
                  {item.status === "complete" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : item.status === "error" ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.fileName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={item.progress} className={cn("h-1.5 flex-1", item.status === "error" && "[&>div]:bg-destructive")} />
                    <span className="text-xs text-muted-foreground w-10 text-right">{item.progress}%</span>
                  </div>
                </div>
                {item.status === "uploading" && <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="group relative p-4 rounded-lg border border-border bg-card hover:border-primary/50 cursor-pointer transition-colors"
            onClick={() => navigateToFolder(folder)}
          >
            <div className="flex flex-col items-center gap-2">
              <Folder className="h-12 w-12 text-primary" />
              <span className="text-sm text-foreground text-center truncate w-full">{folder.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                deleteFolder(folder);
              }}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
        {files.map((file) => (
          <div
            key={file.id}
            className="group relative p-4 rounded-lg border border-border bg-card hover:border-primary/50 cursor-pointer transition-colors"
            onClick={() => setPreviewFile(file)}
          >
            <div className="flex flex-col items-center gap-2">
              {getFileIcon(file.file_type)}
              <span className="text-sm text-foreground text-center truncate w-full">{file.name}</span>
              {file.content_type && file.content_type !== "general" && (
                <Badge className={cn("text-[10px] h-4", contentTypeColors[file.content_type as ContentCategory] || contentTypeColors.general)}>
                  {contentTypeLabels[file.content_type as ContentCategory] || file.content_type}
                </Badge>
              )}
            </div>
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadFile(file);
                }}
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFile(file);
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {folders.length === 0 && files.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No content yet. Create a folder or upload files.</p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="flex items-center justify-center">
              {previewFile.file_type.startsWith('image/') ? (
                <img
                  src={getFileUrl(previewFile.file_path)}
                  alt={previewFile.name}
                  className="max-h-[70vh] object-contain"
                />
              ) : previewFile.file_type.startsWith('video/') ? (
                <video
                  src={getFileUrl(previewFile.file_path)}
                  controls
                  className="max-h-[70vh]"
                />
              ) : (
                <div className="text-center py-8">
                  <File className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Preview not available</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
