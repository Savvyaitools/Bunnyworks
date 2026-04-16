import { useState, useEffect, useCallback, useRef } from "react";
import { Calendar, X, Upload, Image, Video, Download, Trash2, FileUp, Heart, Sparkles, MessageCircle, MessageSquare, Instagram, Music, Twitter, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { useContentPlanMedia, ContentReferenceMedia } from "@/hooks/useContentPlanMedia";
import { useAgency } from "@/hooks/useAgency";
import { KanbanBoard, BOARD_COLUMNS, type KanbanItem } from "@/components/kanban/KanbanBoard";
import { LinkifyText } from "@/components/shared/LinkifyText";

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

interface CreatorContentPlansProps {
  creatorId: string;
}

const PLATFORM_PLATFORMS = ["OnlyFans", "Fansly"];
const SOCIAL_PLATFORMS = ["Instagram", "TikTok", "Twitter", "YouTube", "Reddit"];

const getContentCategory = (platform: string): "platform" | "social" => {
  return PLATFORM_PLATFORMS.includes(platform) ? "platform" : "social";
};

export function CreatorContentPlans({ creatorId }: CreatorContentPlansProps) {
  const { agencyId } = useAgency();
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addToColumn, setAddToColumn] = useState<string>("to_do");
  const [selectedPlan, setSelectedPlan] = useState<ContentPlan | null>(null);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ContentPlan | null>(null);
  const [activeTab, setActiveTab] = useState<"platform" | "social">("platform");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadMedia, deleteMedia, updatePlanMedia } = useContentPlanMedia();
  const [pendingMedia, setPendingMedia] = useState<ContentReferenceMedia[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_date: "",
    platform: "",
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    scheduled_date: "",
    platform: "",
  });

  const fetchPlans = useCallback(async () => {
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
  }, [creatorId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const createPlan = async () => {
    if (!formData.title.trim() || !agencyId) return;

    const contentCategory = formData.platform ? getContentCategory(formData.platform) : "platform";
    const columnItems = plans.filter(p => p.board_column === addToColumn);

    const { error } = await supabase
      .from("content_plans")
      .insert([{
        title: formData.title,
        description: formData.description || null,
        scheduled_date: formData.scheduled_date || null,
        platform: formData.platform || null,
        creator_id: creatorId,
        agency_id: agencyId,
        status: "planned",
        reference_media: JSON.parse(JSON.stringify(pendingMedia)),
        content_category: contentCategory,
        board_column: addToColumn,
        board_position: columnItems.length,
      }]);

    if (error) {
      toast.error("Failed to create content plan");
    } else {
      toast.success("Content plan created");
      setFormData({ title: "", description: "", scheduled_date: "", platform: "" });
      setPendingMedia([]);
      setIsAddOpen(false);
      fetchPlans();
    }
  };

  const updatePlan = async () => {
    if (!editingPlan || !editFormData.title.trim()) return;

    const contentCategory = editFormData.platform ? getContentCategory(editFormData.platform) : undefined;

    const { error } = await supabase
      .from("content_plans")
      .update({
        title: editFormData.title,
        description: editFormData.description || null,
        scheduled_date: editFormData.scheduled_date || null,
        platform: editFormData.platform || null,
        ...(contentCategory ? { content_category: contentCategory } : {}),
      })
      .eq("id", editingPlan.id);

    if (error) {
      toast.error("Failed to update content plan");
    } else {
      toast.success("Content plan updated");
      setIsEditOpen(false);
      setEditingPlan(null);
      fetchPlans();
    }
  };

  const handleEditCard = (item: KanbanItem) => {
    const plan = plans.find(p => p.id === item.id);
    if (!plan) return;
    setEditingPlan(plan);
    setEditFormData({
      title: plan.title,
      description: plan.description || "",
      scheduled_date: plan.scheduled_date || "",
      platform: plan.platform || "",
    });
    setIsEditOpen(true);
  };

  const handleCreateFormFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const tempPlanId = `temp-${Date.now()}`;
    for (const file of files) {
      const mediaItem = await uploadMedia(file, creatorId, tempPlanId);
      if (mediaItem) setPendingMedia(prev => [...prev, mediaItem]);
    }
    if (createFileInputRef.current) createFileInputRef.current.value = "";
  };

  const removePendingMedia = async (mediaItem: ContentReferenceMedia) => {
    await deleteMedia(mediaItem.url);
    setPendingMedia(prev => prev.filter(m => m.id !== mediaItem.id));
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

  const deletePlan = async (id: string) => {
    const { error } = await supabase
      .from("content_plans")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete plan");
    } else {
      toast.success("Plan deleted");
      fetchPlans();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedPlan) return;
    const files = Array.from(e.target.files);
    const existingMedia = selectedPlan.reference_media || [];
    const newMedia: ContentReferenceMedia[] = [...existingMedia];
    for (const file of files) {
      const mediaItem = await uploadMedia(file, creatorId, selectedPlan.id);
      if (mediaItem) newMedia.push(mediaItem);
    }
    await updatePlanMedia(selectedPlan.id, newMedia);
    fetchPlans();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveMedia = async (mediaItem: ContentReferenceMedia) => {
    if (!selectedPlan) return;
    const success = await deleteMedia(mediaItem.url);
    if (success) {
      const updatedMedia = (selectedPlan.reference_media || []).filter(m => m.id !== mediaItem.id);
      await updatePlanMedia(selectedPlan.id, updatedMedia);
      fetchPlans();
    }
  };

  const openMediaDialog = (plan: ContentPlan) => {
    setSelectedPlan(plan);
    setIsMediaDialogOpen(true);
  };

  const openDetailDialog = (plan: ContentPlan) => {
    setSelectedPlan(plan);
    setIsDetailOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const platformPlans = plans.filter(p =>
    p.content_category === "platform" ||
    (!p.content_category && PLATFORM_PLATFORMS.includes(p.platform || ''))
  );
  const socialPlans = plans.filter(p =>
    p.content_category === "social" ||
    (!p.content_category && SOCIAL_PLATFORMS.includes(p.platform || ''))
  );

  const handleAddCard = (column: string) => {
    setAddToColumn(column);
    setIsAddOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Add Plan Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Card to "{BOARD_COLUMNS.find(c => c.id === addToColumn)?.title}"
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="[color-scheme:dark]"
              />
              <Select
                value={formData.platform}
                onValueChange={(v) => setFormData({ ...formData, platform: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OnlyFans"><span className="flex items-center gap-2"><Heart className="h-4 w-4 text-blue-400" />OnlyFans</span></SelectItem>
                  <SelectItem value="Fansly"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-400" />Fansly</span></SelectItem>
                  <SelectItem value="Reddit"><span className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-orange-500" />Reddit</span></SelectItem>
                  <SelectItem value="Instagram"><span className="flex items-center gap-2"><Instagram className="h-4 w-4 text-pink-500" />Instagram</span></SelectItem>
                  <SelectItem value="TikTok"><span className="flex items-center gap-2"><Music className="h-4 w-4 text-white" />TikTok</span></SelectItem>
                  <SelectItem value="Twitter"><span className="flex items-center gap-2"><Twitter className="h-4 w-4 text-blue-400" />Twitter</span></SelectItem>
                  <SelectItem value="YouTube"><span className="flex items-center gap-2"><Youtube className="h-4 w-4 text-red-500" />YouTube</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createPlan} className="w-full">Create Card</Button>

            {/* Media Upload Section */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-3">Reference Media (Optional)</p>
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => createFileInputRef.current?.click()}
              >
                <input ref={createFileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleCreateFormFileUpload} />
                <FileUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Click to upload images/videos"}</p>
              </div>
              {pendingMedia.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {pendingMedia.map((media) => (
                    <div key={media.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted/50">
                      {media.type === "image" ? (
                        <img src={media.url} alt={media.name} className="w-full h-16 object-cover" />
                      ) : (
                        <div className="w-full h-16 flex items-center justify-center bg-muted"><Video className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); removePendingMedia(media); }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 hover:bg-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={editFormData.scheduled_date}
                onChange={(e) => setEditFormData({ ...editFormData, scheduled_date: e.target.value })}
                className="[color-scheme:dark]"
              />
              <Select
                value={editFormData.platform}
                onValueChange={(v) => setEditFormData({ ...editFormData, platform: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OnlyFans"><span className="flex items-center gap-2"><Heart className="h-4 w-4 text-blue-400" />OnlyFans</span></SelectItem>
                  <SelectItem value="Fansly"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-400" />Fansly</span></SelectItem>
                  <SelectItem value="Reddit"><span className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-orange-500" />Reddit</span></SelectItem>
                  <SelectItem value="Instagram"><span className="flex items-center gap-2"><Instagram className="h-4 w-4 text-pink-500" />Instagram</span></SelectItem>
                  <SelectItem value="TikTok"><span className="flex items-center gap-2"><Music className="h-4 w-4 text-white" />TikTok</span></SelectItem>
                  <SelectItem value="Twitter"><span className="flex items-center gap-2"><Twitter className="h-4 w-4 text-blue-400" />Twitter</span></SelectItem>
                  <SelectItem value="YouTube"><span className="flex items-center gap-2"><Youtube className="h-4 w-4 text-red-500" />YouTube</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={updatePlan} className="flex-1">Save Changes</Button>
              <Button variant="outline" onClick={() => {
                if (editingPlan) openMediaDialog(editingPlan);
                setIsEditOpen(false);
              }}>
                <Image className="h-4 w-4 mr-2" />
                Media
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Dialog */}
      <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reference Media - {selectedPlan?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileUpload} />
              <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click or drag to upload images/videos"}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(selectedPlan?.reference_media || []).map((media) => (
                <div key={media.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted/50">
                  {media.type === "image" ? (
                    <img src={media.url} alt={media.name} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-muted"><Video className="h-8 w-8 text-muted-foreground" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a href={media.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/20 hover:bg-white/30">
                      <Download className="h-4 w-4 text-white" />
                    </a>
                    <button onClick={() => handleRemoveMedia(media)} className="p-2 rounded-full bg-destructive/80 hover:bg-destructive">
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-foreground truncate">{media.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(media.size)}</p>
                  </div>
                </div>
              ))}
            </div>
            {(selectedPlan?.reference_media?.length || 0) === 0 && (
              <p className="text-center text-muted-foreground py-4">No reference media uploaded yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
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
                <Badge variant="secondary" className="capitalize">
                  {selectedPlan.board_column.replace("_", " ")}
                </Badge>
              </div>

              {selectedPlan.description && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Description</p>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap text-justify">
                    <LinkifyText text={selectedPlan.description} />
                  </div>
                </div>
              )}

              {(selectedPlan.reference_media?.length || 0) > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    Reference Media ({selectedPlan.reference_media?.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedPlan.reference_media?.map((media) => (
                      <div key={media.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted/50">
                        {media.type === "image" ? (
                          <img src={media.url} alt={media.name} className="w-full h-24 object-cover" crossOrigin="anonymous" />
                        ) : (
                          <div className="w-full h-24 flex items-center justify-center bg-muted">
                            <Video className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a href={media.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/20 hover:bg-white/30">
                            <Download className="h-4 w-4 text-white" />
                          </a>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate px-1.5 py-1">{media.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPlan.creator_notes && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Creator Notes
                  </p>
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border whitespace-pre-wrap text-justify">
                    <LinkifyText text={selectedPlan.creator_notes} />
                  </div>
                </div>
              )}

              {!selectedPlan.description && !selectedPlan.creator_notes && (selectedPlan.reference_media?.length || 0) === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No additional details for this card.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            onEditCard={handleEditCard}
            onAddCard={handleAddCard}
            onDeleteCard={deletePlan}
          />
        </TabsContent>
        <TabsContent value="social">
          <KanbanBoard
            items={socialPlans as unknown as KanbanItem[]}
            onMoveCard={handleMoveCard}
            onCardClick={(item) => openDetailDialog(item as unknown as ContentPlan)}
            onEditCard={handleEditCard}
            onAddCard={handleAddCard}
            onDeleteCard={deletePlan}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
