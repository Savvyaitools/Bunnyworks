/**
 * Subscription tier configuration matching the pricing plans.
 * 
 * CORE ($69/mo): Up to 2 creators, 3 team members
 * SCALE ($129/mo): Up to 6 creators, 15 team members
 * PRO ($249/mo): Up to 15 creators, 40 team members
 * ENTERPRISE ($399+/mo): Unlimited creators & team members
 */

export interface TierConfig {
  id: string;
  name: string;
  tagline: string;
  price: number | null; // null = custom pricing
  maxCreators: number;
  maxEmployees: number;
  features: string[];
}

export const SUBSCRIPTION_TIERS: Record<string, TierConfig> = {
  core: {
    id: "core",
    name: "CORE",
    tagline: "Visibility",
    price: 69,
    maxCreators: 2,
    maxEmployees: 3,
    features: [
      "Up to 2 creators, 3 team members",
      "Unified employee management",
      "Basic shift scheduling",
      "Creator profiles + onboarding",
      "50 GB Content Vault",
      "Task management dashboard",
      "Basic performance tracking",
    ],
  },
  scale: {
    id: "scale",
    name: "SCALE",
    tagline: "Operational Control",
    price: 129,
    maxCreators: 6,
    maxEmployees: 15,
    features: [
      "Up to 6 creators, 15 team members",
      "Advanced chatter performance tracking",
      "PPV & revenue analytics per shift",
      "Recruiting pipeline with follow-ups",
      "Coverage gap detection",
      "200 GB Content Vault",
      "Priority support",
    ],
  },
  pro: {
    id: "pro",
    name: "PRO",
    tagline: "AI-Powered Growth",
    price: 249,
    maxCreators: 15,
    maxEmployees: 40,
    features: [
      "Up to 15 creators, 40 team members",
      "AI-powered performance insights",
      "Automated daily summaries",
      "Creator consistency scoring",
      "Staff reliability metrics",
      "600 GB Content Vault",
      "Early access to features",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "ENTERPRISE",
    tagline: "Systems Command",
    price: null,
    maxCreators: 9999,
    maxEmployees: 9999,
    features: [
      "Unlimited creators & team members",
      "AI Chatting System",
      "AI Voice Cloner",
      "AI Content Generator",
      "Custom KPIs & automations",
      "White-label experience",
      "1 TB+ Content Vault",
      "Dedicated implementation",
      "SLA + roadmap influence",
    ],
  },
};

export const DEFAULT_TIER = "core";

export function getTierConfig(tierId: string): TierConfig {
  return SUBSCRIPTION_TIERS[tierId.toLowerCase()] || SUBSCRIPTION_TIERS[DEFAULT_TIER];
}

export function getTierDisplayName(tierId: string): string {
  return getTierConfig(tierId).name;
}

export function isFeatureAvailable(tierId: string, requiredTier: string): boolean {
  const tierOrder = ["core", "scale", "pro", "enterprise"];
  const currentIndex = tierOrder.indexOf(tierId.toLowerCase());
  const requiredIndex = tierOrder.indexOf(requiredTier.toLowerCase());
  return currentIndex >= requiredIndex;
}
