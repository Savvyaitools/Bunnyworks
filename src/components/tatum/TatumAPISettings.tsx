import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Key, CheckCircle2, XCircle, Loader2, ExternalLink, Eye, EyeOff, 
  AlertTriangle, Instagram, Twitter, Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PlatformConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  fields: { key: string; label: string; placeholder: string; isSecret?: boolean }[];
  docsUrl: string;
  docsLabel: string;
  description: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "reddit",
    label: "Reddit",
    icon: Globe,
    color: "text-orange-500",
    description: "Access trending subreddits, post engagement, and niche community data",
    fields: [
      { key: "api_key", label: "Client ID", placeholder: "Your Reddit app client ID" },
      { key: "api_secret", label: "Client Secret", placeholder: "Your Reddit app client secret", isSecret: true },
    ],
    docsUrl: "https://www.reddit.com/prefs/apps",
    docsLabel: "Create Reddit App",
  },
  {
    id: "twitter",
    label: "Twitter / X",
    icon: Twitter,
    color: "text-sky-500",
    description: "Tweet metrics, follower analytics, and trending hashtags",
    fields: [
      { key: "api_key", label: "API Key (Bearer Token)", placeholder: "Your X API Bearer Token", isSecret: true },
    ],
    docsUrl: "https://developer.x.com/en/portal/dashboard",
    docsLabel: "X Developer Portal",
  },
  {
    id: "instagram",
    label: "Instagram (Meta)",
    icon: Instagram,
    color: "text-pink-500",
    description: "Post insights, reach, impressions, and follower demographics via Graph API",
    fields: [
      { key: "api_key", label: "App ID", placeholder: "Your Meta App ID" },
      { key: "api_secret", label: "App Secret", placeholder: "Your Meta App Secret", isSecret: true },
      { key: "access_token", label: "Access Token", placeholder: "Long-lived access token", isSecret: true },
    ],
    docsUrl: "https://developers.facebook.com/apps/",
    docsLabel: "Meta Developer Portal",
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: Globe,
    color: "text-foreground",
    description: "Trending sounds, hashtags, and Creative Center data (uses Firecrawl — no key needed)",
    fields: [],
    docsUrl: "https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en",
    docsLabel: "TikTok Creative Center",
  },
];

interface CredentialRow {
  id: string;
  platform: string;
  api_key: string;
  api_secret: string;
  access_token: string;
  is_active: boolean;
  last_verified_at: string | null;
}

export function TatumAPISettings() {
  const { profile } = useAuth();
  const [credentials, setCredentials] = useState<Record<string, CredentialRow>>({});
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.agency_id) loadCredentials();
  }, [profile?.agency_id]);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agency_api_credentials" as any)
        .select("*")
        .eq("agency_id", profile!.agency_id);
      if (error) throw error;
      const map: Record<string, CredentialRow> = {};
      const form: Record<string, Record<string, string>> = {};
      (data as any[] || []).forEach((row: any) => {
        map[row.platform] = row;
        form[row.platform] = {
          api_key: row.api_key || "",
          api_secret: row.api_secret || "",
          access_token: row.access_token || "",
        };
      });
      setCredentials(map);
      setFormData(form);
    } catch (err) {
      console.error("Failed to load API credentials:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (platform: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [platform]: { ...(prev[platform] || {}), [field]: value },
    }));
  };

  const toggleVisibility = (fieldKey: string) => {
    setVisibleFields(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const saveCredential = async (platform: string) => {
    if (!profile?.agency_id) return;
    setSaving(platform);
    try {
      const fields = formData[platform] || {};
      const existing = credentials[platform];

      if (existing) {
        const { error } = await supabase
          .from("agency_api_credentials" as any)
          .update({
            api_key: fields.api_key || "",
            api_secret: fields.api_secret || "",
            access_token: fields.access_token || "",
            is_active: true,
          } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("agency_api_credentials" as any)
          .insert({
            agency_id: profile.agency_id,
            platform,
            api_key: fields.api_key || "",
            api_secret: fields.api_secret || "",
            access_token: fields.access_token || "",
            is_active: true,
          } as any);
        if (error) throw error;
      }

      toast.success(`${platform} credentials saved`);
      await loadCredentials();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save credentials");
    } finally {
      setSaving(null);
    }
  };

  const toggleActive = async (platform: string, active: boolean) => {
    const existing = credentials[platform];
    if (!existing) return;
    try {
      const { error } = await supabase
        .from("agency_api_credentials" as any)
        .update({ is_active: active } as any)
        .eq("id", existing.id);
      if (error) throw error;
      toast.success(`${platform} ${active ? "enabled" : "disabled"}`);
      await loadCredentials();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const disconnectPlatform = async (platform: string) => {
    const existing = credentials[platform];
    if (!existing) return;
    try {
      const { error } = await supabase
        .from("agency_api_credentials" as any)
        .delete()
        .eq("id", existing.id);
      if (error) throw error;
      toast.success(`${platform} disconnected`);
      setFormData(prev => { const next = { ...prev }; delete next[platform]; return next; });
      await loadCredentials();
    } catch (err) {
      toast.error("Failed to disconnect");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Connect your platform APIs to supercharge Tatum</p>
            <p className="text-muted-foreground mt-1">
              API keys are stored securely and only used by Tatum to fetch analytics, discover trends, and generate data-driven content strategies. TikTok uses free public data — no key needed.
            </p>
          </div>
        </CardContent>
      </Card>

      {PLATFORMS.map((p) => {
        const cred = credentials[p.id];
        const isConnected = !!cred && cred.is_active;
        const fields = formData[p.id] || {};
        const isTikTok = p.id === "tiktok";

        return (
          <Card key={p.id} className={isConnected ? "border-green-500/30" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <p.icon className={`h-5 w-5 ${p.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {p.label}
                      {isConnected && (
                        <Badge variant="default" className="text-[10px] bg-green-600 hover:bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                        </Badge>
                      )}
                      {cred && !cred.is_active && (
                        <Badge variant="secondary" className="text-[10px]">
                          <XCircle className="h-3 w-3 mr-1" /> Disabled
                        </Badge>
                      )}
                      {isTikTok && !cred && (
                        <Badge variant="secondary" className="text-[10px] bg-green-600/10 text-green-600">
                          Free — No Key Needed
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">{p.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cred && (
                    <Switch
                      checked={cred.is_active}
                      onCheckedChange={(v) => toggleActive(p.id, v)}
                    />
                  )}
                  <a
                    href={p.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    {p.docsLabel} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardHeader>

            {p.fields.length > 0 && (
              <CardContent className="space-y-3 pt-0">
                <Separator />
                {p.fields.map((field) => {
                  const visKey = `${p.id}-${field.key}`;
                  const isVisible = visibleFields[visKey];
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{field.label}</Label>
                      <div className="relative">
                        <Input
                          type={field.isSecret && !isVisible ? "password" : "text"}
                          placeholder={field.placeholder}
                          value={fields[field.key] || ""}
                          onChange={(e) => handleFieldChange(p.id, field.key, e.target.value)}
                          className="pr-10 bg-muted/50 border-border font-mono text-xs"
                        />
                        {field.isSecret && (
                          <button
                            type="button"
                            onClick={() => toggleVisibility(visKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => saveCredential(p.id)}
                    disabled={saving === p.id}
                  >
                    {saving === p.id ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Key className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {cred ? "Update" : "Connect"}
                  </Button>
                  {cred && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => disconnectPlatform(p.id)}
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
