import { useState, useRef } from "react";
import { Mail, Phone, Edit, Save, X, Camera, Upload, Percent, Users, Globe, Instagram, Twitter, ExternalLink, Palette, FileText, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Creator, UpdateCreatorInput } from "@/hooks/useCreators";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAgency } from "@/hooks/useAgency";

interface CreatorOverviewProps {
  creator: Creator;
  onUpdate: (input: UpdateCreatorInput) => Promise<Creator | null>;
}

export function CreatorOverview({ creator, onUpdate }: CreatorOverviewProps) {
  const { agency } = useAgency();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: creator.name,
    alias: creator.alias || "",
    email: creator.email,
    phone: creator.phone || "",
    notes: creator.notes || "",
    commission_rate: creator.commission_rate !== null ? (creator.commission_rate * 100).toString() : "",
    platform: creator.platform || "",
    followers: creator.followers || "",
    onlyfans_url: creator.onlyfans_url || "",
    instagram_url: creator.instagram_url || "",
    twitter_url: creator.twitter_url || "",
    tiktok_url: creator.tiktok_url || "",
    snapchat_url: creator.snapchat_url || "",
    persona: (creator as any).persona || "",
  });

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
      followers: formData.followers || null,
      onlyfans_url: formData.onlyfans_url || null,
      instagram_url: formData.instagram_url || null,
      twitter_url: formData.twitter_url || null,
      tiktok_url: formData.tiktok_url || null,
      snapchat_url: formData.snapchat_url || null,
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
      followers: creator.followers || "",
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

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${creator.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("creator-avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("creator-avatars")
        .getPublicUrl(fileName);

      await onUpdate({ avatar_url: urlData.publicUrl });
      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const avatarSrc = creator.avatar_url || 
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.avatar_seed || creator.name}`;

  const socialLinks = [
    { key: "onlyfans_url", label: "OnlyFans", url: creator.onlyfans_url, icon: ExternalLink, color: "text-blue-400" },
    { key: "instagram_url", label: "Instagram", url: creator.instagram_url, icon: Instagram, color: "text-pink-400" },
    { key: "twitter_url", label: "Twitter/X", url: creator.twitter_url, icon: Twitter, color: "text-sky-400" },
    { key: "tiktok_url", label: "TikTok", url: creator.tiktok_url, icon: Globe, color: "text-cyan-400" },
    { key: "snapchat_url", label: "Snapchat", url: creator.snapchat_url, icon: Globe, color: "text-yellow-400" },
  ];

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
            <span
              className={cn(
                "absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card",
                creator.online_status ? "bg-success" : "bg-muted-foreground"
              )}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? (
                <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <div>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-xl font-bold"
                  placeholder="Creator name"
                />
                <Input
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="Alias / Stage name"
                  className="text-sm"
                />
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-foreground">{creator.name}</h2>
                {creator.alias && (
                  <p className="text-muted-foreground">@{creator.alias}</p>
                )}
              </>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={creator.status === "Active" ? "default" : "secondary"}>
                {creator.status}
              </Badge>
              <span className={cn(
                "text-sm",
                creator.online_status ? "text-success" : "text-muted-foreground"
              )}>
                {creator.online_status ? "● Online" : "○ Offline"}
              </span>
            </div>
            {!creator.avatar_url && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
              >
                <Upload className="h-3 w-3" />
                Upload photo
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-gradient-primary">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email address"
                  />
                ) : (
                  <span className="text-foreground">{creator.email}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                ) : (
                  <span className="text-foreground">{creator.phone || "No phone"}</span>
                )}
              </div>
            </div>
          </div>

          {/* Platform & Followers */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Platform Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                {isEditing ? (
                  <Input
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    placeholder="Primary platform (e.g., OnlyFans, Fansly)"
                  />
                ) : (
                  <span className="text-foreground">{creator.platform || "Not specified"}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                {isEditing ? (
                  <Input
                    value={formData.followers}
                    onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                    placeholder="Follower count (e.g., 50K, 1.2M)"
                  />
                ) : (
                  <span className="text-foreground">{creator.followers || "Not specified"}</span>
                )}
              </div>
            </div>
          </div>

          {/* Commission Rate */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Commission Rate
            </h3>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                  placeholder={`Default: ${(agency?.commission_rate ?? 0.3) * 100}%`}
                  className="w-32"
                />
                <span className="text-muted-foreground">%</span>
                <span className="text-xs text-muted-foreground ml-2">
                  Leave empty to use agency default ({((agency?.commission_rate ?? 0.3) * 100).toFixed(0)}%)
                </span>
              </div>
            ) : (
              <p className="text-foreground">
                {creator.commission_rate !== null 
                  ? `${(creator.commission_rate * 100).toFixed(0)}% (Custom)` 
                  : `${((agency?.commission_rate ?? 0.3) * 100).toFixed(0)}% (Agency Default)`}
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Social Links
            </h3>
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={formData.onlyfans_url}
                  onChange={(e) => setFormData({ ...formData, onlyfans_url: e.target.value })}
                  placeholder="OnlyFans URL"
                />
                <Input
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="Instagram URL"
                />
                <Input
                  value={formData.twitter_url}
                  onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                  placeholder="Twitter/X URL"
                />
                <Input
                  value={formData.tiktok_url}
                  onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                  placeholder="TikTok URL"
                />
                <Input
                  value={formData.snapchat_url}
                  onChange={(e) => setFormData({ ...formData, snapchat_url: e.target.value })}
                  placeholder="Snapchat URL"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {socialLinks.filter(link => link.url).length > 0 ? (
                  socialLinks.filter(link => link.url).map((link) => (
                    <a
                      key={link.key}
                      href={link.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <link.icon className={cn("h-4 w-4", link.color)} />
                      <span>{link.label}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No social links added</p>
                )}
              </div>
            )}
          </div>

          {/* Persona / Bio */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Creator Persona
            </h3>
            {isEditing ? (
              <Textarea
                value={formData.persona}
                onChange={(e) => setFormData({ ...formData, persona: e.target.value })}
                placeholder="Describe the creator's persona, style, and content focus..."
                rows={3}
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                {(creator as any).persona || "No persona description added yet."}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Internal Notes
            </h3>
            {isEditing ? (
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add internal notes about this creator..."
                rows={3}
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                {creator.notes || "No notes added yet."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
