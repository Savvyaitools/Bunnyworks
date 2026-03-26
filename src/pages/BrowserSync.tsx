import { Monitor, Bell, MapPin, Globe, Lock } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSessionLauncher } from "@/components/browser/AdminSessionLauncher";
import { BrowserSessionsDashboard } from "@/components/browser/BrowserSessionsDashboard";
import { CaptchaAlertsFeed } from "@/components/browser/CaptchaAlertsFeed";
import { ProxyGeoSettings } from "@/components/browser/ProxyGeoSettings";
import { ProxyProviderManager } from "@/components/browser/ProxyProviderManager";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";

export default function BrowserSync() {
  const { profile, user } = useAuth();
  const userEmail = profile?.email || user?.email;
  const isUnlocked = userEmail?.toLowerCase() === "testing26@gmail.com";

  if (!isUnlocked) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full border-border/50">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Feature Locked</h2>
              <p className="text-sm text-muted-foreground text-center">
                Platform Access is restricted. Contact your admin to request access.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Platform Access"
          subtitle="Manage live platform sessions and monitoring"
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

          <TabsContent value="monitoring" className="space-y-4 mt-4">
            <CaptchaAlertsFeed />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
