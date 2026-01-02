import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAgency } from "@/hooks/useAgency";
import { Loader2 } from "lucide-react";
import { AgencyOnboardingWizard } from "@/components/onboarding";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedUserTypes?: ("agency" | "creator" | "employee")[];
}

export function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const { agency, isLoading: agencyLoading } = useAgency();

  if (loading || (profile?.user_type === "agency" && agencyLoading)) {
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

  // If user types are specified, check if user has access
  if (allowedUserTypes && profile && !allowedUserTypes.includes(profile.user_type)) {
    // Redirect to appropriate area based on user type
    if (profile.user_type === "creator") {
      return <Navigate to="/portal" replace />;
    } else if (profile.user_type === "employee") {
      return <Navigate to="/employee" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Show onboarding wizard for agency users who haven't completed it
  const showOnboarding = 
    profile?.user_type === "agency" && 
    agency && 
    !agency.onboarding_completed;

  return (
    <>
      {showOnboarding && <AgencyOnboardingWizard />}
      {children}
    </>
  );
}
