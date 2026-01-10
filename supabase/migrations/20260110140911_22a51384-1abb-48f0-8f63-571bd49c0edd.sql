-- Update the handle_new_user trigger to accept agency_id for employee/creator signups
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
  ELSE
    -- For employees and creators, use the provided agency_id from metadata
    v_agency_id := (NEW.raw_user_meta_data ->> 'agency_id')::uuid;
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