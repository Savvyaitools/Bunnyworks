import { useState, useRef } from "react";
import { Mail, Phone, Instagram, Twitter, Link as LinkIcon, Edit, Save, X, Camera, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Creator, UpdateCreatorInput } from "@/hooks/useCreators";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreatorOverviewProps {
  creator: Creator;
  onUpdate: (input: UpdateCreatorInput) => Promise<Creator | null>;
}

export function CreatorOverview({ creator, onUpdate }: CreatorOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: creator.name,
    alias: creator.alias || "",
    email: creator.email,
    phone: creator.phone || "",
    notes: creator.notes || "",
    onlyfans_url: creator.onlyfans_url || "",
    instagram_url: creator.instagram_url || "",
    tiktok_url: creator.tiktok_url || "",
    twitter_url: creator.twitter_url || "",
    snapchat_url: creator.snapchat_url || "",
  });

  const handleSave = async () => {
    await onUpdate({
      name: formData.name,
      alias: formData.alias || null,
      email: formData.email,
      phone: formData.phone || null,
      notes: formData.notes || null,
      onlyfans_url: formData.onlyfans_url || null,
      instagram_url: formData.instagram_url || null,
      tiktok_url: formData.tiktok_url || null,
      twitter_url: formData.twitter_url || null,
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
      onlyfans_url: creator.onlyfans_url || "",
      instagram_url: creator.instagram_url || "",
      tiktok_url: creator.tiktok_url || "",
      twitter_url: creator.twitter_url || "",
      snapchat_url: creator.snapchat_url || "",
    });
    setIsEditing(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${creator.id}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("creator-avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("creator-avatars")
        .getPublicUrl(fileName);

      // Update creator with new avatar URL
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
            {/* Photo upload overlay */}
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
                />
                <Input
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="Alias"
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
            <p className={cn(
              "text-sm mt-1",
              creator.online_status ? "text-success" : "text-muted-foreground"
            )}>
              {creator.online_status ? "Online" : "Offline"}
            </p>
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
        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Contact Information</h3>
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

        {/* Social Links */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Social Links</h3>
          <div className="space-y-3">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Primary Platform</Label>
                  <Input
                    value={formData.onlyfans_url}
                    onChange={(e) => setFormData({ ...formData, onlyfans_url: e.target.value })}
                    placeholder="Primary platform URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Instagram</Label>
                  <Input
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    placeholder="Instagram URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">TikTok</Label>
                  <Input
                    value={formData.tiktok_url}
                    onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                    placeholder="TikTok URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Twitter</Label>
                  <Input
                    value={formData.twitter_url}
                    onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                    placeholder="Twitter URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Snapchat</Label>
                  <Input
                    value={formData.snapchat_url}
                    onChange={(e) => setFormData({ ...formData, snapchat_url: e.target.value })}
                    placeholder="Snapchat URL"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {creator.onlyfans_url && (
                  <a href={creator.onlyfans_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                    <LinkIcon className="h-4 w-4" />
                    <span className="text-sm">Platform</span>
                  </a>
                )}
                {creator.instagram_url && (
                  <a href={creator.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                    <Instagram className="h-4 w-4" />
                    <span className="text-sm">Instagram</span>
                  </a>
                )}
                {creator.tiktok_url && (
                  <a href={creator.tiktok_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                    <LinkIcon className="h-4 w-4" />
                    <span className="text-sm">TikTok</span>
                  </a>
                )}
                {creator.twitter_url && (
                  <a href={creator.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                    <Twitter className="h-4 w-4" />
                    <span className="text-sm">Twitter</span>
                  </a>
                )}
                {creator.snapchat_url && (
                  <a href={creator.snapchat_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                    <LinkIcon className="h-4 w-4" />
                    <span className="text-sm">Snapchat</span>
                  </a>
                )}
                {!creator.onlyfans_url && !creator.instagram_url && !creator.tiktok_url && !creator.twitter_url && !creator.snapchat_url && (
                  <span className="text-muted-foreground text-sm">No social links added</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Notes</h3>
        {isEditing ? (
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add notes about this creator..."
            rows={4}
          />
        ) : (
          <p className="text-muted-foreground">
            {creator.notes || "No notes added yet."}
          </p>
        )}
      </div>
    </div>
  );
}
