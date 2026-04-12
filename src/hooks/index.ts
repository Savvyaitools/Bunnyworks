/**
 * Hooks barrel export organized by domain.
 * 
 * Domain groups:
 * - Agency:    useAgency, useAgencyLogo, useAgencyScopedCRUD, useSubscription, useSubscriptionGate
 * - Auth:      useAuth
 * - Creators:  useCreators, useCreatorPortal, useCreatorAssignments, useRecruitingCreators
 * - Employees: useEmployees, useChatters, useChatterProfiles, useChatterShifts, useChatterTimeLogs, useEmployeeBonuses, useEmployeeKPIs, useEmployeeOFPermissions, useEmployeePayroll, useTeamMembers
 * - Content:   useContentFiles, useContentPlanMedia, useCustomRequests, useSOPDocuments
 * - Comms:     useMessages, useInternalMessages, useNotifications, usePushNotifications
 * - AI:        useFelix
 * - Browser:   useBrowserFeatures, useBrowserSessions, useSessionHeartbeat
 * - Analytics: useDashboardStats, useFanAnalytics (via useTrackingLinks)
 * - Tasks:     useTasks, useCalendarEvents, useQCAssignments
 * - Invoicing: useInvoices
 * - Data:      useSupabaseCRUD, useSupabaseRead (infrastructure)
 */

// Infrastructure
export { useSupabaseCRUD, useSupabaseRead } from "./useSupabaseCRUD";
export { useAgencyScopedCRUD } from "./useAgencyScopedCRUD";

// Agency
export { useAgency } from "./useAgency";
export { useAgencyLogo } from "./useAgencyLogo";
export { useSubscription } from "./useSubscription";

// Auth
export { useAuth } from "./useAuth";

// Creators
export { useCreators } from "./useCreators";
export { useCreatorPortal } from "./useCreatorPortal";
export { useCreatorAssignments } from "./useCreatorAssignments";
export { useRecruitingCreators } from "./useRecruitingCreators";

// Employees
export { useEmployees } from "./useEmployees";
export { useChatters } from "./useChatters";
export { useTeamMembers } from "./useTeamMembers";
