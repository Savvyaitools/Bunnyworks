import { useState, useEffect, useCallback } from "react";
import { Search, FolderOpen, Image, Video, FileText, Download, Eye, MoreVertical, Grid, List, Trash2, ChevronLeft, Folder, Play } from "lucide-react";
import { PortalLayout } from "@/components/portal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDropZone } from "@/components/portal/FileDropZone";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ContentType = "Video" | "Image" | "Document";

interface ContentFolder {
  id: string;
  name: string;
  parent_id: string | null;
  creator_id: string;
  created_at: string;
}

interface ContentFile {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: string;
  uploaded_at: string;
  folder_id: string | null;
  content_type: string | null;
  signedUrl?: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "complete" | "error";
}

const typeIcons: Record<ContentType, React.ElementType> = {
  Video: Video,
  Image: Image,
  Document: FileText,
};

const typeColors: Record<ContentType, string> = {
  Video: "bg-primary/20 text-primary",
  Image: "bg-accent/20 text-accent",
  Document: "bg-warning/20 text-warning",
};

const statusColors: Record<string, string> = {
  Approved: "badge-active",
  "Pending Review": "badge-onboarding",
  Draft: "badge-paused",
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isImageFile(fileType: string): boolean {
  return fileType === "Image";
}

function isVideoFile(fileType: string): boolean {
  return fileType === "Video";
}

export default function PortalContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ContentType | "All">("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<ContentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [previewFile, setPreviewFile] = useState<ContentFile | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);

  // Fetch creator ID based on logged-in user's email
  const fetchCreatorId = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;

    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    return creator?.id || null;
  }, []);

  // Fetch folders and files for the current folder
  const fetchContent = useCallback(async () => {
    if (!creatorId) return;
    
    setLoading(true);
    try {
      // Fetch folders
      let foldersQuery = supabase
        .from("content_folders")
        .select("*")
        .eq("creator_id", creatorId)
        .order("name");

      if (currentFolderId) {
        foldersQuery = foldersQuery.eq("parent_id", currentFolderId);
      } else {
        foldersQuery = foldersQuery.is("parent_id", null);
      }

      const { data: foldersData, error: foldersError } = await foldersQuery;
      if (foldersError) throw foldersError;
      setFolders(foldersData || []);

      // Fetch files
      let filesQuery = supabase
        .from("content_files")
        .select("*")
        .eq("creator_id", creatorId)
        .order("uploaded_at", { ascending: false });

      if (currentFolderId) {
        filesQuery = filesQuery.eq("folder_id", currentFolderId);
      } else {
        filesQuery = filesQuery.is("folder_id", null);
      }

      const { data: filesData, error: filesError } = await filesQuery;
      if (filesError) throw filesError;

      // Generate signed URLs for images and videos
      const filesWithUrls = await Promise.all(
        (filesData || []).map(async (file) => {
          if (isImageFile(file.file_type) || isVideoFile(file.file_type)) {
            const { data: urlData } = await supabase.storage
              .from("content-vault")
              .createSignedUrl(file.file_path, 3600);
            return { ...file, signedUrl: urlData?.signedUrl };
          }
          return file;
        })
      );

      setFiles(filesWithUrls);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [creatorId, currentFolderId]);

  useEffect(() => {
    fetchCreatorId().then((id) => {
      setCreatorId(id);
    });
  }, [fetchCreatorId]);

  useEffect(() => {
    if (creatorId) {
      fetchContent();
    }
  }, [creatorId, fetchContent]);

  const navigateToFolder = (folder: ContentFolder) => {
    setFolderPath((prev) => [...prev, folder]);
    setCurrentFolderId(folder.id);
  };

  const navigateBack = () => {
    if (folderPath.length === 0) return;
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    setCurrentFolderId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
  };

  const navigateToRoot = () => {
    setFolderPath([]);
    setCurrentFolderId(null);
  };

  const handleDownload = async (file: ContentFile) => {
    try {
      const { data, error } = await supabase.storage
        .from("content-vault")
        .createSignedUrl(file.file_path, 60);

      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const openPreview = async (file: ContentFile) => {
    if (!file.signedUrl) {
      const { data } = await supabase.storage
        .from("content-vault")
        .createSignedUrl(file.file_path, 3600);
      file.signedUrl = data?.signedUrl;
    }
    setPreviewFile(file);
  };

  const uploadFile = async (file: File): Promise<boolean> => {
    if (!creatorId) {
      toast.error("Creator ID not found");
      return false;
    }

    const fileId = crypto.randomUUID();
    setUploadProgress((prev) => [
      ...prev,
      { fileName: file.name, progress: 0, status: "uploading" },
    ]);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${creatorId}/${fileId}.${fileExt}`;

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileName === file.name && p.progress < 90
              ? { ...p, progress: p.progress + 10 }
              : p
          )
        );
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from("content-vault")
        .upload(filePath, file);

      clearInterval(progressInterval);
      if (uploadError) throw uploadError;

      let fileType = "Document";
      if (file.type.startsWith("video/")) fileType = "Video";
      else if (file.type.startsWith("image/")) fileType = "Image";

      const { error: insertError } = await supabase.from("content_files").insert({
        name: file.name,
        file_path: filePath,
        file_type: fileType,
        file_size: file.size,
        status: "Pending Review",
        creator_id: creatorId,
        folder_id: currentFolderId,
        content_type: "general",
      });

      if (insertError) throw insertError;

      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileName === file.name ? { ...p, progress: 100, status: "complete" } : p
        )
      );

      return true;
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileName === file.name ? { ...p, status: "error" } : p
        )
      );
      toast.error(`Failed to upload ${file.name}`);
      return false;
    }
  };

  const uploadMultipleFiles = async (fileList: File[]) => {
    setUploading(true);
    setUploadProgress([]);

    const results = await Promise.all(fileList.map(uploadFile));
    const successCount = results.filter(Boolean).length;

    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded successfully`);
      await fetchContent();
    }

    setTimeout(() => setUploadProgress([]), 2000);
    setUploading(false);
  };

  const deleteFile = async (id: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("content-vault")
        .remove([filePath]);

      if (storageError) throw storageError;

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

  const contentTypes: (ContentType | "All")[] = ["All", "Video", "Image", "Document"];

  const filteredContent = files.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All" || item.file_type === selectedType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: files.length + folders.length,
    videos: files.filter((i) => i.file_type === "Video").length,
    images: files.filter((i) => i.file_type === "Image").length,
    documents: files.filter((i) => i.file_type === "Document").length,
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Content Vault</h1>
          <p className="text-muted-foreground mt-1">Manage and organize your content files</p>
        </div>

        {/* Navigation Breadcrumb */}
        {folderPath.length > 0 && (
          <div className="flex items-center gap-2 animate-fade-in">
            <Button variant="ghost" size="sm" onClick={navigateBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <button onClick={navigateToRoot} className="hover:text-foreground transition-colors">
                Root
              </button>
              {folderPath.map((folder, index) => (
                <span key={folder.id} className="flex items-center gap-1">
                  <span>/</span>
                  <button
                    onClick={() => {
                      const newPath = folderPath.slice(0, index + 1);
                      setFolderPath(newPath);
                      setCurrentFolderId(folder.id);
                    }}
                    className="hover:text-foreground transition-colors"
                  >
                    {folder.name}
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <div className="animate-fade-in" style={{ animationDelay: "50ms" }}>
          <FileDropZone
            onFilesSelected={uploadMultipleFiles}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="stat-card text-center">
            <div className="w-10 h-10 rounded-lg bg-muted mx-auto mb-2 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Items</p>
          </div>
          <div className="stat-card text-center">
            <div className="w-10 h-10 rounded-lg bg-primary/20 mx-auto mb-2 flex items-center justify-center">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">{stats.videos}</p>
            <p className="text-sm text-muted-foreground">Videos</p>
          </div>
          <div className="stat-card text-center">
            <div className="w-10 h-10 rounded-lg bg-accent/20 mx-auto mb-2 flex items-center justify-center">
              <Image className="h-5 w-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-accent">{stats.images}</p>
            <p className="text-sm text-muted-foreground">Images</p>
          </div>
          <div className="stat-card text-center">
            <div className="w-10 h-10 rounded-lg bg-warning/20 mx-auto mb-2 flex items-center justify-center">
              <FileText className="h-5 w-5 text-warning" />
            </div>
            <p className="text-2xl font-bold text-warning">{stats.documents}</p>
            <p className="text-sm text-muted-foreground">Documents</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-accent input-glow"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {contentTypes.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className={cn(
                  selectedType === type
                    ? "bg-accent text-accent-foreground"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {type}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={cn(viewMode === "grid" && "bg-muted")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={cn(viewMode === "list" && "bg-muted")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-4">
                <Skeleton className="w-full h-32 rounded-lg mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Folders */}
            {folders.map((folder, index) => (
              <div
                key={folder.id}
                className="glass-card p-4 transition-all duration-200 hover:border-accent/40 hover:-translate-y-0.5 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${200 + index * 50}ms` }}
                onClick={() => navigateToFolder(folder)}
              >
                <div className="w-full aspect-video rounded-lg bg-muted/50 flex items-center justify-center mb-4">
                  <Folder className="h-16 w-16 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground truncate">{folder.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">Folder</p>
              </div>
            ))}

            {/* Files */}
            {filteredContent.map((item, index) => {
              const TypeIcon = typeIcons[item.file_type as ContentType] || FileText;
              const showThumbnail = isImageFile(item.file_type) && item.signedUrl;
              const showVideoThumbnail = isVideoFile(item.file_type) && item.signedUrl;

              return (
                <div
                  key={item.id}
                  className="glass-card p-4 transition-all duration-200 hover:border-accent/40 hover:-translate-y-0.5 animate-fade-in"
                  style={{ animationDelay: `${200 + (folders.length + index) * 50}ms` }}
                >
                  {/* Thumbnail or Icon */}
                  <div className="relative mb-4">
                    {showThumbnail ? (
                      <div
                        className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer"
                        onClick={() => openPreview(item)}
                      >
                        <img
                          src={item.signedUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                      </div>
                    ) : showVideoThumbnail ? (
                      <div
                        className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer group"
                        onClick={() => openPreview(item)}
                      >
                        <video
                          src={item.signedUrl}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Play className="h-6 w-6 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "w-full aspect-video rounded-lg flex items-center justify-center",
                          typeColors[item.file_type as ContentType] || "bg-muted"
                        )}
                      >
                        <TypeIcon className="h-12 w-12 opacity-50" />
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm text-foreground hover:bg-background"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => openPreview(item)}>
                          <Eye className="h-4 w-4 mr-2" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleDownload(item)}>
                          <Download className="h-4 w-4 mr-2" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => deleteFile(item.id, item.file_path)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-medium text-foreground truncate mb-2">{item.name}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{formatFileSize(item.file_size)}</span>
                    <span>{formatDate(item.uploaded_at)}</span>
                  </div>
                  <Badge className={cn("text-xs", statusColors[item.status] || "badge-paused")}>
                    {item.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card divide-y divide-border">
            {/* Folders in List View */}
            {folders.map((folder, index) => (
              <div
                key={folder.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer animate-fade-in"
                style={{ animationDelay: `${200 + index * 50}ms` }}
                onClick={() => navigateToFolder(folder)}
              >
                <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <Folder className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{folder.name}</h3>
                  <p className="text-xs text-muted-foreground">Folder</p>
                </div>
              </div>
            ))}

            {/* Files in List View */}
            {filteredContent.map((item, index) => {
              const TypeIcon = typeIcons[item.file_type as ContentType] || FileText;
              const showThumbnail = isImageFile(item.file_type) && item.signedUrl;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${200 + (folders.length + index) * 50}ms` }}
                >
                  {showThumbnail ? (
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img
                        src={item.signedUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                        typeColors[item.file_type as ContentType] || "bg-muted"
                      )}
                    >
                      <TypeIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.file_size)} • {formatDate(item.uploaded_at)}
                    </p>
                  </div>
                  <Badge className={cn("text-xs shrink-0", statusColors[item.status] || "badge-paused")}>
                    {item.status}
                  </Badge>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openPreview(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleDownload(item)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteFile(item.id, item.file_path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && folders.length === 0 && filteredContent.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {currentFolderId ? "This folder is empty." : "No content found. Drag and drop files above to upload!"}
            </p>
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            {previewFile && (
              <div className="relative">
                {isImageFile(previewFile.file_type) && previewFile.signedUrl && (
                  <img
                    src={previewFile.signedUrl}
                    alt={previewFile.name}
                    className="w-full h-auto max-h-[80vh] object-contain"
                  />
                )}
                {isVideoFile(previewFile.file_type) && previewFile.signedUrl && (
                  <video
                    src={previewFile.signedUrl}
                    controls
                    autoPlay
                    className="w-full h-auto max-h-[80vh]"
                  />
                )}
                <div className="p-4 bg-background border-t">
                  <h3 className="font-medium text-foreground truncate">{previewFile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(previewFile.file_size)} • {formatDate(previewFile.uploaded_at)}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
}
