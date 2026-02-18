import { Monitor, Bell, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSessionLauncher } from "@/components/browser/AdminSessionLauncher";
import { BrowserSessionsDashboard } from "@/components/browser/BrowserSessionsDashboard";
import { CaptchaAlertsFeed } from "@/components/browser/CaptchaAlertsFeed";
import { ProxyGeoSettings } from "@/components/browser/ProxyGeoSettings";

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
            <TabsTrigger value="proxy-settings" className="gap-2">
              <MapPin className="h-4 w-4" />
              Proxy Settings
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-2">
              <Bell className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live-sessions" className="space-y-4">
            <AdminSessionLauncher />
            <BrowserSessionsDashboard />
          </TabsContent>

          <TabsContent value="proxy-settings" className="space-y-4">
            <ProxyGeoSettings />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <CaptchaAlertsFeed />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}