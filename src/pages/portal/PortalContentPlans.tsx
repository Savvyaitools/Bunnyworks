import { useState, useEffect, useCallback } from "react";
import { Calendar, Download, Image, Video, FileText, Heart, Instagram, Save, MessageSquare } from "lucide-react";
import { PortalLayout } from "@/components/portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorPortal } from "@/hooks/useCreatorPortal";
import { ContentReferenceMedia } from "@/hooks/useContentPlanMedia";
import { KanbanBoard, BOARD_COLUMNS, type KanbanItem } from "@/components/kanban";
import { LinkifyText } from "@/components/shared/LinkifyText";
import { toast } from "sonner";

interface ContentPlan {
  id: string;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  status: string;
  platform: string | null;
  creator_id: string;
  reference_media: ContentReferenceMedia[] | null;
  content_category: "platform" | "social" | null;
  board_column: string;
  board_position: number;
  creator_notes: string | null;
}

const PLATFORM_PLATFORMS = ["OnlyFans", "Fansly"];
const SOCIAL_PLATFORMS = ["Instagram", "TikTok", "Twitter", "YouTube", "Reddit"];

export default function PortalContentPlans() {
  const { creatorId, loading: creatorLoading } = useCreatorPortal();
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ContentPlan | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"platform" | "social">("platform");
  const [editNotes, setEditNotes] = useState("");
  const [editColumn, setEditColumn] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPlans = useCallback(async () => {
    if (!creatorId) return;
    const { data } = await supabase
      .from("content_plans")
      .select("*")
      .eq("creator_id", creatorId)
      .order("board_position", { ascending: true });

    if (data) {
      const parsed = data.map(plan => {
        let media: ContentReferenceMedia[] = [];
        if (Array.isArray(plan.reference_media)) {
          media = plan.reference_media as unknown as ContentReferenceMedia[];
        }
        return { ...plan, reference_media: media };
      });
      setPlans(parsed as ContentPlan[]);
    }
    setLoading(false);
  }, [creatorId]);

  useEffect(() => {
    if (creatorId) fetchPlans();
    else if (!creatorLoading) setLoading(false);
  }, [creatorId, creatorLoading, fetchPlans]);

  const openDetailDialog = (plan: ContentPlan) => {
    setSelectedPlan(plan);
    setEditNotes(plan.creator_notes || "");
    setEditColumn(plan.board_column);
    setIsDetailOpen(true);
  };

  const handleSave = async () => {
    if (!selectedPlan) return;
    setSaving(true);

    const updates: Record<string, unknown> = {
      creator_notes: editNotes || null,
    };

    if (editColumn !== selectedPlan.board_column) {
      updates.board_column = editColumn;
      const columnItems = plans.filter(p => p.board_column === editColumn);
      updates.board_position = columnItems.length;
    }

    const { error } = await supabase
      .from("content_plans")
      .update(updates)
      .eq("id", selectedPlan.id);

    if (error) {
      toast.error("Failed to save changes");
    } else {
      toast.success("Changes saved");
      fetchPlans();
      setIsDetailOpen(false);
    }
    setSaving(false);
  };

  const handleMoveCard = async (cardId: string, newColumn: string, newPosition: number) => {
    setPlans(prev => {
      const updated = prev.map(p =>
        p.id === cardId ? { ...p, board_column: newColumn, board_position: newPosition } : p
      );
      const targetItems = updated
        .filter(p => p.board_column === newColumn && p.id !== cardId)
        .sort((a, b) => a.board_position - b.board_position);
      targetItems.splice(newPosition, 0, updated.find(p => p.id === cardId)!);
      targetItems.forEach((item, idx) => { item.board_position = idx; });
      return updated;
    });

    const { error } = await supabase
      .from("content_plans")
      .update({ board_column: newColumn, board_position: newPosition })
      .eq("id", cardId);

    if (error) {
      toast.error("Failed to move card");
      fetchPlans();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const downloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const platformPlans = plans.filter(p =>
    p.content_category === "platform" ||
    (!p.content_category && PLATFORM_PLATFORMS.includes(p.platform || ''))
  );
  const socialPlans = plans.filter(p =>
    p.content_category === "social" ||
    (!p.content_category && SOCIAL_PLATFORMS.includes(p.platform || ''))
  );

  const upcomingPlans = plans.filter(p => p.status === "planned" || p.status === "in_progress");
  const completedPlans = plans.filter(p => p.status === "completed");

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Content Plans</h1>
          <p className="text-muted-foreground mt-1">View your scheduled content, update status, and add notes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{upcomingPlans.length}</p>
            <p className="text-sm text-muted-foreground">Upcoming Plans</p>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: "50ms" }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{completedPlans.length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Image className="h-6 w-6 text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {plans.reduce((acc, p) => acc + (p.reference_media?.length || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">Reference Files</p>
          </div>
        </div>

        {/* Detail + Edit Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedPlan?.title}</DialogTitle>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedPlan.platform && (
                    <Badge variant="outline">{selectedPlan.platform}</Badge>
                  )}
                  {selectedPlan.scheduled_date && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(selectedPlan.scheduled_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {selectedPlan.description && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Description</p>
                    <div className="text-sm text-muted-foreground">
                      <LinkifyText text={selectedPlan.description} />
                    </div>
                  </div>
                )}

                {/* Reference Media */}
                {(selectedPlan.reference_media?.length || 0) > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      Reference Media ({selectedPlan.reference_media?.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {(selectedPlan.reference_media || []).map((media) => (
                        <div key={media.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted/50">
                          {media.type === "image" ? (
                            <img src={media.url} alt={media.name} className="w-full h-32 object-cover" />
                          ) : (
                            <div className="w-full h-32 flex items-center justify-center bg-muted"><Video className="h-8 w-8 text-muted-foreground" /></div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button onClick={() => downloadFile(media.url, media.name)} className="p-3 rounded-full bg-accent hover:bg-accent/80 transition-colors">
                              <Download className="h-5 w-5 text-accent-foreground" />
                            </button>
                          </div>
                          <div className="p-2">
                            <p className="text-xs text-foreground truncate">{media.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(media.size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-3">
                      <Button variant="outline" size="sm" onClick={() => {
                        selectedPlan.reference_media?.forEach(media => downloadFile(media.url, media.name));
                      }}>
                        <Download className="h-4 w-4 mr-2" />Download All
                      </Button>
                    </div>
                  </div>
                )}

                {/* Creator Editable Section */}
                <div className="border-t border-border pt-4 space-y-3">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Your Updates
                  </p>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                    <Select value={editColumn} onValueChange={setEditColumn}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOARD_COLUMNS.map((col) => (
                          <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                    <Textarea
                      placeholder="Add your notes, questions, or progress updates..."
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Kanban Board */}
        <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : plans.length === 0 ? (
            <div className="glass-card p-6 text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content plans assigned yet.</p>
              <p className="text-sm mt-1">Your agency will add content plans here.</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "platform" | "social")}>
              <TabsList className="mb-4">
                <TabsTrigger value="platform" className="gap-2">
                  <Heart className="h-4 w-4" />
                  Platform Content ({platformPlans.length})
                </TabsTrigger>
                <TabsTrigger value="social" className="gap-2">
                  <Instagram className="h-4 w-4" />
                  Social Media ({socialPlans.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="platform">
                <KanbanBoard
                  items={platformPlans as unknown as KanbanItem[]}
                  onMoveCard={handleMoveCard}
                  onCardClick={(item) => openDetailDialog(item as unknown as ContentPlan)}
                  hiddenColumns={["projects"]}
                />
              </TabsContent>
              <TabsContent value="social">
                <KanbanBoard
                  items={socialPlans as unknown as KanbanItem[]}
                  onMoveCard={handleMoveCard}
                  onCardClick={(item) => openDetailDialog(item as unknown as ContentPlan)}
                  hiddenColumns={["projects"]}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
