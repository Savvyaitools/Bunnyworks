import { useState, useRef } from "react";
import { Search, FolderOpen, Image, Video, FileText, Download, Eye, MoreVertical, Grid, List, Trash2, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useContentFiles, ContentFile } from "@/hooks/useContentFiles";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDropZone } from "@/components/portal/FileDropZone";

type ContentType = "Video" | "Image" | "Document";

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

function isImageFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext || "");
}

export default function PortalContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ContentType | "All">("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const { files, loading, uploading, uploadProgress, uploadMultipleFiles, deleteFile } = useContentFiles();

  const contentTypes: (ContentType | "All")[] = ["All", "Video", "Image", "Document"];

  const filteredContent = files.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All" || item.file_type === selectedType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: files.length,
    videos: files.filter(i => i.file_type === "Video").length,
    images: files.filter(i => i.file_type === "Image").length,
    documents: files.filter(i => i.file_type === "Document").length,
  };

  const handleDownload = (file: ContentFile) => {
    if (file.url) {
      window.open(file.url, "_blank");
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Content Vault</h1>
          <p className="text-muted-foreground mt-1">Manage and organize your content files</p>
        </div>

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
            <p className="text-sm text-muted-foreground">Total Files</p>
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
            {filteredContent.map((item, index) => {
              const TypeIcon = typeIcons[item.file_type as ContentType] || FileText;
              const showThumbnail = isImageFile(item.name) && item.url;
              
              return (
                <div
                  key={item.id}
                  className="glass-card p-4 transition-all duration-200 hover:border-accent/40 hover:-translate-y-0.5 animate-fade-in"
                  style={{ animationDelay: `${200 + index * 50}ms` }}
                >
                  {/* Thumbnail or Icon */}
                  <div className="relative mb-4">
                    {showThumbnail ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                      </div>
                    ) : (
                      <div className={cn("w-full aspect-video rounded-lg flex items-center justify-center", typeColors[item.file_type as ContentType] || "bg-muted")}>
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
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleDownload(item)}>
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
            {filteredContent.map((item, index) => {
              const TypeIcon = typeIcons[item.file_type as ContentType] || FileText;
              const showThumbnail = isImageFile(item.name) && item.url;
              
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${200 + index * 50}ms` }}
                >
                  {showThumbnail ? (
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0", typeColors[item.file_type as ContentType] || "bg-muted")}>
                      <TypeIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{formatFileSize(item.file_size)} • {formatDate(item.uploaded_at)}</p>
                  </div>
                  <Badge className={cn("text-xs shrink-0", statusColors[item.status] || "badge-paused")}>
                    {item.status}
                  </Badge>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleDownload(item)}
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

        {!loading && filteredContent.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No content found. Drag and drop files above to upload!</p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
