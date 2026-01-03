-- Fix 1: Messages table multi-tenant isolation
-- Add agency_id column to messages table for direct filtering
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_agency_id ON public.messages(agency_id);

-- Update existing records to populate agency_id from creator relationship
UPDATE public.messages m
SET agency_id = c.agency_id
FROM public.creators c
WHERE m.conversation_id = 'creator-' || c.id::text
AND m.agency_id IS NULL;

-- Drop old complex policies
DROP POLICY IF EXISTS "Agency can manage messages for own creators" ON public.messages;

-- Create simpler agency policy using direct agency_id
CREATE POLICY "Agency can manage own messages" 
ON public.messages 
FOR ALL 
TO authenticated
USING (
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'))
  AND agency_id = get_user_agency_id()
)
WITH CHECK (
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'))
  AND agency_id = get_user_agency_id()
);

-- Fix 2: Authentication input validation - add database constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT check_email_length CHECK (length(email) <= 255);

ALTER TABLE public.profiles 
ADD CONSTRAINT check_full_name_length CHECK (full_name IS NULL OR length(full_name) BETWEEN 2 AND 100);

-- Update handle_new_user function with server-side validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name text;
BEGIN
  -- Validate email length
  IF length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email too long (max 255 characters)';
  END IF;
  
  -- Get and validate full name
  v_full_name := NEW.raw_user_meta_data ->> 'full_name';
  IF v_full_name IS NOT NULL THEN
    -- Trim whitespace
    v_full_name := trim(v_full_name);
    IF length(v_full_name) < 2 OR length(v_full_name) > 100 THEN
      RAISE EXCEPTION 'Full name must be between 2 and 100 characters';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(v_full_name, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'agency')
  );
  RETURN NEW;
END;
$$;