import { Monitor, Bell, MapPin, Globe, Shield } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSessionLauncher } from "@/components/browser/AdminSessionLauncher";
import { BrowserSessionsDashboard } from "@/components/browser/BrowserSessionsDashboard";
import { CaptchaAlertsFeed } from "@/components/browser/CaptchaAlertsFeed";
import { ProxyGeoSettings } from "@/components/browser/ProxyGeoSettings";
import { ProxyProviderManager } from "@/components/browser/ProxyProviderManager";
import { StealthProfileManager } from "@/components/browser/StealthProfileManager";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BrowserSync() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        <PageHeader
          title="Browser Sessions"
          subtitle="Manage live browser sessions and monitoring"
        />

        <Tabs defaultValue="live-sessions">
          <TabsList className="flex-wrap h-auto gap-1 bg-card/60 border border-border p-1">
            <TabsTrigger value="live-sessions" className="gap-2 text-sm">
              <Monitor className="h-3.5 w-3.5" />
              Live Sessions
            </TabsTrigger>
            <TabsTrigger value="proxy-settings" className="gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              Proxy Geo
            </TabsTrigger>
            <TabsTrigger value="proxy-providers" className="gap-2 text-sm">
              <Globe className="h-3.5 w-3.5" />
              Proxy Providers
            </TabsTrigger>
            <TabsTrigger value="stealth" className="gap-2 text-sm">
              <Shield className="h-3.5 w-3.5" />
              Stealth
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-2 text-sm">
              <Bell className="h-3.5 w-3.5" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live-sessions" className="space-y-4 mt-4">
            <AdminSessionLauncher />
            <BrowserSessionsDashboard />
          </TabsContent>

          <TabsContent value="proxy-settings" className="space-y-4 mt-4">
            <ProxyGeoSettings />
          </TabsContent>

          <TabsContent value="proxy-providers" className="space-y-4 mt-4">
            <ProxyProviderManager />
          </TabsContent>

          <TabsContent value="stealth" className="space-y-4 mt-4">
            <StealthProfileManager />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4 mt-4">
            <CaptchaAlertsFeed />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}