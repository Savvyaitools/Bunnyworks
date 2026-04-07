import { useState, useEffect } from "react";
import { User, Bell, Building, Shield, CreditCard } from "lucide-react";
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
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared";
import { LogoUpload } from "@/components/shared/LogoUpload";
import { SUBSCRIPTION_TIERS } from "@/lib/subscriptionTiers";
import { PageHeader } from "@/components/shared/PageHeader";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "agency", label: "Agency", icon: Building },
  { id: "security", label: "Security", icon: Shield },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const { profile, user } = useAuth();
  const { agency, updateAgency, isUpdating, limits } = useAgency();
  const { uploadLogo, deleteLogo, uploading: logoUploading, logoUrl } = useAgencyLogo();
  const { subscription, checkoutLoading, initiateCheckout, paymentHistory } = useSubscription();

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

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
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
      <div className="space-y-6 max-w-[1000px]">
        <PageHeader title="Settings" subtitle="Manage your account and preferences" />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 shrink-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <nav className="glass-card p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 lg:gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <tab.icon className="h-4 w-4 lg:h-5 lg:w-5" />
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

                {/* Agency Branding Section - only for agency owners */}
                {profile?.user_type === "agency" && (
                  <>
                    <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Agency Branding</p>
                        <p className="text-xs text-muted-foreground">
                          This name and logo appear on creator applications, portals, and all whitelabeled pages.
                        </p>
                      </div>
                      <div className="flex items-center gap-5">
                        <LogoUpload
                          currentLogoUrl={logoUrl}
                          agencyName={agency?.name || "Agency"}
                          onUploadComplete={() => {}}
                          onDelete={deleteLogo}
                          uploading={logoUploading}
                          size="lg"
                        />
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="profileAgencyName" className="text-muted-foreground">Agency Name</Label>
                          <Input
                            id="profileAgencyName"
                            value={agencyData.name}
                            onChange={(e) => setAgencyData({ ...agencyData, name: e.target.value })}
                            className="bg-muted/50 border-border focus:border-primary"
                            placeholder="Your agency name"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateAgency({ name: agencyData.name })}
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Saving..." : "Update Branding"}
                        </Button>
                      </div>
                    </div>
                    <Separator className="bg-border" />
                  </>
                )}

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

            {activeTab === "billing" && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Billing & Subscription</h2>
                  <p className="text-sm text-muted-foreground">Manage your plan and payment history</p>
                </div>

                <Separator className="bg-border" />

                {/* Current Plan */}
                <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Plan</p>
                      <p className="text-2xl font-bold text-foreground uppercase">{subscription?.tier || "Core"}</p>
                    </div>
                    <Badge variant={subscription?.isActive ? "default" : "destructive"} className="text-xs">
                      {subscription?.status === "trialing" ? "Trial" : subscription?.status === "active" ? "Active" : subscription?.status || "Trialing"}
                    </Badge>
                  </div>
                  {subscription?.isTrialing && subscription.daysRemaining !== null && (
                    <p className="text-sm text-primary font-medium">
                      {subscription.daysRemaining > 0
                        ? `${subscription.daysRemaining} days remaining in trial`
                        : "Trial expired — upgrade to continue"}
                    </p>
                  )}
                </div>

                {/* Upgrade Options */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Available Plans</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(["core", "scale", "pro"] as const).map((tierId) => {
                      const tier = SUBSCRIPTION_TIERS[tierId];
                      const isCurrent = subscription?.tier === tierId;
                      return (
                        <div
                          key={tierId}
                          className={cn(
                            "p-4 rounded-xl border transition-colors",
                            isCurrent ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-foreground">{tier.name}</p>
                            {tier.discountLabel && (
                              <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {tier.discountLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-2xl font-bold text-foreground mb-1">
                            ${tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            {tier.maxCreators} creator{tier.maxCreators > 1 ? "s" : ""} · {tier.maxEmployees} team members
                          </p>
                          <Button
                            className={cn(
                              "w-full text-xs",
                              isCurrent ? "" : "bg-gradient-primary hover:opacity-90 shadow-glow-sm"
                            )}
                            variant={isCurrent ? "outline" : "default"}
                            disabled={isCurrent || checkoutLoading}
                            onClick={() => initiateCheckout(tierId)}
                          >
                            {isCurrent ? "Current Plan" : checkoutLoading ? "Processing..." : "Upgrade"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Need unlimited? <a href="mailto:sales@bunnyworksos.com" className="text-primary hover:underline">Contact sales</a> for Enterprise.
                  </p>
                </div>

                {/* Payment History */}
                {paymentHistory.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Payment History</h3>
                    <div className="space-y-2">
                      {paymentHistory.slice(0, 5).map((event: any) => (
                        <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
                          <div>
                            <p className="font-medium text-foreground capitalize">{event.event_type.replace(/_/g, " ")}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            {event.amount > 0 && (
                              <p className="font-medium text-foreground">${(event.amount / 100).toFixed(2)}</p>
                            )}
                            <Badge variant={event.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    { id: "system", label: "System updates", description: "News and updates about BunnyWorksOS", default: false },
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
                          Plan: <span className="uppercase font-bold">{agency.subscription_tier}</span>
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
