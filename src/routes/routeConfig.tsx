/**
 * Declarative route configuration for the application.
 * Eliminates repetitive ProtectedRoute + ErrorBoundary wrapping in App.tsx.
 */

import { lazy } from "react";
import { Navigate } from "react-router-dom";

// Eager-loaded pages
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import EmployeeAuth from "@/pages/EmployeeAuth";
import NotFound from "@/pages/NotFound";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

// Lazy-loaded pages
const Index = lazy(() => import("@/pages/Index"));
const Creators = lazy(() => import("@/pages/Creators"));
const CreatorDetail = lazy(() => import("@/pages/CreatorDetail"));
const Employees = lazy(() => import("@/pages/Employees"));
const Tasks = lazy(() => import("@/pages/Tasks"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const Messages = lazy(() => import("@/pages/Messages"));
const SOPLibrary = lazy(() => import("@/pages/SOPLibrary"));
const Invoices = lazy(() => import("@/pages/Invoices"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Settings = lazy(() => import("@/pages/Settings"));
const Recruiting = lazy(() => import("@/pages/Recruiting"));
const Chatters = lazy(() => import("@/pages/Chatters"));
const ShiftRoster = lazy(() => import("@/pages/ShiftRoster"));
const InternalMessages = lazy(() => import("@/pages/InternalMessages"));
const Applications = lazy(() => import("@/pages/Applications"));
const BrowserSync = lazy(() => import("@/pages/BrowserSync"));
const UserGuide = lazy(() => import("@/pages/UserGuide"));
const CoachPBF = lazy(() => import("@/pages/Felix"));
const EmployeePerformance = lazy(() => import("@/pages/EmployeePerformance"));
const FanAnalytics = lazy(() => import("@/pages/FanAnalytics"));

// Portal pages
const PortalDashboard = lazy(() => import("@/pages/portal/PortalDashboard"));
const PortalMessages = lazy(() => import("@/pages/portal/PortalMessages"));
const PortalInvoices = lazy(() => import("@/pages/portal/PortalInvoices"));
const PortalContent = lazy(() => import("@/pages/portal/PortalContent"));
const PortalContentPlans = lazy(() => import("@/pages/portal/PortalContentPlans"));

// Employee pages
const EmployeeDashboard = lazy(() => import("@/pages/employee/EmployeeDashboard"));
const EmployeeTeamChat = lazy(() => import("@/pages/employee/EmployeeTeamChat"));
const EmployeeShifts = lazy(() => import("@/pages/employee/EmployeeShifts"));
const EmployeeTimeLogs = lazy(() => import("@/pages/employee/EmployeeTimeLogs"));
const EmployeePerformancePage = lazy(() => import("@/pages/employee/EmployeePerformance"));
const EmployeeBrowserSessions = lazy(() => import("@/pages/employee/EmployeeBrowserSessions"));
const EmployeeCreatorHub = lazy(() => import("@/pages/employee/EmployeeCreatorHub"));

// Tool pages
const CreatorDiscovery = lazy(() => import("@/pages/tools/CreatorDiscovery"));

// Coach pages
const SocialMediaManager = lazy(() => import("@/pages/coach/SocialMediaManager"));
const AIChatterPage = lazy(() => import("@/pages/coach/AIChatter"));
const AIImageGenerator = lazy(() => import("@/pages/coach/AIImageGenerator"));
const AIVoiceGenerator = lazy(() => import("@/pages/coach/AIVoiceGenerator"));
const ComfyUI = lazy(() => import("@/pages/coach/ComfyUI"));
const FlickManager = lazy(() => import("@/pages/coach/FlickManager"));

// Application pages
const CreatorApplication = lazy(() => import("@/pages/apply/CreatorApplication"));
const EmployeeApplication = lazy(() => import("@/pages/apply/EmployeeApplication"));

// Public pages
const CreatorLinkPage = lazy(() => import("@/pages/CreatorLinkPage"));

export type UserType = "agency" | "creator" | "employee";

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  /** If set, wraps in ProtectedRoute with these allowed types */
  auth?: UserType[];
  /** If true, wraps in a scoped ErrorBoundary */
  errorBoundary?: boolean;
}

/** Public routes (no auth required) */
export const publicRoutes: RouteConfig[] = [
  { path: "/", element: <Landing /> },
  { path: "/auth", element: <Auth /> },
  { path: "/employee-login", element: <EmployeeAuth /> },
  { path: "/terms", element: <TermsOfService /> },
  { path: "/privacy", element: <PrivacyPolicy /> },
  { path: "/apply/creator/:agencyId", element: <CreatorApplication /> },
  { path: "/apply/employee/:agencyId", element: <EmployeeApplication /> },
  { path: "/l/:slug", element: <CreatorLinkPage /> },
];

/** Agency-only routes */
export const agencyRoutes: RouteConfig[] = [
  { path: "/dashboard", element: <Index />, auth: ["agency"] },
  { path: "/of-ai", element: <CoachPBF />, auth: ["agency"] },
  { path: "/creators", element: <Creators />, auth: ["agency"] },
  { path: "/creators/:id", element: <CreatorDetail />, auth: ["agency"] },
  { path: "/team", element: <Employees />, auth: ["agency"] },
  { path: "/team/chatters", element: <Chatters />, auth: ["agency"] },
  { path: "/team/performance", element: <EmployeePerformance />, auth: ["agency"] },
  { path: "/tasks", element: <Tasks />, auth: ["agency"] },
  { path: "/calendar", element: <Calendar />, auth: ["agency"] },
  { path: "/messages", element: <Messages />, auth: ["agency"] },
  { path: "/sop", element: <SOPLibrary />, auth: ["agency"] },
  { path: "/invoices", element: <Invoices />, auth: ["agency"] },
  { path: "/notifications", element: <Notifications />, auth: ["agency"] },
  { path: "/settings", element: <Settings />, auth: ["agency"] },
  { path: "/recruiting", element: <Recruiting />, auth: ["agency"] },
  { path: "/team-chat", element: <InternalMessages />, auth: ["agency"] },
  { path: "/shifts", element: <ShiftRoster />, auth: ["agency"] },
  { path: "/applications", element: <Applications />, auth: ["agency"] },
  { path: "/tools/creator-discovery", element: <CreatorDiscovery />, auth: ["agency"] },
  { path: "/browser-sync", element: <BrowserSync />, auth: ["agency"] },
  { path: "/guide", element: <UserGuide />, auth: ["agency"] },
  { path: "/of-ai/social-media", element: <SocialMediaManager />, auth: ["agency"] },
  { path: "/of-ai/chatter", element: <AIChatterPage />, auth: ["agency"] },
  { path: "/of-ai/image-generator", element: <AIImageGenerator />, auth: ["agency"] },
  { path: "/of-ai/voice-generator", element: <AIVoiceGenerator />, auth: ["agency"] },
  { path: "/of-ai/comfyui", element: <ComfyUI />, auth: ["agency"] },
  { path: "/of-ai/manager", element: <FlickManager />, auth: ["agency"] },
  
  { path: "/fan-analytics", element: <FanAnalytics />, auth: ["agency"] },
];

/** Creator portal routes (with scoped error boundaries) */
export const portalRoutes: RouteConfig[] = [
  { path: "/portal", element: <PortalDashboard />, auth: ["creator"], errorBoundary: true },
  { path: "/portal/messages", element: <PortalMessages />, auth: ["creator"], errorBoundary: true },
  { path: "/portal/invoices", element: <PortalInvoices />, auth: ["creator"], errorBoundary: true },
  { path: "/portal/content", element: <PortalContent />, auth: ["creator"], errorBoundary: true },
  { path: "/portal/plans", element: <PortalContentPlans />, auth: ["creator"], errorBoundary: true },
];

/** Employee portal routes (with scoped error boundaries) */
export const employeeRoutes: RouteConfig[] = [
  { path: "/employee", element: <EmployeeDashboard />, auth: ["employee"], errorBoundary: true },
  { path: "/employee/team-chat", element: <EmployeeTeamChat />, auth: ["employee"], errorBoundary: true },
  { path: "/employee/browser", element: <EmployeeBrowserSessions />, auth: ["employee"], errorBoundary: true },
  { path: "/employee/performance", element: <EmployeePerformancePage />, auth: ["employee"], errorBoundary: true },
  { path: "/employee/shifts", element: <EmployeeShifts />, auth: ["employee"], errorBoundary: true },
  { path: "/employee/time-logs", element: <EmployeeTimeLogs />, auth: ["employee"], errorBoundary: true },
  { path: "/employee/creators", element: <EmployeeCreatorHub />, auth: ["employee"], errorBoundary: true },
];

/** Redirect rules for legacy paths */
export const redirectRoutes: { from: string; to: string }[] = [
  { from: "/agent-hub", to: "/of-ai" },
  { from: "/coach-pbf", to: "/of-ai" },
  { from: "/felix", to: "/of-ai" },
  { from: "/of-ai/coach", to: "/of-ai" },
  { from: "/coach/social-media", to: "/of-ai/social-media" },
  { from: "/coach/ai-chatter", to: "/of-ai/chatter" },
  { from: "/employees", to: "/team" },
  { from: "/employees/performance", to: "/team/performance" },
  { from: "/chatters", to: "/team/chatters" },
  { from: "/internal-messages", to: "/team-chat" },
  { from: "/of-dashboard", to: "/dashboard" },
  { from: "/employee/onlyfans", to: "/employee/browser" },
  { from: "/employee/messages", to: "/employee/team-chat" },
  { from: "/employee/creator-messages", to: "/employee/browser" },
];

/** All route configs combined */
export const allRoutes: RouteConfig[] = [
  ...publicRoutes,
  ...agencyRoutes,
  ...portalRoutes,
  ...employeeRoutes,
];
