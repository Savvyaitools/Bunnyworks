import { useState } from "react";
import { Search, Upload, FolderOpen, Image, Video, FileText, Download, Eye, MoreVertical, Grid, List } from "lucide-react";
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

type ContentType = "Video" | "Image" | "Document";
type ContentStatus = "Approved" | "Pending Review" | "Draft";

interface ContentItem {
  id: string;
  name: string;
  type: ContentType;
  status: ContentStatus;
  size: string;
  uploadedAt: string;
  thumbnail?: string;
}

const contentItems: ContentItem[] = [
  {
    id: "1",
    name: "Weekly_Vlog_Episode_24.mp4",
    type: "Video",
    status: "Approved",
    size: "245 MB",
    uploadedAt: "Dec 20, 2024",
  },
  {
    id: "2",
    name: "Holiday_Photoshoot_Set.zip",
    type: "Image",
    status: "Pending Review",
    size: "128 MB",
    uploadedAt: "Dec 18, 2024",
  },
  {
    id: "3",
    name: "Content_Calendar_Jan2025.pdf",
    type: "Document",
    status: "Approved",
    size: "2.4 MB",
    uploadedAt: "Dec 15, 2024",
  },
  {
    id: "4",
    name: "BTS_December_Content.mp4",
    type: "Video",
    status: "Draft",
    size: "890 MB",
    uploadedAt: "Dec 22, 2024",
  },
  {
    id: "5",
    name: "Profile_Photos_2024.zip",
    type: "Image",
    status: "Approved",
    size: "56 MB",
    uploadedAt: "Dec 10, 2024",
  },
  {
    id: "6",
    name: "Collaboration_Agreement.pdf",
    type: "Document",
    status: "Approved",
    size: "1.2 MB",
    uploadedAt: "Dec 5, 2024",
  },
];

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

const statusColors: Record<ContentStatus, string> = {
  Approved: "badge-active",
  "Pending Review": "badge-onboarding",
  Draft: "badge-paused",
};

export default function PortalContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ContentType | "All">("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const contentTypes: (ContentType | "All")[] = ["All", "Video", "Image", "Document"];

  const filteredContent = contentItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: contentItems.length,
    videos: contentItems.filter(i => i.type === "Video").length,
    images: contentItems.filter(i => i.type === "Image").length,
    documents: contentItems.filter(i => i.type === "Document").length,
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Content Vault</h1>
            <p className="text-muted-foreground mt-1">Manage and organize your content files</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow-sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload Content
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: "50ms" }}>
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
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
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

        {/* Content Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContent.map((item, index) => {
              const TypeIcon = typeIcons[item.type];
              return (
                <div
                  key={item.id}
                  className="glass-card p-4 transition-all duration-200 hover:border-accent/40 hover:-translate-y-0.5 animate-fade-in"
                  style={{ animationDelay: `${150 + index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", typeColors[item.type])}>
                      <TypeIcon className="h-6 w-6" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem className="cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Download className="h-4 w-4 mr-2" /> Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-medium text-foreground truncate mb-2">{item.name}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{item.size}</span>
                    <span>{item.uploadedAt}</span>
                  </div>
                  <Badge className={cn("text-xs", statusColors[item.status])}>
                    {item.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card divide-y divide-border">
            {filteredContent.map((item, index) => {
              const TypeIcon = typeIcons[item.type];
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${150 + index * 50}ms` }}
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", typeColors[item.type])}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.size} • {item.uploadedAt}</p>
                  </div>
                  <Badge className={cn("text-xs shrink-0", statusColors[item.status])}>
                    {item.status}
                  </Badge>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredContent.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No content found matching your criteria.</p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
