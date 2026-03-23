import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Link, Plus, Trash2, GripVertical, ExternalLink, Copy, BarChart3, Eye, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface LinkPageManagerProps {
  creatorId: string;
  creatorName: string;
}

export function LinkPageManager({ creatorId, creatorName }: LinkPageManagerProps) {
  const { agencyId } = useAgency();
  const queryClient = useQueryClient();
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const { data: linkPage, isLoading } = useQuery({
    queryKey: ["link-page", creatorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("creator_link_pages")
        .select("*")
        .eq("creator_id", creatorId)
        .single();
      return data;
    },
    enabled: !!creatorId,
  });

  const { data: links = [] } = useQuery({
    queryKey: ["page-links", linkPage?.id],
    queryFn: async () => {
      if (!linkPage?.id) return [];
      const { data } = await supabase
        .from("creator_page_links")
        .select("*")
        .eq("page_id", linkPage.id)
        .order("position", { ascending: true });
      return data || [];
    },
    enabled: !!linkPage?.id,
  });

  const { data: clickStats } = useQuery({
    queryKey: ["link-clicks", linkPage?.id],
    queryFn: async () => {
      if (!linkPage?.id) return { total: 0 };
      const { count } = await supabase
        .from("link_click_events")
        .select("*", { count: "exact", head: true })
        .eq("page_id", linkPage.id);
      return { total: count || 0 };
    },
    enabled: !!linkPage?.id,
  });

  const createPage = useMutation({
    mutationFn: async () => {
      if (!agencyId) throw new Error("No agency");
      const slug = creatorName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
      // Ensure slug meets min length
      const finalSlug = slug.length < 3 ? `${slug}-page` : slug;
      const { data, error } = await supabase
        .from("creator_link_pages")
        .insert({
          agency_id: agencyId,
          creator_id: creatorId,
          slug: finalSlug,
          display_name: creatorName,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["link-page", creatorId] });
      toast.success("Link page created!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create page"),
  });

  const addLink = useMutation({
    mutationFn: async () => {
      if (!linkPage?.id) throw new Error("No page");
      const { error } = await supabase.from("creator_page_links").insert({
        page_id: linkPage.id,
        title: newLinkTitle,
        url: newLinkUrl.startsWith("http") ? newLinkUrl : `https://${newLinkUrl}`,
        position: links.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewLinkTitle("");
      setNewLinkUrl("");
      queryClient.invalidateQueries({ queryKey: ["page-links", linkPage?.id] });
      toast.success("Link added!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteLink = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("creator_page_links").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-links", linkPage?.id] });
      toast.success("Link removed");
    },
  });

  const togglePageActive = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!linkPage?.id) return;
      const { error } = await supabase.from("creator_link_pages").update({ is_active: isActive }).eq("id", linkPage.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["link-page", creatorId] });
    },
  });

  const copyLink = () => {
    if (!linkPage?.slug) return;
    const url = `${window.location.origin}/l/${linkPage.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  if (!linkPage) {
    return (
      <Card className="border-dashed border-2 border-border/50">
        <CardContent className="p-6 text-center space-y-3">
          <Link className="h-8 w-8 mx-auto text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">No Link Page Yet</p>
            <p className="text-sm text-muted-foreground">Create a shareable link page for this creator</p>
          </div>
          <Button onClick={() => createPage.mutate()} disabled={createPage.isPending} className="gap-1.5">
            {createPage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Link Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="page-active" className="text-sm">Active</Label>
                <Switch
                  id="page-active"
                  checked={linkPage.is_active}
                  onCheckedChange={(v) => togglePageActive.mutate(v)}
                />
              </div>
              <Badge variant="outline" className="text-xs">
                /l/{linkPage.slug}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/l/${linkPage.slug}`, "_blank")}
                className="gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
              {clickStats && (
                <Badge variant="secondary" className="gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {clickStats.total} clicks
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {links.map((link: any) => (
            <div
              key={link.id}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/20"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{link.title}</p>
                <p className="text-xs text-muted-foreground truncate">{link.url}</p>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">{link.click_count || 0}</Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => deleteLink.mutate(link.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}

          {/* Add link form */}
          <div className="flex items-end gap-2 pt-2 border-t border-border/30">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Link title"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Input
                placeholder="https://..."
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={() => addLink.mutate()}
              disabled={!newLinkTitle.trim() || !newLinkUrl.trim() || addLink.isPending}
              className="gap-1 h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
