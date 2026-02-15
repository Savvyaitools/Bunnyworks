import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrowserExtensions, useExtensionUpload } from "@/hooks/useBrowserFeatures";
import { Puzzle, Shield, BarChart3, Loader2, CheckCircle } from "lucide-react";

const EXTENSION_CONFIGS = [
  {
    type: "permission_guard" as const,
    name: "Permission Guard",
    description: "Hides the OnlyFans sidebar and blocks restricted pages based on employee permissions. Ensures chatters can only access sections they're allowed to.",
    icon: Shield,
    matchName: "Permission Guard",
  },
  {
    type: "analytics_scraper" as const,
    name: "Analytics Scraper",
    description: "Detects extension presence on OnlyFans & Fansly pages and extracts page data for importing analytics into CreatorOS.",
    icon: BarChart3,
    matchName: "Analytics Scraper",
  },
];

export function ExtensionActivationCards() {
  const { extensions, isLoading } = useBrowserExtensions();
  const uploadMutation = useExtensionUpload();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Puzzle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Browser Extensions</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Activate extensions to auto-inject into all browser sessions. Once activated, they load automatically in every new admin and chatter session.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {EXTENSION_CONFIGS.map((config) => {
          const existing = extensions.find(
            (e: any) => e.name === config.matchName && e.is_active
          );
          const isUploading = uploadMutation.isPending && uploadMutation.variables === config.type;
          const Icon = config.icon;

          return (
            <Card key={config.type} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {config.name}
                  </span>
                  {existing ? (
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Not Uploaded</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {config.description}
                </p>
                {existing ? (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium text-foreground/80">Browserbase ID:</span>{" "}
                      <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        {existing.browserbase_extension_id}
                      </code>
                    </p>
                    {existing.auto_inject && (
                      <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-[10px]">
                        Auto-inject enabled
                      </Badge>
                    )}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => uploadMutation.mutate(config.type)}
                    disabled={isUploading || uploadMutation.isPending}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Uploading to Browserbase...
                      </>
                    ) : (
                      <>
                        <Puzzle className="h-3 w-3 mr-1" />
                        Activate {config.name}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
