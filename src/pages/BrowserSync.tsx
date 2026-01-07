import { useState, useEffect, useCallback } from "react";
import { Plug, Copy, RefreshCw, Check, Loader2, ExternalLink, Download } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAgency } from "@/hooks/useAgency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function BrowserSync() {
  const { agency, refetch: refetchAgency, isLoading: isLoadingAgency } = useAgency();
  
  const [browserSyncEnabled, setBrowserSyncEnabled] = useState(false);
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [togglingSync, setTogglingSync] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [checkingExtension, setCheckingExtension] = useState(true);

  // Extension ID - replace with actual published extension ID
  const EXTENSION_ID = "YOUR_CHROME_EXTENSION_ID";
  const CHROME_STORE_URL = `https://chrome.google.com/webstore/detail/${EXTENSION_ID}`;

  // Check if Chrome extension is installed
  const checkExtensionInstalled = useCallback(async () => {
    setCheckingExtension(true);
    try {
      const extensionMarker = document.getElementById('creator-os-extension-marker');
      if (extensionMarker) {
        setExtensionInstalled(true);
        setCheckingExtension(false);
        return;
      }

      const chromeRuntime = (window as any).chrome?.runtime;
      if (chromeRuntime?.sendMessage) {
        chromeRuntime.sendMessage(EXTENSION_ID, { type: 'PING' }, (response: any) => {
          setExtensionInstalled(!!response);
          setCheckingExtension(false);
        });
        setTimeout(() => {
          setCheckingExtension(false);
        }, 1000);
      } else {
        setExtensionInstalled(false);
        setCheckingExtension(false);
      }
    } catch {
      setExtensionInstalled(false);
      setCheckingExtension(false);
    }
  }, [EXTENSION_ID]);

  useEffect(() => {
    checkExtensionInstalled();
  }, [checkExtensionInstalled]);

  useEffect(() => {
    if (agency) {
      setBrowserSyncEnabled(agency.browser_sync_enabled ?? false);
    }
  }, [agency]);

  const handleToggleBrowserSync = async (enabled: boolean) => {
    if (!agency) {
      toast.error("Agency not loaded. Please refresh the page.");
      return;
    }

    const previous = browserSyncEnabled;

    // Optimistic UI update so the toggle feels responsive
    setBrowserSyncEnabled(enabled);
    setTogglingSync(true);

    try {
      const { error } = await supabase
        .from("agencies")
        .update({ browser_sync_enabled: enabled })
        .eq("id", agency.id);

      if (error) throw error;

      toast.success(enabled ? "Browser Sync enabled" : "Browser Sync disabled");
      refetchAgency();
    } catch (error) {
      console.error("Error toggling browser sync:", error);
      setBrowserSyncEnabled(previous);
      toast.error("Failed to update Browser Sync setting");
    } finally {
      setTogglingSync(false);
    }
  };

  const handleGenerateToken = async () => {
    if (!agency) return;
    setGeneratingToken(true);

    try {
      const token = crypto.randomUUID() + "-" + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const { error } = await supabase
        .from("browser_sync_tokens")
        .insert({
          agency_id: agency.id,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      setSyncToken(token);
      setTokenExpiry(expiresAt);
      toast.success("Sync token generated (valid for 10 minutes)");
    } catch (error) {
      console.error("Error generating token:", error);
      toast.error("Failed to generate sync token");
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyToken = async () => {
    if (!syncToken) return;
    
    try {
      await navigator.clipboard.writeText(syncToken);
      setCopied(true);
      toast.success("Token copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy token");
    }
  };

  const handleOpenExtension = () => {
    if (!syncToken) return;
    const extensionUrl = `chrome-extension://${EXTENSION_ID}/popup.html?token=${encodeURIComponent(syncToken)}`;
    window.open(extensionUrl, '_blank');
  };

  const handleInstallExtension = () => {
    // Copy the extension URL to clipboard since chrome:// URLs can't be opened programmatically
    const extensionUrl = "chrome://extensions/?id=pdmkofggpojdooohngnghkjlihboppff";
    navigator.clipboard.writeText(extensionUrl).then(() => {
      toast.info("Extension URL copied! Paste it in your browser address bar to manage the extension.");
    }).catch(() => {
      toast.info(`Go to: ${extensionUrl}`);
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Browser</h1>
          <p className="text-muted-foreground mt-1">Sync data directly from your browser using a Chrome extension</p>
        </div>

        <div className="glass-card p-6 space-y-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plug className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">Browser Sync</p>
                  <Badge variant="outline" className="text-xs">Beta</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable to sync data from your browser extension
                </p>
              </div>
            </div>
            <Switch 
              checked={browserSyncEnabled}
              onCheckedChange={handleToggleBrowserSync}
              disabled={togglingSync || isLoadingAgency}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {browserSyncEnabled && (
            <div className="p-4 rounded-lg bg-muted/20 border border-border space-y-4">
              {/* Chrome Extension Status */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Chrome Extension</h3>
                {checkingExtension ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking extension status...
                  </div>
                ) : extensionInstalled ? (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs text-green-500 font-medium">Extension installed</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-xs text-amber-500 font-medium">Extension not detected</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleInstallExtension}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Install Chrome Extension
                    </Button>
                  </div>
                )}
              </div>

              <Separator className="bg-border" />

              {/* Sync Token Section */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Sync Token</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Generate a temporary token to authenticate the browser extension. Tokens expire after 10 minutes.
                </p>
                
                <Button
                  variant="outline"
                  onClick={handleGenerateToken}
                  disabled={generatingToken}
                  className="mb-3"
                >
                  {generatingToken ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Temporary Token
                    </>
                  )}
                </Button>

                {syncToken && (
                  <div className="space-y-3">
                    {tokenExpiry && (
                      <p className="text-xs text-muted-foreground">
                        Token expires at: {tokenExpiry.toLocaleTimeString()}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {extensionInstalled ? (
                        <Button
                          onClick={handleOpenExtension}
                          className="gap-2 bg-gradient-primary hover:opacity-90"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open Browser Sync Extension
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={handleInstallExtension}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Install Extension First
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={handleCopyToken}
                        className="gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Token
                          </>
                        )}
                      </Button>
                    </div>

                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Show raw token
                      </summary>
                      <code className="block mt-2 p-2 bg-muted/50 rounded border border-border font-mono text-xs break-all">
                        {syncToken}
                      </code>
                    </details>
                  </div>
                )}
              </div>

              <Separator className="bg-border" />

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">How it works</h3>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Install the Creator OS Chrome extension</li>
                  <li>Generate a temporary sync token above</li>
                  <li>Click "Open Browser Sync Extension" - token auto-fills</li>
                  <li>Browse to your creator platform and sync metrics</li>
                  <li>Data will appear in your Manual Data Import review queue</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
