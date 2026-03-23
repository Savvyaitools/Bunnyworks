import { useState, useRef, useEffect, useCallback } from "react";
import { Mail, Phone, Edit, Save, X, Camera, Upload, Percent, Users, Globe, Instagram, Twitter, ExternalLink, FileText, User, Tag, Plus, Link2, Heart, Sparkles, Star, MessageCircle, Hash, RefreshCw, Loader2, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Creator, UpdateCreatorInput } from "@/hooks/useCreators";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAgency } from "@/hooks/useAgency";

interface CreatorOverviewProps {
  creator: Creator;
  onUpdate: (input: UpdateCreatorInput) => Promise<Creator | null>;
}

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  account_type: string;
  profile_url: string | null;
  follower_count: number | null;
  engagement_rate: number | null;
  bio: string | null;
  avg_likes: number | null;
  avg_comments: number | null;
  posts_count: number | null;
  last_synced_at: string | null;
  creator_id: string;
}

const ALL_SOCIAL_PLATFORMS = ["Instagram", "Twitter", "TikTok", "Reddit", "Facebook", "Snapchat", "YouTube", "Threads", "LinkedIn", "Pinterest"];
const MAX_SOCIAL_ACCOUNTS = 10;

const socialPlatformConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  Instagram: { icon: <Instagram className="h-4 w-4" />, color: "text-pink-400", bgColor: "bg-pink-500/20" },
  Twitter: { icon: <Twitter className="h-4 w-4" />, color: "text-sky-400", bgColor: "bg-sky-500/20" },
  TikTok: { icon: <Globe className="h-4 w-4" />, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
  Reddit: { icon: <MessageCircle className="h-4 w-4" />, color: "text-orange-400", bgColor: "bg-orange-500/20" },
  Facebook: { icon: <Hash className="h-4 w-4" />, color: "text-blue-500", bgColor: "bg-blue-600/20" },
  Snapchat: { icon: <Globe className="h-4 w-4" />, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  YouTube: { icon: <Globe className="h-4 w-4" />, color: "text-red-400", bgColor: "bg-red-500/20" },
  Threads: { icon: <Globe className="h-4 w-4" />, color: "text-foreground", bgColor: "bg-muted" },
  LinkedIn: { icon: <Globe className="h-4 w-4" />, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  Pinterest: { icon: <Globe className="h-4 w-4" />, color: "text-red-500", bgColor: "bg-red-500/20" },
};

function formatFollowerCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function CreatorOverview({ creator, onUpdate }: CreatorOverviewProps) {
  const { agency } = useAgency();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Social accounts state
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loadingSocials, setLoadingSocials] = useState(true);
  const [syncingStats, setSyncingStats] = useState(false);
  const [isAddSocialOpen, setIsAddSocialOpen] = useState(false);
  const [socialForm, setSocialForm] = useState({ platform: "", username: "", profile_url: "", follower_count: "" });

  const [formData, setFormData] = useState({
    name: creator.name,
    alias: creator.alias || "",
    email: creator.email,
    phone: creator.phone || "",
    notes: creator.notes || "",
    commission_rate: creator.commission_rate !== null ? (creator.commission_rate * 100).toString() : "",
    platform: creator.platform || "",
    onlyfans_url: creator.onlyfans_url || "",
    instagram_url: creator.instagram_url || "",
    twitter_url: creator.twitter_url || "",
    tiktok_url: creator.tiktok_url || "",
    snapchat_url: creator.snapchat_url || "",
    persona: (creator as any).persona || "",
  });

  const fetchSocialAccounts = useCallback(async () => {
    setLoadingSocials(true);
    const { data } = await supabase
      .from("creator_social_accounts")
      .select("*")
      .eq("creator_id", creator.id)
      .eq("account_type", "social")
      .order("created_at", { ascending: false });
    if (data) setSocialAccounts(data as unknown as SocialAccount[]);
    setLoadingSocials(false);
  }, [creator.id]);

  useEffect(() => {
    fetchSocialAccounts();
  }, [fetchSocialAccounts]);

  const totalFollowers = socialAccounts.reduce((sum, a) => sum + (a.follower_count || 0), 0);

  const addSocialAccount = async () => {
    if (!socialForm.platform || !socialForm.username.trim()) {
      toast.error("Platform and username are required");
      return;
    }
    if (socialAccounts.length >= MAX_SOCIAL_ACCOUNTS) {
      toast.error(`Maximum ${MAX_SOCIAL_ACCOUNTS} social accounts allowed`);
      return;
    }

    const { error } = await supabase
      .from("creator_social_accounts")
      .insert({
        platform: socialForm.platform,
        username: socialForm.username.trim(),
        profile_url: socialForm.profile_url.trim() || null,
        follower_count: socialForm.follower_count ? parseInt(socialForm.follower_count) : null,
        creator_id: creator.id,
        account_type: "social",
      });

    if (error) {
      toast.error("Failed to add social account");
    } else {
      toast.success("Social account added");
      setSocialForm({ platform: "", username: "", profile_url: "", follower_count: "" });
      setIsAddSocialOpen(false);
      fetchSocialAccounts();
    }
  };

  const deleteSocialAccount = async (id: string) => {
    const { error } = await supabase
      .from("creator_social_accounts")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Failed to remove account");
    } else {
      toast.success("Account removed");
      fetchSocialAccounts();
    }
  };

  const syncSocialStats = async () => {
    if (socialAccounts.length === 0) {
      toast.error("No social accounts to sync");
      return;
    }
    setSyncingStats(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-social-stats", {
        body: { creatorId: creator.id, mode: "single" },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Synced ${data.synced}/${data.total} accounts`);
        fetchSocialAccounts();
      } else {
        toast.error(data?.error || "Sync failed");
      }
    } catch (err) {
      console.error("Sync stats error:", err);
      toast.error("Failed to sync social stats");
    } finally {
      setSyncingStats(false);
    }
  };

  const handleSave = async () => {
    const commissionValue = formData.commission_rate 
      ? parseFloat(formData.commission_rate) / 100 
      : null;
    
    await onUpdate({
      name: formData.name,
      alias: formData.alias || null,
      email: formData.email,
      phone: formData.phone || null,
      notes: formData.notes || null,
      commission_rate: commissionValue,
      platform: formData.platform || null,
      followers: totalFollowers > 0 ? formatFollowerCount(totalFollowers) : null,
      onlyfans_url: formData.onlyfans_url || null,
      instagram_url: formData.instagram_url || null,
      twitter_url: formData.twitter_url || null,
      tiktok_url: formData.tiktok_url || null,
      snapchat_url: formData.snapchat_url || null,
      persona: formData.persona || null,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: creator.name,
      alias: creator.alias || "",
      email: creator.email,
      phone: creator.phone || "",
      notes: creator.notes || "",
      commission_rate: creator.commission_rate !== null ? (creator.commission_rate * 100).toString() : "",
      platform: creator.platform || "",
      onlyfans_url: creator.onlyfans_url || "",
      instagram_url: creator.instagram_url || "",
      twitter_url: creator.twitter_url || "",
      tiktok_url: creator.tiktok_url || "",
      snapchat_url: creator.snapchat_url || "",
      persona: (creator as any).persona || "",
    });
    setIsEditing(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image size must be less than 5MB"); return; }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${creator.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("creator-avatars").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("creator-avatars").getPublicUrl(fileName);
      await onUpdate({ avatar_url: urlData.publicUrl });
      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const avatarSrc = creator.avatar_url || 
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.avatar_seed || creator.name}`;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-20 w-20 ring-4 ring-primary/20">
              <AvatarImage src={avatarSrc} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                {creator.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <span className={cn("absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card", creator.online_status ? "bg-success" : "bg-muted-foreground")} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploading ? <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </div>
          <div>
            {isEditing ? (
              <div className="space-y-2">
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="text-xl font-bold" placeholder="Creator name" />
                <Input value={formData.alias} onChange={(e) => setFormData({ ...formData, alias: e.target.value })} placeholder="Alias / Stage name" className="text-sm" />
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-foreground">{creator.name}</h2>
                {creator.alias && <p className="text-muted-foreground">@{creator.alias}</p>}
              </>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={creator.status === "Active" ? "default" : "secondary"}>{creator.status}</Badge>
              <span className={cn("text-sm", creator.online_status ? "text-success" : "text-muted-foreground")}>
                {creator.online_status ? "● Online" : "○ Offline"}
              </span>
            </div>
            {!creator.avatar_url && (
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                <Upload className="h-3 w-3" /> Upload photo
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}><X className="h-4 w-4 mr-2" />Cancel</Button>
              <Button size="sm" onClick={handleSave} className="bg-gradient-primary"><Save className="h-4 w-4 mr-2" />Save</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-2" />Edit Profile</Button>
          )}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20"><Globe className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Platform</p>
                <p className="font-semibold text-foreground">{creator.platform || "Not set"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20"><Users className="h-4 w-4 text-blue-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Followers</p>
                <p className="font-semibold text-foreground">{totalFollowers > 0 ? formatFollowerCount(totalFollowers) : "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20"><Percent className="h-4 w-4 text-success" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Commission</p>
                <p className="font-semibold text-foreground">
                  {creator.commission_rate !== null 
                    ? `${(creator.commission_rate * 100).toFixed(0)}%` 
                    : `${((agency?.commission_rate ?? 0.3) * 100).toFixed(0)}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/20"><Link2 className="h-4 w-4 text-pink-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Social Links</p>
                <p className="font-semibold text-foreground">{socialAccounts.length}/{MAX_SOCIAL_ACCOUNTS}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Accounts Section */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              Social Accounts
              <Badge variant="secondary" className="ml-1">{socialAccounts.length}/{MAX_SOCIAL_ACCOUNTS}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {socialAccounts.length > 0 && (
                <Button size="sm" variant="outline" onClick={syncSocialStats} disabled={syncingStats}>
                  {syncingStats ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  {syncingStats ? "Syncing..." : "Sync Stats"}
                </Button>
              )}
              {socialAccounts.length < MAX_SOCIAL_ACCOUNTS && (
                <Button size="sm" variant="outline" onClick={() => setIsAddSocialOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingSocials ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : socialAccounts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No social accounts added yet</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setIsAddSocialOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Social Account
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {socialAccounts.map((account) => {
                const config = socialPlatformConfig[account.platform] || { icon: <Globe className="h-4 w-4" />, color: "text-muted-foreground", bgColor: "bg-muted" };
                return (
                  <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bgColor)}>
                        <span className={config.color}>{config.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{account.platform}</span>
                          <span className="text-sm text-muted-foreground">@{account.username}</span>
                        </div>
                        {account.follower_count != null && account.follower_count > 0 && (
                          <span className="text-xs text-muted-foreground">{formatFollowerCount(account.follower_count)} followers</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {account.profile_url && (
                        <a href={account.profile_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ExternalLink className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSocialAccount(account.id)}>
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Contact Info Card */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><Mail className="h-4 w-4 text-primary" /></div>
                {isEditing ? (
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address" className="flex-1" />
                ) : (
                  <span className="text-foreground">{creator.email}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><Phone className="h-4 w-4 text-primary" /></div>
                {isEditing ? (
                  <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" className="flex-1" />
                ) : (
                  <span className="text-foreground">{creator.phone || "No phone"}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Commission Rate Card */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Percent className="h-4 w-4 text-primary" />Commission Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" max="100" value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })} placeholder={`Default: ${(agency?.commission_rate ?? 0.3) * 100}%`} className="w-32" />
                  <span className="text-muted-foreground">%</span>
                  <span className="text-xs text-muted-foreground ml-2">Leave empty for agency default ({((agency?.commission_rate ?? 0.3) * 100).toFixed(0)}%)</span>
                </div>
              ) : (
                <p className="text-foreground">
                  {creator.commission_rate !== null 
                    ? `${(creator.commission_rate * 100).toFixed(0)}% (Custom)` 
                    : `${((agency?.commission_rate ?? 0.3) * 100).toFixed(0)}% (Agency Default)`}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Persona / Bio Card */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" />Creator Persona</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea value={formData.persona} onChange={(e) => setFormData({ ...formData, persona: e.target.value })} placeholder="Describe the creator's persona, style, and content focus..." rows={4} />
              ) : (
                <p className="text-foreground text-sm font-bold text-justify whitespace-pre-wrap">{(creator as any).persona || "No persona description added yet."}</p>
              )}
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Add internal notes about this creator..." rows={4} />
              ) : (
                <p className="text-muted-foreground text-sm text-justify whitespace-pre-wrap">{creator.notes || "No notes added yet."}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Social Account Dialog */}
      <Dialog open={isAddSocialOpen} onOpenChange={setIsAddSocialOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Social Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={socialForm.platform} onValueChange={(v) => setSocialForm({ ...socialForm, platform: v })}>
              <SelectTrigger><SelectValue placeholder="Select Platform" /></SelectTrigger>
              <SelectContent>
                {ALL_SOCIAL_PLATFORMS.map((platform) => {
                  const config = socialPlatformConfig[platform];
                  return (
                    <SelectItem key={platform} value={platform}>
                      <span className="flex items-center gap-2">
                        <span className={config?.color}>{config?.icon}</span>
                        {platform}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Input placeholder="Username" value={socialForm.username} onChange={(e) => setSocialForm({ ...socialForm, username: e.target.value })} />
            <Input placeholder="Profile URL (optional)" value={socialForm.profile_url} onChange={(e) => setSocialForm({ ...socialForm, profile_url: e.target.value })} />
            <Input type="number" placeholder="Follower count (optional)" value={socialForm.follower_count} onChange={(e) => setSocialForm({ ...socialForm, follower_count: e.target.value })} />
            <Button onClick={addSocialAccount} className="w-full bg-gradient-primary">Add Account</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
