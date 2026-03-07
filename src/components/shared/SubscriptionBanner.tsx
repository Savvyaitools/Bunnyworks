import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Displays a warning banner when the agency trial is expiring or expired.
 * Drop this into DashboardLayout for persistent visibility.
 */
export function SubscriptionBanner() {
  const { isExpired, daysRemaining, isLoading } = useSubscriptionGate();

  if (isLoading) return null;

  // Show urgent banner if expired
  if (isExpired) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2.5 flex items-center justify-between text-sm rounded-lg mx-4 mt-4 sm:mx-5 lg:mx-8">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">Your trial has expired.</span>
          <span className="hidden sm:inline text-destructive/80">Upgrade now to restore full access.</span>
        </div>
        <Link
          to="/settings"
          className="shrink-0 bg-destructive text-destructive-foreground px-3 py-1 rounded-md text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  // Show soft warning when trial is ending soon (≤3 days)
  if (daysRemaining !== null && daysRemaining <= 3) {
    return (
      <div className="bg-warning/10 border border-warning/20 text-warning-foreground px-4 py-2.5 flex items-center justify-between text-sm rounded-lg mx-4 mt-4 sm:mx-5 lg:mx-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-warning" />
          <span>
            <span className="font-medium">Trial ending soon</span> — {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
          </span>
        </div>
        <Link
          to="/settings"
          className="shrink-0 bg-warning text-warning-foreground px-3 py-1 rounded-md text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          View Plans
        </Link>
      </div>
    );
  }

  return null;
}
