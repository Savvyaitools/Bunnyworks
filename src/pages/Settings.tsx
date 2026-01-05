import { useState, useEffect, useCallback } from "react";
import { User, Bell, Building, Shield, Plug, Copy, RefreshCw, Check, Loader2, ExternalLink, Download } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAgency } from "@/hooks/useAgency";
import { useAgencyLogo } from "@/hooks/useAgencyLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared";
import { LogoUpload } from "@/components/shared/LogoUpload";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "agency", label: "Agency", icon: Building },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "security", label: "Security", icon: Shield },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const { profile, user } = useAuth();
  const { agency, updateAgency, isUpdating, limits, refetch: refetchAgency } = useAgency();
  const { uploadLogo, deleteLogo, uploading: logoUploading, logoUrl } = useAgencyLogo();
  
  // Browser Sync state
  const [browserSyncEnabled, setBrowserSyncEnabled] = useState(false);
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [togglingSync, setTogglingSync] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [checkingExtension, setCheckingExtension] = useState(true);

  // Extension ID - replace with your actual published extension ID
  const EXTENSION_ID = "YOUR_CHROME_EXTENSION_ID";
  const CHROME_STORE_URL = `https://chrome.google.com/webstore/detail/${EXTENSION_ID}`;

  // Check if Chrome extension is installed
  const checkExtensionInstalled = useCallback(async () => {
    setCheckingExtension(true);
    try {
      // Check if extension injected a marker element (safest cross-browser approach)
      const extensionMarker = document.getElementById('creator-os-extension-marker');
      if (extensionMarker) {
        setExtensionInstalled(true);
        setCheckingExtension(false);
        return;
      }

      // Try Chrome runtime messaging if available
      const chromeRuntime = (window as any).chrome?.runtime;
      if (chromeRuntime?.sendMessage) {
        chromeRuntime.sendMessage(EXTENSION_ID, { type: 'PING' }, (response: any) => {
          setExtensionInstalled(!!response);
          setCheckingExtension(false);
        });
        // Timeout fallback
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

  // Sync browser sync state when agency loads
  useEffect(() => {
    if (agency) {
      setBrowserSyncEnabled((agency as any).browser_sync_enabled ?? false);
    }
  }, [agency]);

  // Set global handler for LogoUpload
  useEffect(() => {
    (window as any).__logoUploadHandler = uploadLogo;
    return () => {
      delete (window as any).__logoUploadHandler;
    };
  }, [uploadLogo]);
  // Profile form state
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || "",
    email: profile?.email || "",
  });

  // Agency form state
  const [agencyData, setAgencyData] = useState({
    name: "",
    website: "",
    commission_rate: 30,
  });

  // Sync agency data when loaded
  useEffect(() => {
    if (agency) {
      setAgencyData({
        name: agency.name || "",
        website: agency.website || "",
        commission_rate: (agency.commission_rate || 0.3) * 100,
      });
    }
  }, [agency]);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Toggle Browser Sync
  const handleToggleBrowserSync = async (enabled: boolean) => {
    if (!agency) return;
    setTogglingSync(true);
    
    try {
      const { error } = await supabase
        .from("agencies")
        .update({ browser_sync_enabled: enabled } as any)
        .eq("id", agency.id);

      if (error) throw error;
      
      setBrowserSyncEnabled(enabled);
      toast.success(enabled ? "Browser Sync enabled" : "Browser Sync disabled");
      refetchAgency();
    } catch (error) {
      console.error("Error toggling browser sync:", error);
      toast.error("Failed to update Browser Sync setting");
    } finally {
      setTogglingSync(false);
    }
  };

  // Generate sync token
  const handleGenerateToken = async () => {
    if (!agency) return;
    setGeneratingToken(true);

    try {
      // Generate a random token
      const token = crypto.randomUUID() + "-" + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const { error } = await supabase
        .from("browser_sync_tokens")
        .insert({
          agency_id: agency.id,
          token,
          expires_at: expiresAt.toISOString(),
        } as any);

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

  // Copy token to clipboard
  const handleCopyToken = async () => {
    if (!syncToken) return;
    
    try {
      await navigator.clipboard.writeText(syncToken);
      setCopied(true);
      toast.success("Token copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy token");
    }
  };

  // Open the Chrome extension popup with token
  const handleOpenExtension = () => {
    if (!syncToken) return;
    const extensionUrl = `chrome-extension://${EXTENSION_ID}/popup.html?token=${encodeURIComponent(syncToken)}`;
    window.open(extensionUrl, '_blank');
  };

  // Open Chrome Web Store to install extension
  const handleInstallExtension = () => {
    window.open(CHROME_STORE_URL, '_blank');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: profileData.full_name })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;
      
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 shrink-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <nav className="glass-card p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 animate-fade-in" style={{ animationDelay: "150ms" }}>
            {activeTab === "profile" && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Profile Settings</h2>
                  <p className="text-sm text-muted-foreground">Update your personal information</p>
                </div>

                <Separator className="bg-border" />

                <div className="flex items-center gap-6">
                  <UserAvatar 
                    name={profile?.full_name || "User"} 
                    avatarSeed={profile?.avatar_url}
                    className="h-20 w-20 ring-4 ring-primary/20"
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Avatar is automatically generated based on your name
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-muted-foreground">Full Name</Label>
                    <Input 
                      id="fullName" 
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      className="bg-muted/50 border-border focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile?.email || ""}
                      disabled
                      className="bg-muted/50 border-border opacity-60"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    className="bg-gradient-primary hover:opacity-90 shadow-glow-sm"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Notification Preferences</h2>
                  <p className="text-sm text-muted-foreground">Choose what you want to be notified about</p>
                </div>

                <Separator className="bg-border" />

                <div className="space-y-4">
                  {[
                    { id: "messages", label: "New messages", description: "Get notified when you receive a message", default: true },
                    { id: "tasks", label: "Task updates", description: "Notifications for task assignments and completions", default: true },
                    { id: "creators", label: "Creator activity", description: "When creators complete onboarding or submit content", default: true },
                    { id: "invoices", label: "Invoice notifications", description: "Payment received and overdue reminders", default: false },
                    { id: "system", label: "System updates", description: "News and updates about Creator OS", default: false },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch defaultChecked={item.default} className="data-[state=checked]:bg-primary" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "agency" && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Agency Settings</h2>
                  <p className="text-sm text-muted-foreground">Configure your agency details and branding</p>
                </div>

                <Separator className="bg-border" />

                {/* Logo Upload Section */}
                <div className="space-y-4">
                  <Label className="text-muted-foreground">Agency Logo</Label>
                  <LogoUpload
                    currentLogoUrl={logoUrl}
                    agencyName={agency?.name || "Agency"}
                    onUploadComplete={() => {}}
                    onDelete={deleteLogo}
                    uploading={logoUploading}
                    size="lg"
                  />
                </div>

                <Separator className="bg-border" />

                {agency && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Plan: <span className="capitalize">{agency.subscription_tier}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Creators: {limits?.currentCreators ?? 0}/{agency.max_creators} • 
                          Employees: {limits?.currentEmployees ?? 0}/{agency.max_employees}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agencyName" className="text-muted-foreground">Agency Name</Label>
                    <Input 
                      id="agencyName" 
                      value={agencyData.name}
                      onChange={(e) => setAgencyData({ ...agencyData, name: e.target.value })}
                      className="bg-muted/50 border-border focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-muted-foreground">Website</Label>
                    <Input 
                      id="website" 
                      value={agencyData.website}
                      onChange={(e) => setAgencyData({ ...agencyData, website: e.target.value })}
                      className="bg-muted/50 border-border focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="defaultSplit" className="text-muted-foreground">Default Revenue Split (%)</Label>
                    <Input 
                      id="defaultSplit" 
                      type="number" 
                      min={0}
                      max={100}
                      value={agencyData.commission_rate}
                      onChange={(e) => setAgencyData({ ...agencyData, commission_rate: Number(e.target.value) })}
                      className="bg-muted/50 border-border focus:border-primary max-w-32"
                    />
                    <p className="text-xs text-muted-foreground">This is the agency's default cut from creator earnings</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    className="bg-gradient-primary hover:opacity-90 shadow-glow-sm"
                    onClick={() => updateAgency({
                      name: agencyData.name,
                      website: agencyData.website || null,
                      commission_rate: agencyData.commission_rate / 100,
                    })}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "integrations" && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Integrations</h2>
                  <p className="text-sm text-muted-foreground">Connect external tools and services</p>
                </div>

                <Separator className="bg-border" />

                {/* Browser Sync Integration */}
                <div className="space-y-4">
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
                          Sync data directly from your browser using a Chrome extension
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={browserSyncEnabled}
                      onCheckedChange={handleToggleBrowserSync}
                      disabled={togglingSync}
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
                            
                            {/* Action Buttons */}
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

                            {/* Token Display (collapsed by default) */}
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
            )}

            {activeTab === "security" && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Security Settings</h2>
                  <p className="text-sm text-muted-foreground">Manage your password and security preferences</p>
                </div>

                <Separator className="bg-border" />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-muted-foreground">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="bg-muted/50 border-border focus:border-primary max-w-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-muted-foreground">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="bg-muted/50 border-border focus:border-primary max-w-md"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    className="bg-gradient-primary hover:opacity-90 shadow-glow-sm"
                    onClick={handleUpdatePassword}
                    disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                  >
                    {saving ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
