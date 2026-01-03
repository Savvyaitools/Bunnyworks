-- Update handle_new_user to auto-create agency for agency users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_user_type text;
  v_agency_id uuid;
BEGIN
  -- Validate email length
  IF length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email too long (max 255 characters)';
  END IF;
  
  -- Get and validate full name
  v_full_name := NEW.raw_user_meta_data ->> 'full_name';
  IF v_full_name IS NOT NULL THEN
    v_full_name := trim(v_full_name);
    IF length(v_full_name) < 2 OR length(v_full_name) > 100 THEN
      RAISE EXCEPTION 'Full name must be between 2 and 100 characters';
    END IF;
  END IF;

  v_user_type := COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'agency');

  -- If signing up as agency, create agency record first
  IF v_user_type = 'agency' THEN
    INSERT INTO public.agencies (name)
    VALUES (COALESCE(v_full_name, 'My Agency'))
    RETURNING id INTO v_agency_id;
  END IF;

  -- Create profile with agency_id linked
  INSERT INTO public.profiles (id, email, full_name, user_type, agency_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(v_full_name, ''),
    v_user_type,
    v_agency_id
  );
  
  RETURN NEW;
END;
$$;

-- Fix existing agency users without an agency
DO $$
DECLARE
  profile_record RECORD;
  new_agency_id uuid;
BEGIN
  FOR profile_record IN 
    SELECT id, full_name, email 
    FROM profiles 
    WHERE user_type = 'agency' AND agency_id IS NULL
  LOOP
    INSERT INTO agencies (name)
    VALUES (COALESCE(NULLIF(profile_record.full_name, ''), 'My Agency'))
    RETURNING id INTO new_agency_id;
    
    UPDATE profiles 
    SET agency_id = new_agency_id 
    WHERE id = profile_record.id;
  END LOOP;
END $$;