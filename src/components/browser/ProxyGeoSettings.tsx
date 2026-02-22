import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCreators } from "@/hooks/useCreators";
import { useProxyConfigs, type ProxyConfig } from "@/hooks/useProxyConfigs";
import {
  MapPin, Plus, Shield, Globe, Trash2, Pencil, Save, Users,
  CheckCircle2, AlertCircle, HelpCircle, Settings2
} from "lucide-react";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "CO", name: "Colombia" },
  { code: "AR", name: "Argentina" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "SE", name: "Sweden" },
  { code: "RO", name: "Romania" },
  { code: "CZ", name: "Czech Republic" },
  { code: "UA", name: "Ukraine" },
  { code: "PH", name: "Philippines" },
  { code: "JP", name: "Japan" },
];

const US_STATES = [
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut",
  "delaware", "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa",
  "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan",
  "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada", "new_hampshire",
  "new_jersey", "new_mexico", "new_york", "north_carolina", "north_dakota", "ohio",
  "oklahoma", "oregon", "pennsylvania", "rhode_island", "south_carolina", "south_dakota",
  "tennessee", "texas", "utah", "vermont", "virginia", "washington", "west_virginia",
  "wisconsin", "wyoming"
];

function HealthBadge({ status }: { status: string }) {
  if (status === "healthy") return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Healthy</Badge>;
  if (status === "degraded") return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />Degraded</Badge>;
  if (status === "down") return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Down</Badge>;
  return <Badge variant="outline" className="gap-1"><HelpCircle className="h-3 w-3" />Unknown</Badge>;
}

