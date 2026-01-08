import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAgency } from "@/hooks/useAgency";
import { Loader2 } from "lucide-react";
import { AgencyOnboardingWizard } from "@/components/onboarding";

/**
 * Client-side route protection for UX purposes.
 * NOTE: Actual security is enforced by Row-Level Security (RLS) policies in the database.
 * This component prevents users from seeing UI they shouldn't access, but all data
 * operations are secured server-side via RLS with agency_id isolation and user_type checks.
 */
interface ProtectedRouteProps {
  children: ReactNode;
  allowedUserTypes?: ("agency" | "creator" | "employee")[];
}

export function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const { user, profile, loading, userType } = useAuth();
  const location = useLocation();
  const { agency, isLoading: agencyLoading } = useAgency();

  if (loading || (userType === "agency" && agencyLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user types are specified, check if user has access (use userType which includes metadata fallback)
  if (allowedUserTypes && userType && !allowedUserTypes.includes(userType)) {
    // Redirect to appropriate area based on user type
    if (userType === "creator") {
      return <Navigate to="/portal" replace />;
    } else if (userType === "employee") {
      return <Navigate to="/employee" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Show onboarding wizard for agency users who haven't completed it
  const showOnboarding = 
    userType === "agency" && 
    agency && 
    !agency.onboarding_completed;

  return (
    <>
      {showOnboarding && <AgencyOnboardingWizard />}
      {children}
    </>
  );
}
