-- Fix 1: Make content-vault bucket private
UPDATE storage.buckets SET public = false WHERE id = 'content-vault';

-- Fix 1b: Update storage policies to require authentication
DROP POLICY IF EXISTS "Anyone can view content vault files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view content vault files" ON storage.objects;
CREATE POLICY "Authenticated can view content vault files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'content-vault' AND auth.uid() IS NOT NULL
);

-- Fix 2: Add authorization check to onboard_recruiting_creator function
CREATE OR REPLACE FUNCTION public.onboard_recruiting_creator(recruiting_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_creator_id uuid;
  recruiting_record recruiting_creators%ROWTYPE;
BEGIN
  -- Authorization check: Only agency users can onboard creators
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'agency'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only agency users can onboard creators';
  END IF;

  -- Get the recruiting creator
  SELECT * INTO recruiting_record FROM recruiting_creators WHERE id = recruiting_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recruiting creator not found';
  END IF;
  
  IF recruiting_record.status != 'approved' THEN
    RAISE EXCEPTION 'Creator must be approved before onboarding';
  END IF;
  
  -- Create the creator record
  INSERT INTO creators (name, email, phone, status, notes)
  VALUES (
    recruiting_record.name,
    recruiting_record.email,
    recruiting_record.phone,
    'Onboarding',
    recruiting_record.notes
  )
  RETURNING id INTO new_creator_id;
  
  -- Mark as onboarded
  UPDATE recruiting_creators SET onboarded = true WHERE id = recruiting_id;
  
  RETURN new_creator_id;
END;
$$;

-- Fix 3: Tighten messages table RLS policies
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON public.messages;

-- Agency users can view all messages
CREATE POLICY "Agency can view all messages" ON public.messages
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'agency')
);

-- Agency users can send messages
CREATE POLICY "Agency can send messages" ON public.messages
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'agency')
);

-- Agency users can update messages (mark as read)
CREATE POLICY "Agency can update messages" ON public.messages
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'agency')
);