/* ─── Browserbase Residential Proxy Form ─── */
function BrowserbaseProxyForm() {
  const { createConfig, configs } = useProxyConfigs();
  const [country, setCountry] = useState("US");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const existingBB = configs.filter(c => c.provider === "browserbase");

  const handleSave = () => {
    createConfig.mutate({
      name: `Browserbase ${COUNTRIES.find(c => c.code === country)?.name || country}${state ? ` / ${state.replace(/_/g, " ")}` : ""}`,
      provider: "browserbase",
      proxy_type: "residential",
      protocol: "http",
      country,
      state: state || null,
      city: city || null,
      is_rotating: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Browserbase Residential Proxy
        </CardTitle>
        <CardDescription>
          Browserbase provides built-in residential proxies. Select a geographic location and we'll automatically route your sessions through the best available proxy in that region.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Location selector */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Country</Label>
            <Select value={country} onValueChange={v => { setCountry(v); setState(""); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {country === "US" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">State <span className="text-muted-foreground">(optional)</span></Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Any state" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  {US_STATES.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">City <span className="text-muted-foreground">(optional)</span></Label>
            <Input placeholder="e.g. Dallas" value={city} onChange={e => setCity(e.target.value)} />
          </div>
        </div>

        {/* Info callout */}
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> How it works
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
            <li>Browserbase selects the best residential IP from its pool based on your chosen region</li>
            <li>IPs rotate automatically per session to avoid fingerprinting</li>
            <li>State-level pinning keeps your creator's sessions geographically consistent</li>
            <li>No credentials needed — proxies are managed by Browserbase</li>
          </ul>
        </div>

        <div className="flex items-center justify-between">
          <Button onClick={handleSave} disabled={createConfig.isPending} className="gap-1.5">
            <Save className="h-4 w-4" />
            {createConfig.isPending ? "Saving..." : "Save Proxy Config"}
          </Button>
        </div>

        {/* Existing Browserbase configs */}
        {existingBB.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">Saved Browserbase Configs</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {existingBB.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.country}{c.state ? ` / ${c.state.replace(/_/g, " ")}` : ""}{c.city ? ` · ${c.city}` : ""}
                    </p>
                  </div>
                  <HealthBadge status={c.health_status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Custom Proxy Form Dialog ─── */
const EMPTY_CUSTOM: Partial<ProxyConfig> = {
  name: "", provider: "custom", proxy_type: "residential", protocol: "http",
  host: "", port: undefined, username: "", password: "",
  country: "", state: "", city: "", is_rotating: true,
  sticky_session_ttl: undefined, notes: "",
};

function CustomProxyDialog({
  open, onOpenChange, initialData, onSave, saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData: Partial<ProxyConfig>;
  onSave: (data: Partial<ProxyConfig>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<ProxyConfig>>(initialData);
  const isEdit = !!initialData.id;
  const update = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Custom Proxy" : "Add Custom Residential Proxy"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input placeholder="e.g. Bright Data US Residential" value={form.name || ""} onChange={e => update("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Provider</Label>
              <Select value={form.provider || "custom"} onValueChange={v => update("provider", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bright_data">Bright Data</SelectItem>
                  <SelectItem value="smartproxy">Smartproxy</SelectItem>
                  <SelectItem value="oxylabs">Oxylabs</SelectItem>
                  <SelectItem value="custom">Other Provider</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Protocol</Label>
              <Select value={form.protocol || "http"} onValueChange={v => update("protocol", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="https">HTTPS</SelectItem>
                  <SelectItem value="socks5">SOCKS5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Port</Label>
              <Input type="number" placeholder="8080" value={form.port ?? ""} onChange={e => update("port", e.target.value ? parseInt(e.target.value) : undefined)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Host</Label>
            <Input placeholder="proxy.example.com" value={form.host || ""} onChange={e => update("host", e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Username</Label>
              <Input placeholder="proxy_user" value={form.username || ""} onChange={e => update("username", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Password</Label>
              <Input type="password" placeholder="••••••••" value={form.password || ""} onChange={e => update("password", e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Country</Label>
              <Select value={form.country || ""} onValueChange={v => update("country", v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.country === "US" && (
              <div className="space-y-1.5">
                <Label className="text-xs">State</Label>
                <Select value={form.state || ""} onValueChange={v => update("state", v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {US_STATES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">City</Label>
              <Input placeholder="e.g. Dallas" value={form.city || ""} onChange={e => update("city", e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_rotating ?? true} onCheckedChange={v => update("is_rotating", v)} />
              <Label className="text-xs">Rotating IPs</Label>
            </div>
            {!form.is_rotating && (
              <div className="space-y-1.5 flex-1">
                <Label className="text-xs">Sticky TTL (seconds)</Label>
                <Input type="number" placeholder="600" value={form.sticky_session_ttl ?? ""} onChange={e => update("sticky_session_ttl", e.target.value ? parseInt(e.target.value) : undefined)} />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea placeholder="Any additional notes..." rows={2} value={form.notes || ""} onChange={e => update("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave({ ...form, proxy_type: "residential" })} disabled={saving || !form.name?.trim() || !form.host?.trim()}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? "Saving..." : isEdit ? "Update" : "Add Proxy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Custom Proxy Card ─── */
function CustomProxyCard({
  config, onEdit, onDelete, deleting,
}: {
  config: ProxyConfig; onEdit: () => void; onDelete: () => void; deleting: boolean;
}) {
  return (
    <Card className="relative">
      {config.is_default && <Badge className="absolute top-3 right-3 text-[10px]">Default</Badge>}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">{config.name}</CardTitle>
        </div>
        <CardDescription className="text-xs">
          {config.provider === "bright_data" ? "Bright Data" : config.provider === "smartproxy" ? "Smartproxy" : config.provider === "oxylabs" ? "Oxylabs" : "Custom"}
          {config.country && ` · ${config.country}`}
          {config.state && ` / ${config.state.replace(/_/g, " ")}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <HealthBadge status={config.health_status} />
          <Badge variant="outline" className="text-xs">
            {config.is_rotating ? "Rotating" : `Sticky ${config.sticky_session_ttl ? `${config.sticky_session_ttl}s` : ""}`}
          </Badge>
          {config.protocol !== "http" && (
            <Badge variant="outline" className="text-xs uppercase">{config.protocol}</Badge>
          )}
        </div>
        {config.host && (
          <p className="text-xs text-muted-foreground font-mono truncate">{config.host}:{config.port || "—"}</p>
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={onEdit}>
            <Pencil className="h-3 w-3" /> Edit
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={onDelete} disabled={deleting}>
            <Trash2 className="h-3 w-3" /> {deleting ? "..." : "Remove"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Creator Proxy Assignment ─── */
function CreatorProxyAssignment({ configs }: { configs: ProxyConfig[] }) {
  const { creators } = useCreators();
  const { assignToCreator } = useProxyConfigs();

  if (!creators?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Assign Proxies to Creators
        </CardTitle>
        <CardDescription>
          Each creator can use a different proxy for geographic consistency. Unassigned creators use the default Browserbase residential proxy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {creators.map(creator => {
            const currentConfigId = (creator as any).proxy_config_id || "";
            return (
              <div key={creator.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{creator.name}</span>
                  {creator.alias && <span className="text-xs text-muted-foreground ml-1">({creator.alias})</span>}
                </div>
                <Select
                  value={currentConfigId}
                  onValueChange={v => assignToCreator.mutate({ creatorId: creator.id, configId: v || null })}
                >
                  <SelectTrigger className="w-[220px] h-8 text-xs">
                    <SelectValue placeholder="Default (Browserbase)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Default (Browserbase)</SelectItem>
                    {configs.filter(c => c.is_active).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Component ─── */
export function ProxyGeoSettings() {
  const { configs, isLoading, createConfig, updateConfig, deleteConfig } = useProxyConfigs();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<ProxyConfig>>(EMPTY_CUSTOM);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const customConfigs = configs.filter(c => c.provider !== "browserbase");

  const openAdd = () => { setEditData(EMPTY_CUSTOM); setDialogOpen(true); };
  const openEdit = (config: ProxyConfig) => { setEditData(config); setDialogOpen(true); };

  const handleSave = (data: Partial<ProxyConfig>) => {
    if (data.id) {
      updateConfig.mutate(data as any, { onSuccess: () => setDialogOpen(false) });
    } else {
      createConfig.mutate(data, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteConfig.mutate(id, { onSettled: () => setDeletingId(null) });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="browserbase">
        <TabsList>
          <TabsTrigger value="browserbase" className="gap-2"><Globe className="h-4 w-4" />Browserbase Proxy</TabsTrigger>
          <TabsTrigger value="custom" className="gap-2"><Settings2 className="h-4 w-4" />Custom Proxy</TabsTrigger>
          <TabsTrigger value="assign" className="gap-2"><Users className="h-4 w-4" />Creator Assignment</TabsTrigger>
        </TabsList>

        <TabsContent value="browserbase" className="space-y-4">
          <BrowserbaseProxyForm />
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" />
                    Custom Residential Proxies
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Add your own residential proxy from providers like Bright Data, Smartproxy, or Oxylabs for premium IP quality.
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={openAdd} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Proxy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
              ) : customConfigs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No custom proxies configured yet.</p>
                  <p className="text-xs mt-1">Sessions use Browserbase's built-in residential proxies by default.</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {customConfigs.map(c => (
                    <CustomProxyCard
                      key={c.id}
                      config={c}
                      onEdit={() => openEdit(c)}
                      onDelete={() => handleDelete(c.id)}
                      deleting={deletingId === c.id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assign" className="space-y-4">
          <CreatorProxyAssignment configs={configs} />
        </TabsContent>
      </Tabs>

      <CustomProxyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editData}
        onSave={handleSave}
        saving={createConfig.isPending || updateConfig.isPending}
      />
    </div>
  );
}
