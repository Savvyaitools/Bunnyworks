import { Monitor, Bell, Puzzle, Shield, Flame } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSessionLauncher } from "@/components/browser/AdminSessionLauncher";
import { BrowserSessionsDashboard } from "@/components/browser/BrowserSessionsDashboard";
import { CaptchaAlertsFeed } from "@/components/browser/CaptchaAlertsFeed";
import { ExtensionActivationCards } from "@/components/browser/ExtensionActivationCards";
import { SessionModeToggle } from "@/components/browser/SessionModeToggle";
import { ProfileWarmupManager } from "@/components/browser/ProfileWarmupManager";

export default function BrowserSync() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Browser</h1>
          <p className="text-muted-foreground mt-1">Manage live browser sessions and monitoring</p>
        </div>

        <Tabs defaultValue="live-sessions" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="live-sessions" className="gap-2">
              <Monitor className="h-4 w-4" />
              Live Sessions
            </TabsTrigger>
            <TabsTrigger value="profile-builder" className="gap-2">
              <Flame className="h-4 w-4" />
              Profile Builder
            </TabsTrigger>
            <TabsTrigger value="extensions" className="gap-2">
              <Puzzle className="h-4 w-4" />
              Extensions
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-2">
              <Bell className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Shield className="h-4 w-4" />
              Session Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live-sessions" className="space-y-4">
            <AdminSessionLauncher />
            <BrowserSessionsDashboard />
          </TabsContent>

          <TabsContent value="profile-builder" className="space-y-4">
            <ProfileWarmupManager />
          </TabsContent>

          <TabsContent value="extensions" className="space-y-4">
            <ExtensionActivationCards />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <CaptchaAlertsFeed />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SessionModeToggle />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}