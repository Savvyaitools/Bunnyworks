import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ActiveBrowserSessionProvider } from "@/contexts/ActiveBrowserSessionContext";
import { ActiveSessionBanner } from "@/components/browser/ActiveSessionBanner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { CommandPalette } from "@/components/layout/CommandPalette";

// Eager load landing and auth pages for fast initial load
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import EmployeeAuth from "./pages/EmployeeAuth";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

// Lazy load all other pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Creators = lazy(() => import("./pages/Creators"));
const CreatorDetail = lazy(() => import("./pages/CreatorDetail"));
const Employees = lazy(() => import("./pages/Employees"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Messages = lazy(() => import("./pages/Messages"));
const SOPLibrary = lazy(() => import("./pages/SOPLibrary"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const Recruiting = lazy(() => import("./pages/Recruiting"));
const Chatters = lazy(() => import("./pages/Chatters"));
const ShiftRoster = lazy(() => import("./pages/ShiftRoster"));
const InternalMessages = lazy(() => import("./pages/InternalMessages"));

const Applications = lazy(() => import("./pages/Applications"));
const BrowserSync = lazy(() => import("./pages/BrowserSync"));
const UserGuide = lazy(() => import("./pages/UserGuide"));
const CoachPBF = lazy(() => import("./pages/Felix"));
const EmployeePerformance = lazy(() => import("./pages/EmployeePerformance"));

// Portal pages
const PortalDashboard = lazy(() => import("./pages/portal/PortalDashboard"));
const PortalMessages = lazy(() => import("./pages/portal/PortalMessages"));
const PortalInvoices = lazy(() => import("./pages/portal/PortalInvoices"));
const PortalContent = lazy(() => import("./pages/portal/PortalContent"));
const PortalContentPlans = lazy(() => import("./pages/portal/PortalContentPlans"));
const PortalTasks = lazy(() => import("./pages/portal/PortalTasks"));


// Employee pages
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const EmployeeTeamChat = lazy(() => import("./pages/employee/EmployeeTeamChat"));
const EmployeeShifts = lazy(() => import("./pages/employee/EmployeeShifts"));
const EmployeeTimeLogs = lazy(() => import("./pages/employee/EmployeeTimeLogs"));
const EmployeePerformancePage = lazy(() => import("./pages/employee/EmployeePerformance"));
const EmployeeBrowserSessions = lazy(() => import("./pages/employee/EmployeeBrowserSessions"));
const EmployeeCreatorHub = lazy(() => import("./pages/employee/EmployeeCreatorHub"));

// Tool pages
const CreatorDiscovery = lazy(() => import("./pages/tools/CreatorDiscovery"));

// Coach PBF pages
const SocialMediaManager = lazy(() => import("./pages/coach/SocialMediaManager"));
const AIChatterPage = lazy(() => import("./pages/coach/AIChatter"));

// Application pages
const CreatorApplication = lazy(() => import("./pages/apply/CreatorApplication"));
const EmployeeApplication = lazy(() => import("./pages/apply/EmployeeApplication"));

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Page loading skeleton
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 mt-8" />
      </div>
    </div>
  );
}

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />
        
        {/* Public Application Forms */}
        <Route path="/apply/creator/:agencyId" element={<CreatorApplication />} />
        <Route path="/apply/employee/:agencyId" element={<EmployeeApplication />} />
        
        
        
        {/* Legal Pages */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        
        {/* Auth Routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/employee-login" element={<EmployeeAuth />} />
        
        {/* Agency Routes - Protected */}
        <Route path="/dashboard" element={<ProtectedRoute allowedUserTypes={["agency"]}><Index /></ProtectedRoute>} />
        <Route path="/coach-pbf" element={<ProtectedRoute allowedUserTypes={["agency"]}><CoachPBF /></ProtectedRoute>} />
        <Route path="/creators" element={<ProtectedRoute allowedUserTypes={["agency"]}><Creators /></ProtectedRoute>} />
        <Route path="/creators/:id" element={<ProtectedRoute allowedUserTypes={["agency"]}><CreatorDetail /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute allowedUserTypes={["agency"]}><Employees /></ProtectedRoute>} />
        <Route path="/team/chatters" element={<ProtectedRoute allowedUserTypes={["agency"]}><Chatters /></ProtectedRoute>} />
        <Route path="/team/performance" element={<ProtectedRoute allowedUserTypes={["agency"]}><EmployeePerformance /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute allowedUserTypes={["agency"]}><Tasks /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute allowedUserTypes={["agency"]}><Calendar /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute allowedUserTypes={["agency"]}><Messages /></ProtectedRoute>} />
        <Route path="/sop" element={<ProtectedRoute allowedUserTypes={["agency"]}><SOPLibrary /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute allowedUserTypes={["agency"]}><Invoices /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute allowedUserTypes={["agency"]}><Notifications /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedUserTypes={["agency"]}><Settings /></ProtectedRoute>} />
        <Route path="/recruiting" element={<ProtectedRoute allowedUserTypes={["agency"]}><Recruiting /></ProtectedRoute>} />
        <Route path="/team-chat" element={<ProtectedRoute allowedUserTypes={["agency"]}><InternalMessages /></ProtectedRoute>} />
        <Route path="/shifts" element={<ProtectedRoute allowedUserTypes={["agency"]}><ShiftRoster /></ProtectedRoute>} />
        
        <Route path="/applications" element={<ProtectedRoute allowedUserTypes={["agency"]}><Applications /></ProtectedRoute>} />
        <Route path="/tools/creator-discovery" element={<ProtectedRoute allowedUserTypes={["agency"]}><CreatorDiscovery /></ProtectedRoute>} />
        <Route path="/browser-sync" element={<ProtectedRoute allowedUserTypes={["agency"]}><BrowserSync /></ProtectedRoute>} />
        <Route path="/guide" element={<ProtectedRoute allowedUserTypes={["agency"]}><UserGuide /></ProtectedRoute>} />
        <Route path="/agent-hub" element={<Navigate to="/coach-pbf" replace />} />
        <Route path="/coach/social-media" element={<ProtectedRoute allowedUserTypes={["agency"]}><SocialMediaManager /></ProtectedRoute>} />
        <Route path="/coach/ai-chatter" element={<ProtectedRoute allowedUserTypes={["agency"]}><AIChatterPage /></ProtectedRoute>} />
        
        {/* Legacy redirects */}
        <Route path="/felix" element={<Navigate to="/coach-pbf" replace />} />
        <Route path="/employees" element={<Navigate to="/team" replace />} />
        <Route path="/employees/performance" element={<Navigate to="/team/performance" replace />} />
        <Route path="/chatters" element={<Navigate to="/team/chatters" replace />} />
        <Route path="/internal-messages" element={<Navigate to="/team-chat" replace />} />
        <Route path="/of-dashboard" element={<Navigate to="/dashboard" replace />} />
        
        {/* Creator Portal Routes */}
        <Route path="/portal" element={<ProtectedRoute allowedUserTypes={["creator"]}><PortalDashboard /></ProtectedRoute>} />
        <Route path="/portal/messages" element={<ProtectedRoute allowedUserTypes={["creator"]}><PortalMessages /></ProtectedRoute>} />
        <Route path="/portal/invoices" element={<ProtectedRoute allowedUserTypes={["creator"]}><PortalInvoices /></ProtectedRoute>} />
        <Route path="/portal/content" element={<ProtectedRoute allowedUserTypes={["creator"]}><PortalContent /></ProtectedRoute>} />
        <Route path="/portal/plans" element={<ProtectedRoute allowedUserTypes={["creator"]}><PortalContentPlans /></ProtectedRoute>} />
        <Route path="/portal/tasks" element={<ProtectedRoute allowedUserTypes={["creator"]}><PortalTasks /></ProtectedRoute>} />
        
        
        {/* Employee Portal Routes */}
        <Route path="/employee" element={<ProtectedRoute allowedUserTypes={["employee"]}><EmployeeDashboard /></ProtectedRoute>} />
        <Route path="/employee/team-chat" element={<ProtectedRoute allowedUserTypes={["employee"]}><EmployeeTeamChat /></ProtectedRoute>} />
        <Route path="/employee/browser" element={<ProtectedRoute allowedUserTypes={["employee"]}><EmployeeBrowserSessions /></ProtectedRoute>} />
        <Route path="/employee/performance" element={<ProtectedRoute allowedUserTypes={["employee"]}><EmployeePerformancePage /></ProtectedRoute>} />
        <Route path="/employee/shifts" element={<ProtectedRoute allowedUserTypes={["employee"]}><EmployeeShifts /></ProtectedRoute>} />
        <Route path="/employee/time-logs" element={<ProtectedRoute allowedUserTypes={["employee"]}><EmployeeTimeLogs /></ProtectedRoute>} />
        <Route path="/employee/creators" element={<ProtectedRoute allowedUserTypes={["employee"]}><EmployeeCreatorHub /></ProtectedRoute>} />
        {/* Legacy redirects */}
        <Route path="/employee/onlyfans" element={<Navigate to="/employee/browser" replace />} />
        <Route path="/employee/messages" element={<Navigate to="/employee/team-chat" replace />} />
        <Route path="/employee/creator-messages" element={<Navigate to="/employee/browser" replace />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ActiveBrowserSessionProvider>
              <CommandPalette />
              <ActiveSessionBanner />
              <AppRoutes />
            </ActiveBrowserSessionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
