import { useState, useEffect, useCallback } from "react";
import { Calendar, Download, Image, Video, FileText } from "lucide-react";
import { PortalLayout } from "@/components/portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ContentReferenceMedia } from "@/hooks/useContentPlanMedia";

interface ContentPlan {
  id: string;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  status: string;
  platform: string | null;
  creator_id: string;
  reference_media: ContentReferenceMedia[] | null;
}

const statusStyles: Record<string, string> = {
  planned: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function PortalContentPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ContentPlan | null>(null);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);

  const fetchPlans = useCallback(async () => {
    if (!user) return;

    // Get creator linked to this auth user
    const { data: creators } = await supabase
      .from("creators")
      .select("id")
      .eq("email", user.email)
      .limit(1);

    if (!creators || creators.length === 0) {
      setLoading(false);
      return;
    }

    const creatorId = creators[0].id;

    const { data, error } = await supabase
      .from("content_plans")
      .select("*")
      .eq("creator_id", creatorId)
      .order("scheduled_date", { ascending: true });

    if (data) {
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
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const openMediaDialog = (plan: ContentPlan) => {
    setSelectedPlan(plan);
    setIsMediaDialogOpen(true);
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

  const upcomingPlans = plans.filter(p => p.status === "planned" || p.status === "in_progress");
  const completedPlans = plans.filter(p => p.status === "completed");

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Content Plans
          </h1>
          <p className="text-muted-foreground mt-1">
            View your scheduled content and download reference media
          </p>
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

        {/* Media Dialog */}
        <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reference Media - {selectedPlan?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download reference images and videos to replicate the content style.
              </p>

              {/* Media Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => downloadFile(media.url, media.name)}
                        className="p-3 rounded-full bg-accent hover:bg-accent/80 transition-colors"
                      >
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

              {(selectedPlan?.reference_media?.length || 0) === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reference media available for this plan.</p>
                </div>
              )}

              {/* Download All Button */}
              {(selectedPlan?.reference_media?.length || 0) > 0 && (
                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => {
                      selectedPlan?.reference_media?.forEach(media => {
                        downloadFile(media.url, media.name);
                      });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Content Plans List */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Content Plans</h2>
          
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content plans assigned yet.</p>
              <p className="text-sm mt-1">Your agency will add content plans here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground">{plan.title}</h4>
                        <Badge className={cn("text-xs", statusStyles[plan.status] || "bg-muted text-muted-foreground")}>
                          {plan.status.replace("_", " ")}
                        </Badge>
                        {plan.platform && (
                          <Badge variant="outline" className="text-xs">
                            {plan.platform}
                          </Badge>
                        )}
                      </div>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {plan.scheduled_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(plan.scheduled_date).toLocaleDateString()}
                          </span>
                        )}
                        {(plan.reference_media?.length || 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Image className="h-3 w-3" />
                            {plan.reference_media?.length} reference file(s)
                          </span>
                        )}
                      </div>
                    </div>
                    {(plan.reference_media?.length || 0) > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => openMediaDialog(plan)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        View Media
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
