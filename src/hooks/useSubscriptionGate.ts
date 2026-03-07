import { useSubscription } from "./useSubscription";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useCallback } from "react";

export interface SubscriptionGate {
  /** Whether the current subscription allows access */
  hasAccess: boolean;
  /** Whether the trial has expired without an active subscription */
  isExpired: boolean;
  /** Days remaining in trial (null if not trialing) */
  daysRemaining: number | null;
  /** Show a toast and return false if access is blocked */
  requireAccess: (featureName?: string) => boolean;
  /** Whether data is still loading */
  isLoading: boolean;
}

/**
 * Gate hook that checks if the current agency has an active subscription/trial.
 * Use this to block premium features for expired accounts.
 */
export function useSubscriptionGate(): SubscriptionGate {
  const { userType } = useAuth();
  const { subscription, isLoading } = useSubscription();

  // Only enforce for agency users
  const isAgencyUser = userType === "agency";

  const hasAccess = !isAgencyUser || isLoading || !subscription || subscription.isActive;
  const isExpired = isAgencyUser && !isLoading && !!subscription && !subscription.isActive;
  const daysRemaining = subscription?.daysRemaining ?? null;

  const requireAccess = useCallback(
    (featureName?: string) => {
      if (hasAccess) return true;
      toast.error(
        featureName
          ? `Your trial has expired. Upgrade to access ${featureName}.`
          : "Your trial has expired. Please upgrade to continue.",
        { action: { label: "Upgrade", onClick: () => window.location.assign("/settings") } }
      );
      return false;
    },
    [hasAccess]
  );

  return { hasAccess, isExpired, daysRemaining, requireAccess, isLoading };
}
