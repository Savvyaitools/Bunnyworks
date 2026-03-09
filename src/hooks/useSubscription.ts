import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useCallback, useState } from "react";

export interface SubscriptionInfo {
  status: string;
  tier: string;
  trialEndsAt: string | null;
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;
  isActive: boolean;
  isTrialing: boolean;
  daysRemaining: number | null;
}

export function useSubscription() {
  const { profile } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const agencyId = profile?.agency_id;

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", agencyId],
    queryFn: async (): Promise<SubscriptionInfo | null> => {
      if (!agencyId) return null;

      const { data, error } = await supabase
        .from("agencies")
        .select("subscription_status, subscription_tier, trial_ends_at, subscription_started_at, subscription_ends_at")
        .eq("id", agencyId)
        .single();

      if (error) throw error;

      const status = data.subscription_status || "trialing";
      const trialEndsAt = data.trial_ends_at;
      const isTrialing = status === "trialing";
      const isActive = status === "active" || (isTrialing && trialEndsAt && new Date(trialEndsAt) > new Date());

      let daysRemaining: number | null = null;
      if (isTrialing && trialEndsAt) {
        daysRemaining = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      }

      return {
        status,
        tier: data.subscription_tier || "core",
        trialEndsAt,
        subscriptionStartedAt: data.subscription_started_at,
        subscriptionEndsAt: data.subscription_ends_at,
        isActive: !!isActive,
        isTrialing,
        daysRemaining,
      };
    },
    enabled: !!agencyId,
  });

  const { data: paymentHistory = [] } = useQuery({
    queryKey: ["payment-history", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from("payment_events")
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!agencyId,
  });

  const initiateCheckout = useCallback(async (tier: string) => {
    setCheckoutLoading(true);
    try {
      // TODO: Replace with Stripe checkout session
      toast.info("Stripe checkout coming soon. Contact sales@bunnyworksos.com to upgrade.");
      return null;
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Failed to start checkout");
      return null;
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  return {
    subscription,
    isLoading,
    paymentHistory,
    checkoutLoading,
    initiateCheckout,
  };
}
