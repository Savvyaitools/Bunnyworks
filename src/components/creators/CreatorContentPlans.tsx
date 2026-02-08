import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Calendar, X, Upload, Image, Video, Download, Trash2, FileUp, Heart, Sparkles, MessageCircle, Instagram, Music, Twitter, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useContentPlanMedia, ContentReferenceMedia } from "@/hooks/useContentPlanMedia";
import { useAgency } from "@/hooks/useAgency";

interface ContentPlan {
  id: string;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  platform: string | null;
  creator_id: string;
  reference_media: ContentReferenceMedia[] | null;
  content_category: "platform" | "social" | null;
}

interface CreatorContentPlansProps {
  creatorId: string;
}

const statusStyles: Record<string, string> = {
  planned: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const PLATFORM_PLATFORMS = ["OnlyFans", "Fansly"];
const SOCIAL_PLATFORMS = ["Instagram", "TikTok", "Twitter", "YouTube", "Reddit"];

const getContentCategory = (platform: string): "platform" | "social" => {
  return PLATFORM_PLATFORMS.includes(platform) ? "platform" : "social";
};

export function CreatorContentPlans({ creatorId }: CreatorContentPlansProps) {
  const { agencyId } = useAgency();
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ContentPlan | null>(null);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
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

  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase
      .from("content_plans")
      .select("*")
      .eq("creator_id", creatorId)
      .order("scheduled_date", { ascending: true });

    if (data) {
      // Parse reference_media from JSON
      const parsed = data.map(plan => {
        let media: ContentReferenceMedia[] = [];
        if (Array.isArray(plan.reference_media)) {
          media = plan.reference_media as unknown as ContentReferenceMedia[];
        }
        return {
          ...plan,
          reference_media: media,
        };
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

  const handleCreateFormFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const tempPlanId = `temp-${Date.now()}`;

    for (const file of files) {
      const mediaItem = await uploadMedia(file, creatorId, tempPlanId);
      if (mediaItem) {
        setPendingMedia(prev => [...prev, mediaItem]);
      }
    }

    if (createFileInputRef.current) {
      createFileInputRef.current.value = "";
    }
  };

  const removePendingMedia = async (mediaItem: ContentReferenceMedia) => {
    await deleteMedia(mediaItem.url);
    setPendingMedia(prev => prev.filter(m => m.id !== mediaItem.id));
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("content_plans")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
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
      if (mediaItem) {
        newMedia.push(mediaItem);
      }
    }

    await updatePlanMedia(selectedPlan.id, newMedia);
    fetchPlans();
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter plans by category
  const platformPlans = plans.filter(p => 
    p.content_category === "platform" || 
    (!p.content_category && PLATFORM_PLATFORMS.includes(p.platform || ''))
  );
  const socialPlans = plans.filter(p => 
    p.content_category === "social" || 
    (!p.content_category && SOCIAL_PLATFORMS.includes(p.platform || ''))
  );

  const currentPlans = activeTab === "platform" ? platformPlans : socialPlans;

  const renderPlansList = (plansList: ContentPlan[]) => (
    <div className="space-y-3">
      {plansList.map((plan) => (
        <div
          key={plan.id}
          className="p-4 rounded-lg border border-border bg-card"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-foreground">{plan.title}</h4>
                <Badge className={cn("text-xs", statusStyles[plan.status])}>
                  {plan.status.replace("_", " ")}
                </Badge>
              </div>
              {plan.description && (
                <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{plan.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {plan.scheduled_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(plan.scheduled_date).toLocaleDateString()}
                  </span>
                )}
                {plan.platform && (
                  <span>{plan.platform}</span>
                )}
                {(plan.reference_media?.length || 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    {plan.reference_media?.length} reference(s)
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => openMediaDialog(plan)}
              >
                <Upload className="h-3 w-3 mr-1" />
                Media
              </Button>
              <Select
                value={plan.status}
                onValueChange={(value) => updateStatus(plan.id, value)}
              >
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => deletePlan(plan.id)}
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      {plansList.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No {activeTab === "platform" ? "platform" : "social media"} content plans yet.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Content Plan</DialogTitle>
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
                    <SelectItem value="OnlyFans">
                      <span className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-blue-400" />
                        OnlyFans
                      </span>
                    </SelectItem>
                    <SelectItem value="Fansly">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-cyan-400" />
                        Fansly
                      </span>
                    </SelectItem>
                    <SelectItem value="Reddit">
                      <span className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-orange-500" />
                        Reddit
                      </span>
                    </SelectItem>
                    <SelectItem value="Instagram">
                      <span className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        Instagram
                      </span>
                    </SelectItem>
                    <SelectItem value="TikTok">
                      <span className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-white" />
                        TikTok
                      </span>
                    </SelectItem>
                    <SelectItem value="Twitter">
                      <span className="flex items-center gap-2">
                        <Twitter className="h-4 w-4 text-blue-400" />
                        Twitter
                      </span>
                    </SelectItem>
                    <SelectItem value="YouTube">
                      <span className="flex items-center gap-2">
                        <Youtube className="h-4 w-4 text-red-500" />
                        YouTube
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createPlan} className="w-full">Create Plan</Button>

              {/* Media Upload Section */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground mb-3">Reference Media (Optional)</p>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => createFileInputRef.current?.click()}
                >
                  <input
                    ref={createFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleCreateFormFileUpload}
                  />
                  <FileUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {uploading ? "Uploading..." : "Click to upload images/videos"}
                  </p>
                </div>

                {/* Pending Media Preview */}
                {pendingMedia.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {pendingMedia.map((media) => (
                      <div 
                        key={media.id} 
                        className="relative group rounded-lg overflow-hidden border border-border bg-muted/50"
                      >
                        {media.type === "image" ? (
                          <img 
                            src={media.url} 
                            alt={media.name}
                            className="w-full h-16 object-cover"
                          />
                        ) : (
                          <div className="w-full h-16 flex items-center justify-center bg-muted">
                            <Video className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removePendingMedia(media);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 hover:bg-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
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
      </div>

      {/* Media Dialog */}
      <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reference Media - {selectedPlan?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Upload Area */}
            <div 
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {uploading ? "Uploading..." : "Click or drag to upload images/videos"}
              </p>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-3 gap-3">
              {(selectedPlan?.reference_media || []).map((media) => (
                <div 
                  key={media.id} 
                  className="relative group rounded-lg overflow-hidden border border-border bg-muted/50"
                >
                  {media.type === "image" ? (
                    <img 
                      src={media.url} 
                      alt={media.name}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-muted">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a 
                      href={media.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30"
                    >
                      <Download className="h-4 w-4 text-white" />
                    </a>
                    <button 
                      onClick={() => handleRemoveMedia(media)}
                      className="p-2 rounded-full bg-destructive/80 hover:bg-destructive"
                    >
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
              <p className="text-center text-muted-foreground py-4">
                No reference media uploaded yet.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabbed Content */}
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
          {renderPlansList(platformPlans)}
        </TabsContent>
        <TabsContent value="social">
          {renderPlansList(socialPlans)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
