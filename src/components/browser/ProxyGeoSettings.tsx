import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCreators } from "@/hooks/useCreators";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Save } from "lucide-react";
import { toast } from "sonner";

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

/** States / regions per country. Only countries with region-level proxy support are listed. */
const REGIONS: Record<string, { value: string; label: string }[]> = {
  US: [
    "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
    "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
    "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
    "minnesota","mississippi","missouri","montana","nebraska","nevada","new_hampshire",
    "new_jersey","new_mexico","new_york","north_carolina","north_dakota","ohio",
    "oklahoma","oregon","pennsylvania","rhode_island","south_carolina","south_dakota",
    "tennessee","texas","utah","vermont","virginia","washington","west_virginia",
    "wisconsin","wyoming"
  ].map(s => ({ value: s, label: s.replace(/_/g, " ") })),
  GB: [
    { value: "england", label: "England" },
    { value: "scotland", label: "Scotland" },
    { value: "wales", label: "Wales" },
    { value: "northern_ireland", label: "Northern Ireland" },
  ],
  CA: [
    { value: "ontario", label: "Ontario" },
    { value: "quebec", label: "Quebec" },
    { value: "british_columbia", label: "British Columbia" },
    { value: "alberta", label: "Alberta" },
    { value: "manitoba", label: "Manitoba" },
    { value: "saskatchewan", label: "Saskatchewan" },
    { value: "nova_scotia", label: "Nova Scotia" },
    { value: "new_brunswick", label: "New Brunswick" },
  ],
  AU: [
    { value: "new_south_wales", label: "New South Wales" },
    { value: "victoria", label: "Victoria" },
    { value: "queensland", label: "Queensland" },
    { value: "western_australia", label: "Western Australia" },
    { value: "south_australia", label: "South Australia" },
    { value: "tasmania", label: "Tasmania" },
  ],
  DE: [
    { value: "bavaria", label: "Bavaria" },
    { value: "berlin", label: "Berlin" },
    { value: "hamburg", label: "Hamburg" },
    { value: "hesse", label: "Hesse" },
    { value: "north_rhine_westphalia", label: "North Rhine-Westphalia" },
    { value: "saxony", label: "Saxony" },
  ],
};

interface ProxyEdit {
  country: string;
  state: string;
  city: string;
}

export function ProxyGeoSettings() {
  const { creators } = useCreators();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, ProxyEdit>>({});

  const getEdit = (creatorId: string, creator: any): ProxyEdit => {
    return edits[creatorId] || {
      country: creator.proxy_country || "",
      state: creator.proxy_state || "",
      city: (creator as any).proxy_city || "",
    };
  };

  const updateEdit = (creatorId: string, field: keyof ProxyEdit, value: string) => {
    setEdits((prev) => {
      const current = getEdit(creatorId, creators?.find((c) => c.id === creatorId));
      const updated = { ...current, [field]: value };
      // Reset state & city when country changes
      if (field === "country") { updated.state = ""; updated.city = ""; }
      // Reset city when state changes
      if (field === "state") { updated.city = ""; }
      return { ...prev, [creatorId]: updated };
    });
  };

  const handleSave = async (creatorId: string) => {
    const edit = edits[creatorId];
    if (!edit) return;

    setSaving(creatorId);
    const { error } = await supabase
      .from("creators")
      .update({
        proxy_country: edit.country || null,
        proxy_state: edit.state || null,
        proxy_city: edit.city || null,
      } as any)
      .eq("id", creatorId);

    if (error) {
      toast.error("Failed to update proxy settings");
    } else {
      toast.success("Proxy geolocation updated");
      queryClient.invalidateQueries({ queryKey: ["creators"] });
      setEdits((prev) => {
        const next = { ...prev };
        delete next[creatorId];
        return next;
      });
    }
    setSaving(null);
  };

  const regionOptions = (country: string) => REGIONS[country] || [];

  const geoLabel = (creator: any) => {
    const parts = [(creator as any).proxy_country, (creator as any).proxy_state, (creator as any).proxy_city].filter(Boolean);
    return parts.length ? parts.join(" / ") : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Proxy Geolocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Set proxy location per creator — Country, State/Region, and City.
          Sessions route traffic through the selected geolocation for IP consistency.
        </p>

        <div className="space-y-4">
          {creators?.map((creator) => {
            const edit = getEdit(creator.id, creator);
            const hasChanges = edits[creator.id] !== undefined;
            const regions = regionOptions(edit.country);

            return (
              <div key={creator.id} className="flex flex-col gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{creator.name}</span>
                    {creator.alias && (
                      <span className="text-xs text-muted-foreground">({creator.alias})</span>
                    )}
                  </div>
                  {!hasChanges && geoLabel(creator) && (
                    <Badge variant="outline" className="text-xs">
                      {geoLabel(creator)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Country */}
                  <Select
                    value={edit.country}
                    onValueChange={(v) => updateEdit(creator.id, "country", v)}
                  >
                    <SelectTrigger className="w-[150px] h-8 text-xs">
                      <SelectValue placeholder="Country..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No proxy</SelectItem>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* State / Region */}
                  {edit.country && regions.length > 0 && (
                    <Select
                      value={edit.state}
                      onValueChange={(v) => updateEdit(creator.id, "state", v)}
                    >
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="State/Region..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        {regions.map((r) => (
                          <SelectItem key={r.value} value={r.value} className="capitalize">
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* City — free text input */}
                  {edit.country && (
                    <Input
                      placeholder="City (optional)"
                      value={edit.city}
                      onChange={(e) => updateEdit(creator.id, "city", e.target.value)}
                      className="w-[140px] h-8 text-xs"
                    />
                  )}

                  {hasChanges && (
                    <Button
                      size="sm"
                      onClick={() => handleSave(creator.id)}
                      disabled={saving === creator.id}
                      className="h-8 text-xs"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {saving === creator.id ? "Saving..." : "Save"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {(!creators || creators.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No creators found. Add creators to configure proxy geolocation.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
