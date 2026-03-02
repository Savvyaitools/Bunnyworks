import { useState, useRef } from "react";
import { Mail, Phone, Edit, Save, X, Camera, Upload, Percent, Users, Globe, Instagram, Twitter, ExternalLink, FileText, User, Tag, Palette } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const socialLinks: { key: string; label: string; url: string | null; icon: typeof Globe; color: string }[] = [];

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

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Globe className="h-4 w-4 text-primary" />
              </div>
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
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Followers</p>
                <p className="font-semibold text-foreground">{creator.followers || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <Percent className="h-4 w-4 text-success" />
              </div>
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
              <div className="p-2 rounded-lg bg-pink-500/20">
                <Tag className="h-4 w-4 text-pink-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold text-foreground">{creator.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Contact Info Card */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    className="flex-1"
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
                    className="flex-1"
                  />
                ) : (
                  <span className="text-foreground">{creator.phone || "No phone"}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Platform & Audience Card */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Platform & Audience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Primary Platform</p>
                  {isEditing ? (
                    <Input
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      placeholder="OnlyFans, Fansly, Fanvue"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground">{creator.platform || "Not specified"}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Followers</p>
                  {isEditing ? (
                    <Input
                      value={formData.followers}
                      onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                      placeholder="50K, 1.2M"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground">{creator.followers || "Not specified"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Rate Card */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                Commission Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    Leave empty for agency default ({((agency?.commission_rate ?? 0.3) * 100).toFixed(0)}%)
                  </span>
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
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Creator Persona
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.persona}
                  onChange={(e) => setFormData({ ...formData, persona: e.target.value })}
                  placeholder="Describe the creator's persona, style, and content focus..."
                  rows={4}
                />
              ) : (
                <p className="text-muted-foreground text-sm whitespace-pre-wrap break-words text-justify leading-relaxed">
                  {(creator as any).persona || "No persona description added yet."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add internal notes about this creator..."
                  rows={4}
                />
              ) : (
                <p className="text-muted-foreground text-sm whitespace-pre-wrap break-words text-justify leading-relaxed">
                  {creator.notes || "No notes added yet."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
