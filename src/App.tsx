import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Creators from "./pages/Creators";
import CreatorDetail from "./pages/CreatorDetail";
import Employees from "./pages/Employees";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Messages from "./pages/Messages";
import SOPLibrary from "./pages/SOPLibrary";
import Invoices from "./pages/Invoices";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Recruiting from "./pages/Recruiting";
import Chatters from "./pages/Chatters";
import ShiftRoster from "./pages/ShiftRoster";
import InternalMessages from "./pages/InternalMessages";
import { PortalDashboard, PortalTasks, PortalMessages, PortalInvoices, PortalContent } from "./pages/portal";
import PortalContentPlans from "./pages/portal/PortalContentPlans";

const queryClient = new QueryClient();

// Auth component now handles its own redirects internally

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />
      
      {/* Auth Route */}
      <Route path="/auth" element={<Auth />} />
      
      {/* Agency Routes - Protected */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/creators" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <Creators />
        </ProtectedRoute>
      } />
      <Route path="/creators/:id" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <CreatorDetail />
        </ProtectedRoute>
      } />
      <Route path="/employees" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <Employees />
        </ProtectedRoute>
      } />
      <Route path="/tasks" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <Tasks />
        </ProtectedRoute>
      } />
      <Route path="/calendar" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <Calendar />
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <Messages />
        </ProtectedRoute>
      } />
      <Route path="/sop" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <SOPLibrary />
        </ProtectedRoute>
      } />
      <Route path="/invoices" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <Invoices />
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <Notifications />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/recruiting" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <Recruiting />
        </ProtectedRoute>
      } />
      <Route path="/chatters" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <Chatters />
        </ProtectedRoute>
      } />
      <Route path="/shifts" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <ShiftRoster />
        </ProtectedRoute>
      } />
      <Route path="/internal-messages" element={
        <ProtectedRoute allowedUserTypes={["agency"]}>
          <InternalMessages />
        </ProtectedRoute>
      } />
      
      {/* Creator Portal Routes - Protected */}
      <Route path="/portal" element={
        <ProtectedRoute allowedUserTypes={["creator"]}>
          <PortalDashboard />
        </ProtectedRoute>
      } />
      <Route path="/portal/tasks" element={
        <ProtectedRoute allowedUserTypes={["creator"]}>
          <PortalTasks />
        </ProtectedRoute>
      } />
      <Route path="/portal/messages" element={
        <ProtectedRoute allowedUserTypes={["creator"]}>
          <PortalMessages />
        </ProtectedRoute>
      } />
      <Route path="/portal/invoices" element={
        <ProtectedRoute allowedUserTypes={["creator"]}>
          <PortalInvoices />
        </ProtectedRoute>
      } />
      <Route path="/portal/content" element={
        <ProtectedRoute allowedUserTypes={["creator"]}>
          <PortalContent />
        </ProtectedRoute>
      } />
      <Route path="/portal/plans" element={
        <ProtectedRoute allowedUserTypes={["creator"]}>
          <PortalContentPlans />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
