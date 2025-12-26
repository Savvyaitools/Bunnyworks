import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Creators from "./pages/Creators";
import Employees from "./pages/Employees";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Messages from "./pages/Messages";
import SOPLibrary from "./pages/SOPLibrary";
import Invoices from "./pages/Invoices";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { PortalDashboard, PortalTasks, PortalMessages, PortalInvoices, PortalContent } from "./pages/portal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/sop" element={<SOPLibrary />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          {/* Creator Portal Routes */}
          <Route path="/portal" element={<PortalDashboard />} />
          <Route path="/portal/tasks" element={<PortalTasks />} />
          <Route path="/portal/messages" element={<PortalMessages />} />
          <Route path="/portal/invoices" element={<PortalInvoices />} />
          <Route path="/portal/content" element={<PortalContent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
