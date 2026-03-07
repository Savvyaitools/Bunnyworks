import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { SubscriptionBanner } from "@/components/shared/SubscriptionBanner";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-background">
        <SubscriptionBanner />
        <main className="flex-1 overflow-auto overflow-x-hidden pb-16">
          <div className="p-4">
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <SubscriptionBanner />
          <div className="p-5 lg:p-8 xl:px-10">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
