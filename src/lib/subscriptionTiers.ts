/**
 * Subscription tier configuration matching the pricing plans.
 * 
 * Per-creator model: $100/creator (includes 5 employees per creator)
 * Bundled plans offer discounts vs a-la-carte pricing.
 *
 * CORE ($69/mo): 1 creator, 5 employees — Save 31%
 * SCALE ($129/mo): 2 creators, 10 employees — Save 36%
 * PRO ($249/mo): 4 creators, 15 employees — Save 38%
 * ENTERPRISE (Custom): Unlimited creators & team members
 */

export interface TierConfig {
  id: string;
  name: string;
  tagline: string;
  price: number | null; // null = custom pricing
  originalValue: number | null; // a-la-carte value before discount
  discountLabel: string | null; // e.g. "Save 31%"
  extraCreatorPrice: number; // price per additional creator
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
    originalValue: 100,
    discountLabel: "Save 31%",
    extraCreatorPrice: 100,
    maxCreators: 1,
    maxEmployees: 5,
    features: [
      "1 creator, 5 team members",
      "Unified employee management",
      "Basic shift scheduling",
      "Creator profiles + onboarding",
      "50 GB Content Vault",
      "Task management dashboard",
      "Basic performance tracking",
      "Fan CRM",
      "Platform Access",
    ],
  },
  scale: {
    id: "scale",
    name: "SCALE",
    tagline: "Operational Control",
    price: 129,
    originalValue: 200,
    discountLabel: "Save 36%",
    extraCreatorPrice: 100,
    maxCreators: 2,
    maxEmployees: 10,
    features: [
      "2 creators, 10 team members",
      "Advanced chatter performance tracking",
      "PPV & revenue analytics per shift",
      "Recruiting pipeline with follow-ups",
      "Coverage gap detection",
      "200 GB Content Vault",
      "Platform Access",
      "Priority support",
    ],
  },
  pro: {
    id: "pro",
    name: "PRO",
    tagline: "AI-Powered Growth",
    price: 249,
    originalValue: 400,
    discountLabel: "Save 38%",
    extraCreatorPrice: 100,
    maxCreators: 4,
    maxEmployees: 15,
    features: [
      "4 creators, 15 team members",
      "AI-powered performance insights",
      "Automated daily summaries",
      "Creator consistency scoring",
      "Staff reliability metrics",
      "AI Smart Replies (Marylin Monroe)",
      "600 GB Content Vault",
      "Early access to features",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "ENTERPRISE",
    tagline: "Systems Command",
    price: null,
    originalValue: null,
    discountLabel: null,
    extraCreatorPrice: 100,
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
