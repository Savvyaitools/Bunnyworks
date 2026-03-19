import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useCreators } from "@/hooks/useCreators";
import { useProxyConfigs, ProxyConfig } from "@/hooks/useProxyConfigs";
import { useAgency } from "@/hooks/useAgency";
import { Globe, Shield, Save, TestTube, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProxyEdit {
  provider: "browserbase" | "brightdata" | "custom";
  proxy_host: string;
  proxy_port: string;
  proxy_username: string;
  proxy_password: string;
  proxy_protocol: "http" | "socks5";
  label: string;
  is_active: boolean;
}

const DEFAULT_EDIT: ProxyEdit = {
  provider: "browserbase",
  proxy_host: "",
  proxy_port: "",
  proxy_username: "",
  proxy_password: "",
  proxy_protocol: "http",
  label: "",
  is_active: true,
};

export function ProxyProviderManager() {
  const { creators } = useCreators();
  const { configs, create, update, remove } = useProxyConfigs();
  const { agency } = useAgency();
  const [edits, setEdits] = useState<Record<string, ProxyEdit>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const getConfigForCreator = (creatorId: string): ProxyConfig | undefined =>
    configs?.find((c) => c.creator_id === creatorId);

  const getEdit = (creatorId: string): ProxyEdit => {
    if (edits[creatorId]) return edits[creatorId];
    const existing = getConfigForCreator(creatorId);
    if (existing) {
      return {
        provider: existing.provider,
        proxy_host: existing.proxy_host || "",
        proxy_port: existing.proxy_port?.toString() || "",
        proxy_username: existing.proxy_username || "",
        proxy_password: existing.proxy_password || "",
        proxy_protocol: existing.proxy_protocol || "http",
        label: existing.label || "",
        is_active: existing.is_active,
      };
    }
    return { ...DEFAULT_EDIT };
  };

  const updateEdit = (creatorId: string, field: keyof ProxyEdit, value: any) => {
    setEdits((prev) => ({
      ...prev,
      [creatorId]: { ...getEdit(creatorId), [field]: value },
    }));
  };

  const hasChanges = (creatorId: string) => edits[creatorId] !== undefined;

  const handleSave = async (creatorId: string) => {
    const edit = edits[creatorId];
    if (!edit || !agency) return;

    setSaving(creatorId);
    const existing = getConfigForCreator(creatorId);
    const payload = {
      creator_id: creatorId,
      agency_id: agency.id,
      provider: edit.provider,
      proxy_host: edit.proxy_host || null,
      proxy_port: edit.proxy_port ? parseInt(edit.proxy_port) : null,
      proxy_username: edit.proxy_username || null,
      proxy_password: edit.proxy_password || null,
      proxy_protocol: edit.proxy_protocol,
      is_active: edit.is_active,
      label: edit.label || null,
    };

    try {
      if (existing) {
        await update(existing.id, payload as any);
      } else {
        await create(payload as any);
      }
      toast.success("Proxy provider saved");
      setEdits((prev) => { const n = { ...prev }; delete n[creatorId]; return n; });
    } catch {
      toast.error("Failed to save proxy config");
    }
    setSaving(null);
  };

  const handleTest = async (creatorId: string) => {
    setTesting(creatorId);
    try {
      const { data, error } = await supabase.functions.invoke("browserbase-session", {
        body: { action: "test_proxy", creatorId, agencyId: agency?.id },
      });
      if (error) throw error;
      if (data?.ip) {
        toast.success(`Proxy working! IP: ${data.ip}${data.geo ? ` (${data.geo})` : ""}`);
      } else {
        toast.error(data?.error || "Proxy test failed");
      }
    } catch (e: any) {
      toast.error(`Test failed: ${e.message}`);
    }
    setTesting(null);
  };

  const providerLabel = (p: string) =>
    p === "browserbase" ? "Default Proxy" : p === "brightdata" ? "Custom Proxy" : "Custom Proxy";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Proxy Provider
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Configure proxy provider per creator. Use the default built-in proxies or connect your own custom proxy.
        </p>

        <div className="space-y-4">
          {creators?.map((creator) => {
            const edit = getEdit(creator.id);
            const changed = hasChanges(creator.id);
            const showFields = edit.provider !== "browserbase";

            return (
              <div key={creator.id} className="flex flex-col gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{creator.name}</span>
                    {creator.alias && <span className="text-xs text-muted-foreground">({creator.alias})</span>}
                  </div>
                  {!changed && (
                    <Badge variant={edit.provider === "browserbase" ? "outline" : "default"} className="text-xs">
                      {providerLabel(edit.provider)}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      value={edit.provider}
                      onValueChange={(v) => updateEdit(creator.id, "provider", v)}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="browserbase">Default Proxy</SelectItem>
                        <SelectItem value="custom">Custom Proxy</SelectItem>
                      </SelectContent>
                    </Select>

                    {showFields && (
                      <Select
                        value={edit.proxy_protocol}
                        onValueChange={(v) => updateEdit(creator.id, "proxy_protocol", v)}
                      >
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="http">HTTP</SelectItem>
                          <SelectItem value="socks5">SOCKS5</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={edit.is_active}
                        onCheckedChange={(v) => updateEdit(creator.id, "is_active", v)}
                        className="scale-75"
                      />
                      <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                  </div>

                  {showFields && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {edit.provider === "custom" && (
                        <>
                          <Input
                            placeholder="Host"
                            value={edit.proxy_host}
                            onChange={(e) => updateEdit(creator.id, "proxy_host", e.target.value)}
                            className="h-8 text-xs"
                          />
                          <Input
                            placeholder="Port"
                            value={edit.proxy_port}
                            onChange={(e) => updateEdit(creator.id, "proxy_port", e.target.value)}
                            className="h-8 text-xs"
                            type="number"
                          />
                        </>
                      )}
                      <Input
                        placeholder="Username"
                        value={edit.proxy_username}
                        onChange={(e) => updateEdit(creator.id, "proxy_username", e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Input
                        placeholder="Password"
                        value={edit.proxy_password}
                        onChange={(e) => updateEdit(creator.id, "proxy_password", e.target.value)}
                        className="h-8 text-xs"
                        type="password"
                      />
                    </div>
                  )}

                  {showFields && (
                    <Input
                      placeholder="Label (e.g. Bright Data US Residential)"
                      value={edit.label}
                      onChange={(e) => updateEdit(creator.id, "label", e.target.value)}
                      className="h-8 text-xs max-w-sm"
                    />
                  )}

                  <div className="flex items-center gap-2">
                    {changed && (
                      <Button size="sm" onClick={() => handleSave(creator.id)} disabled={saving === creator.id} className="h-8 text-xs">
                        <Save className="h-3 w-3 mr-1" />
                        {saving === creator.id ? "Saving..." : "Save"}
                      </Button>
                    )}
                    {edit.provider !== "browserbase" && edit.proxy_username && (
                      <Button size="sm" variant="outline" onClick={() => handleTest(creator.id)} disabled={testing === creator.id} className="h-8 text-xs">
                        {testing === creator.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <TestTube className="h-3 w-3 mr-1" />}
                        Test
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {(!creators || creators.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No creators found. Add creators to configure proxy providers.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
