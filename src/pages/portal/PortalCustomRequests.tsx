import { useState } from "react";
import {
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Video,
  Download,
  PlayCircle,
  AlertCircle,
} from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCreatorPortal } from "@/hooks/useCreatorPortal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CustomRequestRow {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "incomplete" | "completed" | "cancelled";
  price: number | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  attachments: Array<{ name: string; path: string; type: string; size: number }> | null;
}

const statusStyles: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  incomplete: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  in_progress: <Loader2 className="h-4 w-4 animate-spin" />,
  incomplete: <AlertCircle className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
};

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return Video;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return ImageIcon;
  return FileText;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PortalCustomRequests() {
  const { creatorId, loading: creatorLoading } = useCreatorPortal();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<CustomRequestRow | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["portal-custom-requests", creatorId],
    queryFn: async () => {
      if (!creatorId) return [];
      const { data, error } = await supabase
        .from("custom_requests")
        .select("*")
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CustomRequestRow[];
    },
    enabled: !!creatorId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: CustomRequestRow["status"];
      notes?: string;
    }) => {
      const updates: Record<string, unknown> = { status };
      if (notes !== undefined) updates.notes = notes;
      const { error } = await supabase.from("custom_requests").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-custom-requests", creatorId] });
      toast.success("Request updated");
    },
    onError: () => toast.error("Failed to update request"),
  });

  const downloadAttachment = async (att: { name: string; path: string }) => {
    const { data, error } = await supabase.storage
      .from("custom-request-attachments")
      .createSignedUrl(att.path, 3600);
    if (error || !data?.signedUrl) {
      toast.error("Failed to get download link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in_progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  const loading = creatorLoading || isLoading;

  const handleReject = async () => {
    if (!selected) return;
    await updateStatus.mutateAsync({
      id: selected.id,
      status: "cancelled",
      notes: rejectNote
        ? `${selected.notes ? selected.notes + "\n\n" : ""}Rejected: ${rejectNote}`
        : selected.notes ?? undefined,
    });
    setRejectOpen(false);
    setRejectNote("");
    setSelected(null);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Custom Requests</h1>
          <p className="text-muted-foreground mt-1">
            Review fan custom requests and mark them as fulfilled or rejected.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Total</p>
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
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-success">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="glass-card p-6 text-center py-12 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No custom requests yet.</p>
            <p className="text-sm mt-1">Your agency will share fan custom requests here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const attachments = request.attachments || [];
              return (
                <Card key={request.id} className="glass-card">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-semibold text-foreground">{request.title}</h4>
                          <Badge className={cn("text-xs border", statusStyles[request.status])}>
                            <span className="mr-1">{statusIcons[request.status]}</span>
                            {request.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {request.description && (
                          <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                            {request.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
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

                        {attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {attachments.map((att, i) => {
                              const FileIcon = getFileIcon(att.name);
                              return (
                                <button
                                  key={i}
                                  onClick={() => downloadAttachment(att)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50 border border-border hover:border-accent/40 transition-colors text-xs"
                                >
                                  <FileIcon className="h-3.5 w-3.5 text-accent" />
                                  <span className="text-foreground truncate max-w-[140px]">
                                    {att.name}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {formatFileSize(att.size)}
                                  </span>
                                  <Download className="h-3 w-3 text-muted-foreground" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        {request.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateStatus.mutate({ id: request.id, status: "in_progress" })
                            }
                          >
                            <PlayCircle className="h-4 w-4 mr-1.5" />
                            Start
                          </Button>
                        )}
                        {request.status !== "completed" &&
                          request.status !== "cancelled" && (
                            <Button
                              size="sm"
                              className="bg-success/20 text-success hover:bg-success/30 border border-success/30"
                              onClick={() =>
                                updateStatus.mutate({ id: request.id, status: "completed" })
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-1.5" />
                              Mark Done
                            </Button>
                          )}
                        {request.status !== "completed" &&
                          request.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => {
                                setSelected(request);
                                setRejectOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1.5" />
                              Reject
                            </Button>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Reject Dialog */}
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Custom Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Optionally tell your agency why you're rejecting "{selected?.title}".
              </p>
              <Textarea
                placeholder="Reason for rejection (optional)"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setRejectOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleReject}
                  disabled={updateStatus.isPending}
                >
                  Confirm Reject
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
}
