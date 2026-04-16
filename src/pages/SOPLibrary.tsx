import { useState, useRef } from "react";
import { Search, Plus, FileText, Download, Trash2, FolderOpen, Upload, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useSOPDocuments } from "@/hooks/useSOPDocuments";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";

const categoryColors: Record<string, string> = {
  Content: "bg-primary/20 text-primary border-primary/30",
  Chatting: "bg-accent/20 text-accent border-accent/30",
  Onboarding: "bg-success/20 text-success border-success/30",
  Compliance: "bg-destructive/20 text-destructive border-destructive/30",
  Finance: "bg-warning/20 text-warning border-warning/30",
  General: "bg-muted text-muted-foreground border-border",
};

const availableRoles = ["Admin", "Manager", "VA", "Chatter"];
const categories = ["General", "Content", "Chatting", "Onboarding", "Compliance", "Finance"];

export default function SOPLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "All">("All");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "General",
    content: "",
    roles: [] as string[],
  });

  const { documents, loading, createDocument, deleteDocument, uploadFile } = useSOPDocuments();

  const allCategories = ["All", ...categories];

  const filteredSOPs = documents.filter((sop) => {
    const matchesSearch = sop.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || sop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    setUploading(true);
    try {
      let filePath = null;
      let fileType = null;

      if (selectedFile) {
        filePath = await uploadFile(selectedFile);
        fileType = selectedFile.type;
      }

      await createDocument({
        title: formData.title,
        category: formData.category,
        content: formData.content || null,
        file_path: filePath,
        file_type: fileType,
        roles: formData.roles,
      });

      setFormData({ title: "", category: "General", content: "", roles: [] });
      setSelectedFile(null);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error creating document:", error);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">SOP Library</h1>
            <p className="text-sm text-muted-foreground mt-1">Standard operating procedures</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Document title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Access Roles</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableRoles.map((role) => (
                      <label
                        key={role}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-colors",
                          formData.roles.includes(role)
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        <Checkbox
                          checked={formData.roles.includes(role)}
                          onCheckedChange={() => handleRoleToggle(role)}
                        />
                        <span className="text-sm">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content / Description</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter document content or description..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload File (Optional)</Label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      selectedFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{selectedFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload a file (PDF, DOC, etc.)
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.md"
                  />
                </div>

                <Button type="submit" className="w-full bg-gradient-primary" disabled={uploading}>
                  {uploading ? "Uploading..." : "Add Document"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary input-glow"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {allCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  selectedCategory === category 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* SOP Table */}
        <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: "150ms" }}>
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No documents yet</p>
              <p className="text-sm text-muted-foreground/70">Add your first SOP document to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Document</TableHead>
                  <TableHead className="text-muted-foreground">Category</TableHead>
                  <TableHead className="text-muted-foreground">Access</TableHead>
                  <TableHead className="text-muted-foreground">Last Updated</TableHead>
                  <TableHead className="text-muted-foreground w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSOPs.map((sop, index) => (
                  <TableRow 
                    key={sop.id} 
                    className="table-row-hover border-border animate-fade-in"
                    style={{ animationDelay: `${200 + index * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">{sop.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border", categoryColors[sop.category] || categoryColors.General)}>
                        {sop.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {sop.roles.length > 0 ? (
                          sop.roles.map((role) => (
                            <Badge key={role} variant="outline" className="text-xs border-border text-muted-foreground">
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">All roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(sop.updated_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {sop.file_path && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteDocument(sop.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {!loading && filteredSOPs.length === 0 && documents.length > 0 && (
          <div className="text-center py-12 animate-fade-in">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents found matching your criteria.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
