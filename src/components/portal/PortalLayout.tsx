import { ReactNode } from "react";
import { PortalSidebar } from "./PortalSidebar";
import { PortalMobileNav } from "./PortalMobileNav";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface PortalLayoutProps {
  children: ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-background">
        <main className="flex-1 overflow-auto overflow-x-hidden pb-16">
          <div className="p-4">
            {children}
          </div>
        </main>
        <PortalMobileNav />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <PortalSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
