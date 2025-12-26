import { useState } from "react";
import { User, Bell, Building, Shield, Palette, CreditCard } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "agency", label: "Agency", icon: Building },
  { id: "security", label: "Security", icon: Shield },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

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
                  <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl">SA</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" className="bg-transparent border-border hover:bg-muted">
                      Change Avatar
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-muted-foreground">First Name</Label>
                    <Input 
                      id="firstName" 
                      defaultValue="Savvy" 
                      className="bg-muted/50 border-border focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-muted-foreground">Last Name</Label>
                    <Input 
                      id="lastName" 
                      defaultValue="Admin" 
                      className="bg-muted/50 border-border focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      defaultValue="admin@creatoragency.com" 
                      className="bg-muted/50 border-border focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-muted-foreground">Phone</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      defaultValue="+1 (555) 123-4567" 
                      className="bg-muted/50 border-border focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-gradient-primary hover:opacity-90 shadow-glow-sm">
                    Save Changes
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agencyName" className="text-muted-foreground">Agency Name</Label>
                    <Input 
                      id="agencyName" 
                      defaultValue="PremiumFangirls" 
                      className="bg-muted/50 border-border focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-muted-foreground">Website</Label>
                    <Input 
                      id="website" 
                      defaultValue="https://premiumfangirls.com" 
                      className="bg-muted/50 border-border focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="defaultSplit" className="text-muted-foreground">Default Revenue Split (%)</Label>
                    <Input 
                      id="defaultSplit" 
                      type="number" 
                      defaultValue="30" 
                      className="bg-muted/50 border-border focus:border-primary max-w-32"
                    />
                    <p className="text-xs text-muted-foreground">This is the agency's default cut from creator earnings</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-gradient-primary hover:opacity-90 shadow-glow-sm">
                    Save Changes
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
                    <Label htmlFor="currentPassword" className="text-muted-foreground">Current Password</Label>
                    <Input 
                      id="currentPassword" 
                      type="password" 
                      className="bg-muted/50 border-border focus:border-primary max-w-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-muted-foreground">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      className="bg-muted/50 border-border focus:border-primary max-w-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-muted-foreground">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      className="bg-muted/50 border-border focus:border-primary max-w-md"
                    />
                  </div>
                </div>

                <Separator className="bg-border" />

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" className="bg-transparent border-border hover:bg-muted">
                    Enable 2FA
                  </Button>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-gradient-primary hover:opacity-90 shadow-glow-sm">
                    Update Password
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
