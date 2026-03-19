import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useCreators } from "@/hooks/useCreators";
import { useProxyConfigs } from "@/hooks/useProxyConfigs";
import { useAgency } from "@/hooks/useAgency";
import { Shield, ChevronDown, ChevronRight, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface StealthEdit {
  enabled: boolean;
  userAgent: string;
  screenWidth: string;
  screenHeight: string;
  webglVendor: string;
  webglRenderer: string;
  hardwareConcurrency: string;
  deviceMemory: string;
  languages: string;
  platform: string;
}

const DEFAULT_STEALTH: StealthEdit = {
  enabled: true,
  userAgent: "",
  screenWidth: "",
  screenHeight: "",
  webglVendor: "",
  webglRenderer: "",
  hardwareConcurrency: "",
  deviceMemory: "",
  languages: "en-US, en",
  platform: "Win32",
};

export function StealthProfileManager() {
  const { creators } = useCreators();
  const { configs, update, create } = useProxyConfigs();
  const { agency } = useAgency();
  const [edits, setEdits] = useState<Record<string, StealthEdit>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const getConfig = (creatorId: string) => configs?.find((c) => c.creator_id === creatorId);

  const getEdit = (creatorId: string): StealthEdit => {
    if (edits[creatorId]) return edits[creatorId];
    const existing = getConfig(creatorId)?.stealth_profile;
    if (existing) {
      return {
        enabled: existing.enabled ?? true,
        userAgent: existing.userAgent || "",
        screenWidth: existing.screenWidth?.toString() || "",
        screenHeight: existing.screenHeight?.toString() || "",
        webglVendor: existing.webglVendor || "",
        webglRenderer: existing.webglRenderer || "",
        hardwareConcurrency: existing.hardwareConcurrency?.toString() || "",
        deviceMemory: existing.deviceMemory?.toString() || "",
        languages: existing.languages?.join(", ") || "en-US, en",
        platform: existing.platform || "Win32",
      };
    }
    return { ...DEFAULT_STEALTH };
  };

  const updateEdit = (creatorId: string, field: keyof StealthEdit, value: any) => {
    setEdits((prev) => ({ ...prev, [creatorId]: { ...getEdit(creatorId), [field]: value } }));
  };

  const handleSave = async (creatorId: string) => {
    const edit = edits[creatorId];
    if (!edit || !agency) return;

    setSaving(creatorId);
    const stealthProfile = {
      enabled: edit.enabled,
      ...(edit.userAgent ? { userAgent: edit.userAgent } : {}),
      ...(edit.screenWidth ? { screenWidth: parseInt(edit.screenWidth) } : {}),
      ...(edit.screenHeight ? { screenHeight: parseInt(edit.screenHeight) } : {}),
      ...(edit.webglVendor ? { webglVendor: edit.webglVendor } : {}),
      ...(edit.webglRenderer ? { webglRenderer: edit.webglRenderer } : {}),
      ...(edit.hardwareConcurrency ? { hardwareConcurrency: parseInt(edit.hardwareConcurrency) } : {}),
      ...(edit.deviceMemory ? { deviceMemory: parseInt(edit.deviceMemory) } : {}),
      ...(edit.languages ? { languages: edit.languages.split(",").map((l: string) => l.trim()) } : {}),
      ...(edit.platform ? { platform: edit.platform } : {}),
    };

    const existing = getConfig(creatorId);
    try {
      if (existing) {
        await update(existing.id, { stealth_profile: stealthProfile } as any);
      } else {
        await create({
          creator_id: creatorId,
          agency_id: agency.id,
          provider: "browserbase",
          stealth_profile: stealthProfile,
        } as any);
      }
      toast.success("Stealth profile saved");
      setEdits((prev) => { const n = { ...prev }; delete n[creatorId]; return n; });
    } catch {
      toast.error("Failed to save stealth profile");
    }
    setSaving(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Stealth Fingerprint Profiles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Anti-detect fingerprint injection per creator. Spoofs navigator, WebGL, canvas, screen resolution, and more.
          Enabled by default with randomized values — customize below for consistency.
        </p>

        <div className="space-y-3">
          {creators?.map((creator) => {
            const edit = getEdit(creator.id);
            const isOpen = open[creator.id] ?? false;
            const hasChanges = edits[creator.id] !== undefined;

            return (
              <Collapsible key={creator.id} open={isOpen} onOpenChange={(v) => setOpen((p) => ({ ...p, [creator.id]: v }))}>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80">
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-medium text-sm">{creator.name}</span>
                      {creator.alias && <span className="text-xs text-muted-foreground">({creator.alias})</span>}
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant={edit.enabled ? "default" : "outline"} className="text-xs">
                        {edit.enabled ? "Stealth On" : "Stealth Off"}
                      </Badge>
                      <Switch
                        checked={edit.enabled}
                        onCheckedChange={(v) => updateEdit(creator.id, "enabled", v)}
                        className="scale-75"
                      />
                    </div>
                  </div>

                  <CollapsibleContent className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Screen Width</label>
                        <Input placeholder="Auto (random)" value={edit.screenWidth} onChange={(e) => updateEdit(creator.id, "screenWidth", e.target.value)} className="h-8 text-xs" type="number" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Screen Height</label>
                        <Input placeholder="Auto (random)" value={edit.screenHeight} onChange={(e) => updateEdit(creator.id, "screenHeight", e.target.value)} className="h-8 text-xs" type="number" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">CPU Cores</label>
                        <Input placeholder="Auto (4-12)" value={edit.hardwareConcurrency} onChange={(e) => updateEdit(creator.id, "hardwareConcurrency", e.target.value)} className="h-8 text-xs" type="number" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Device Memory (GB)</label>
                        <Input placeholder="Auto (4/8/16)" value={edit.deviceMemory} onChange={(e) => updateEdit(creator.id, "deviceMemory", e.target.value)} className="h-8 text-xs" type="number" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Platform</label>
                        <Input placeholder="Win32" value={edit.platform} onChange={(e) => updateEdit(creator.id, "platform", e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Languages</label>
                        <Input placeholder="en-US, en" value={edit.languages} onChange={(e) => updateEdit(creator.id, "languages", e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">User Agent (leave blank for auto)</label>
                      <Input placeholder="Auto-generated" value={edit.userAgent} onChange={(e) => updateEdit(creator.id, "userAgent", e.target.value)} className="h-8 text-xs" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">WebGL Vendor</label>
                        <Input placeholder="Google Inc. (NVIDIA)" value={edit.webglVendor} onChange={(e) => updateEdit(creator.id, "webglVendor", e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">WebGL Renderer</label>
                        <Input placeholder="ANGLE (NVIDIA, GTX 1660...)" value={edit.webglRenderer} onChange={(e) => updateEdit(creator.id, "webglRenderer", e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>

                    {hasChanges && (
                      <Button size="sm" onClick={() => handleSave(creator.id)} disabled={saving === creator.id} className="h-8 text-xs">
                        <Save className="h-3 w-3 mr-1" />
                        {saving === creator.id ? "Saving..." : "Save Stealth Profile"}
                      </Button>
                    )}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}

          {(!creators || creators.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No creators found. Add creators to configure stealth profiles.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
