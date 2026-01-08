-- Fix onboard_recruiting_creator to include agency_id
CREATE OR REPLACE FUNCTION public.onboard_recruiting_creator(recruiting_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_creator_id uuid;
  recruiting_record recruiting_creators%ROWTYPE;
  user_agency_id uuid;
BEGIN
  -- Authorization check: Only agency users can onboard creators
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'agency'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only agency users can onboard creators';
  END IF;

  -- Get the user's agency_id
  SELECT agency_id INTO user_agency_id FROM profiles WHERE id = auth.uid();

  -- Get the recruiting creator
  SELECT * INTO recruiting_record FROM recruiting_creators WHERE id = recruiting_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recruiting creator not found';
  END IF;
  
  IF recruiting_record.status != 'approved' THEN
    RAISE EXCEPTION 'Creator must be approved before onboarding';
  END IF;
  
  -- Create the creator record with agency_id
  INSERT INTO creators (name, email, phone, status, notes, agency_id)
  VALUES (
    recruiting_record.name,
    recruiting_record.email,
    recruiting_record.phone,
    'Onboarding',
    recruiting_record.notes,
    user_agency_id
  )
  RETURNING id INTO new_creator_id;
  
  -- Mark as onboarded
  UPDATE recruiting_creators SET onboarded = true WHERE id = recruiting_id;
  
  RETURN new_creator_id;
END;
$function$;