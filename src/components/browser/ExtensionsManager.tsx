import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useBrowserExtensions } from "@/hooks/useBrowserFeatures";
import { Puzzle, ExternalLink } from "lucide-react";

export function ExtensionsManager() {
  const { extensions, isLoading } = useBrowserExtensions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Puzzle className="h-5 w-5 text-primary" />
          Browser Extensions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Custom Chrome extensions can be injected into browser sessions for auto-metrics extraction, 
          helper tools, and more. Extensions marked as "Auto-inject" will be included in all new sessions.
        </p>

        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : extensions.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Puzzle className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <p className="text-sm text-muted-foreground">No extensions configured yet.</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>To add an extension:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Upload your extension ZIP to the Browserbase dashboard</li>
                <li>Copy the extension ID from Browserbase</li>
                <li>Add it here to auto-inject into sessions</li>
              </ol>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="https://docs.browserbase.com/features/browser-extensions" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Extension Docs
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {extensions.map((ext: any) => (
              <div key={ext.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div>
                  <span className="font-medium text-sm">{ext.name}</span>
                  {ext.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{ext.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {ext.auto_inject && (
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs">Auto-inject</Badge>
                  )}
                  <Badge variant={ext.is_active ? "default" : "secondary"} className="text-xs">
                    {ext.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
