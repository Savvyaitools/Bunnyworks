-- Add earnings breakdown columns to creator_earnings
ALTER TABLE public.creator_earnings
  ADD COLUMN IF NOT EXISTS tips numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscriptions numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS messages_revenue numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referrals numeric DEFAULT 0;
