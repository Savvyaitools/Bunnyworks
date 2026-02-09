
-- Update default subscription tier from 'starter' to 'core'
ALTER TABLE public.agencies ALTER COLUMN subscription_tier SET DEFAULT 'core';

-- Update default max_creators from 10 to 2 (CORE tier)
ALTER TABLE public.agencies ALTER COLUMN max_creators SET DEFAULT 2;

-- Update default max_employees from 5 to 3 (CORE tier)
ALTER TABLE public.agencies ALTER COLUMN max_employees SET DEFAULT 3;

-- Update all existing agencies that still have the old 'starter' tier
-- Map them to 'core' with correct limits
UPDATE public.agencies 
SET subscription_tier = 'core', max_creators = 2, max_employees = 3
WHERE subscription_tier = 'starter';

-- Create a function to enforce tier limits on tier change
CREATE OR REPLACE FUNCTION public.apply_subscription_tier_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When subscription_tier changes, update limits accordingly
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    CASE NEW.subscription_tier
      WHEN 'core' THEN
        NEW.max_creators := 2;
        NEW.max_employees := 3;
      WHEN 'scale' THEN
        NEW.max_creators := 6;
        NEW.max_employees := 15;
      WHEN 'pro' THEN
        NEW.max_creators := 15;
        NEW.max_employees := 40;
      WHEN 'enterprise' THEN
        NEW.max_creators := 9999;
        NEW.max_employees := 9999;
      ELSE
        -- Default to core if unknown tier
        NEW.max_creators := 2;
        NEW.max_employees := 3;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-apply limits when tier changes
DROP TRIGGER IF EXISTS tr_apply_subscription_tier_limits ON public.agencies;
CREATE TRIGGER tr_apply_subscription_tier_limits
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_subscription_tier_limits();
