
CREATE OR REPLACE FUNCTION public.apply_subscription_tier_limits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    CASE NEW.subscription_tier
      WHEN 'core' THEN
        NEW.max_creators := 1;
        NEW.max_employees := 5;
      WHEN 'scale' THEN
        NEW.max_creators := 2;
        NEW.max_employees := 10;
      WHEN 'pro' THEN
        NEW.max_creators := 4;
        NEW.max_employees := 15;
      WHEN 'enterprise' THEN
        NEW.max_creators := 9999;
        NEW.max_employees := 9999;
      ELSE
        NEW.max_creators := 1;
        NEW.max_employees := 5;
    END CASE;
  END IF;
  RETURN NEW;
END;
$function$;
