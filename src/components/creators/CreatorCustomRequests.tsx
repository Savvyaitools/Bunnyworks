import { useState, useRef } from "react";
import { Plus, DollarSign, Calendar, Clock, CheckCircle, XCircle, MoreVertical, Loader2, Upload, Paperclip, Image, FileText, Video, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCustomRequests, CustomRequest, CustomRequestAttachment } from "@/hooks/useCustomRequests";
import { useAgency } from "@/hooks/useAgency";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreatorCustomRequestsProps {
  creatorId: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  in_progress: <Loader2 className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
};

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["mp4", "mov", "avi", "webm"].includes(ext || "")) return Video;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return Image;
  return FileText;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CreatorCustomRequests({ creatorId }: CreatorCustomRequestsProps) {
  const { requests, loading, stats, createRequest, updateRequest, deleteRequest } = useCustomRequests(creatorId);
  const { agencyId } = useAgency();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    due_date: "",
    notes: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<CustomRequestAttachment[]> => {
    if (!agencyId || selectedFiles.length === 0) return [];
    const attachments: CustomRequestAttachment[] = [];

    for (const file of selectedFiles) {
      const fileId = crypto.randomUUID();
      const ext = file.name.split(".").pop();
      const filePath = `${agencyId}/${fileId}.${ext}`;

      const { error } = await supabase.storage
        .from("custom-request-attachments")
        .upload(filePath, file);

      if (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      attachments.push({
        name: file.name,
        path: filePath,
        type: file.type,
        size: file.size,
      });
    }
    return attachments;
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) return;

    setUploading(true);
    try {
      const attachments = await uploadFiles();

      await createRequest.mutateAsync({
        creator_id: creatorId,
        title: formData.title,
        description: formData.description || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        due_date: formData.due_date || undefined,
        notes: formData.notes || undefined,
        attachments,
      });

      setFormData({ title: "", description: "", price: "", due_date: "", notes: "" });
      setSelectedFiles([]);
      setIsAddOpen(false);
    } finally {
      setUploading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: CustomRequest["status"]) => {
    await updateRequest.mutateAsync({ id, status });
  };

  const handleDownloadAttachment = async (attachment: CustomRequestAttachment) => {
    const { data, error } = await supabase.storage
      .from("custom-request-attachments")
      .createSignedUrl(attachment.path, 3600);

    if (error || !data?.signedUrl) {
      toast.error("Failed to get download link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Custom Requests</h3>
          <p className="text-sm text-muted-foreground">
            Track custom content requests and their status
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setSelectedFiles([]);
            setFormData({ title: "", description: "", price: "", due_date: "", notes: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Request Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Price ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="[color-scheme:dark]"
                  />
                </div>
              </div>
              <Textarea
                placeholder="Internal Notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />

              {/* File Upload Section */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Attachments</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-accent/50 hover:bg-muted/30 transition-all"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFilesSelected}
                    className="hidden"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.zip"
                  />
                  <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm text-muted-foreground">
                    Click to add images or documents
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedFiles.map((file, index) => {
                      const FileIcon = getFileIcon(file.name);
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border"
                        >
                          <FileIcon className="h-4 w-4 text-accent shrink-0" />
                          <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button 
                onClick={handleCreate} 
                className="w-full"
                disabled={createRequest.isPending || uploading}
              >
                {uploading ? "Uploading files..." : createRequest.isPending ? "Creating..." : "Create Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No custom requests yet.</p>
          <p className="text-sm mt-1">Create a request to track custom content orders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const attachments = ((request as any).attachments || []) as CustomRequestAttachment[];
            return (
              <Card key={request.id} className="glass-card">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground">{request.title}</h4>
                        <Badge className={cn("text-xs border", statusStyles[request.status])}>
                          <span className="mr-1">{statusIcons[request.status]}</span>
                          {request.status.replace("_", " ")}
                        </Badge>
                      </div>
                      {request.description && (
                        <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{request.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {request.price !== null && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(request.price)}
                          </span>
                        )}
                        {request.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {formatDate(request.due_date)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Created: {formatDate(request.created_at)}
                        </span>
                        {attachments.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            {attachments.length} file{attachments.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      {request.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic whitespace-pre-wrap">
                          Note: {request.notes}
                        </p>
                      )}

                      {/* Attachments display */}
                      {attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {attachments.map((att, i) => {
                            const FileIcon = getFileIcon(att.name);
                            return (
                              <button
                                key={i}
                                onClick={() => handleDownloadAttachment(att)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50 border border-border hover:border-accent/40 transition-colors text-xs"
                              >
                                <FileIcon className="h-3.5 w-3.5 text-accent" />
                                <span className="text-foreground truncate max-w-[120px]">{att.name}</span>
                                <Download className="h-3 w-3 text-muted-foreground" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {request.status === "pending" && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, "in_progress")}>
                            Start Work
                          </DropdownMenuItem>
                        )}
                        {request.status === "in_progress" && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, "completed")}>
                            Mark Complete
                          </DropdownMenuItem>
                        )}
                        {request.status !== "cancelled" && request.status !== "completed" && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(request.id, "cancelled")}
                            className="text-destructive"
                          >
                            Cancel
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => deleteRequest.mutate(request.id)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
