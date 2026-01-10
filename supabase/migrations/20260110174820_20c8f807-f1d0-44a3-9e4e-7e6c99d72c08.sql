-- Drop the old constraint and add a new one that includes 'employee'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type = ANY (ARRAY['agency'::text, 'creator'::text, 'employee'::text]));