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

export function ProxyGeoSettings() {
  const { creators } = useCreators();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { country: string; state: string }>>({});

  const getEdit = (creatorId: string, creator: any) => {
    return edits[creatorId] || {
      country: creator.proxy_country || "",
      state: creator.proxy_state || "",
    };
  };

  const updateEdit = (creatorId: string, field: "country" | "state", value: string) => {
    setEdits((prev) => ({
      ...prev,
      [creatorId]: {
        ...getEdit(creatorId, creators?.find((c) => c.id === creatorId)),
        [field]: value,
      },
    }));
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
      })
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
          Set proxy location per creator to match their claimed geographic location. 
          Sessions will route traffic through the selected country/state.
        </p>

        <div className="space-y-4">
          {creators?.map((creator) => {
            const edit = getEdit(creator.id, creator);
            const hasChanges = edits[creator.id] !== undefined;

            return (
              <div key={creator.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{creator.name}</span>
                  {creator.alias && (
                    <span className="text-xs text-muted-foreground ml-1">({creator.alias})</span>
                  )}
                  {(creator as any).proxy_country && !hasChanges && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {(creator as any).proxy_country}
                      {(creator as any).proxy_state && ` / ${(creator as any).proxy_state}`}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={edit.country}
                    onValueChange={(v) => updateEdit(creator.id, "country", v)}
                  >
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue placeholder="Country..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No proxy</SelectItem>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {edit.country === "US" && (
                    <Select
                      value={edit.state}
                      onValueChange={(v) => updateEdit(creator.id, "state", v)}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="State..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any state</SelectItem>
                        {US_STATES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
