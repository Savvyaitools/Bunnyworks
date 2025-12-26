-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('agency', 'creator')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow insert during signup
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'agency')
  );
  RETURN NEW;
END;
$$;

-- Trigger on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing table policies for authenticated users only

-- Creators: Agency users can manage all, creators see only themselves
DROP POLICY IF EXISTS "Anyone can view creators" ON public.creators;
DROP POLICY IF EXISTS "Anyone can create creators" ON public.creators;
DROP POLICY IF EXISTS "Anyone can update creators" ON public.creators;
DROP POLICY IF EXISTS "Anyone can delete creators" ON public.creators;

CREATE POLICY "Agency can view all creators" ON public.creators
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'agency')
  );

CREATE POLICY "Agency can manage creators" ON public.creators
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'agency')
  );

-- Employees: Agency only
DROP POLICY IF EXISTS "Anyone can view employees" ON public.employees;
DROP POLICY IF EXISTS "Anyone can create employees" ON public.employees;
DROP POLICY IF EXISTS "Anyone can update employees" ON public.employees;
DROP POLICY IF EXISTS "Anyone can delete employees" ON public.employees;

CREATE POLICY "Agency can view employees" ON public.employees
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'agency')
  );

CREATE POLICY "Agency can manage employees" ON public.employees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'agency')
  );

-- Tasks: Agency can see all, creators can see tasks assigned to their creator record
DROP POLICY IF EXISTS "Anyone can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can delete tasks" ON public.tasks;

CREATE POLICY "Agency can view all tasks" ON public.tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'agency')
  );

CREATE POLICY "Agency can manage tasks" ON public.tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'agency')
  );

-- Messages: Both can view/send in their conversations
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can update messages" ON public.messages;

CREATE POLICY "Authenticated users can view messages" ON public.messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update messages" ON public.messages
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Content files: Authenticated users
DROP POLICY IF EXISTS "Anyone can view content files" ON public.content_files;
DROP POLICY IF EXISTS "Anyone can upload content files" ON public.content_files;
DROP POLICY IF EXISTS "Anyone can delete content files" ON public.content_files;

CREATE POLICY "Authenticated can view content files" ON public.content_files
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can upload content files" ON public.content_files
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete content files" ON public.content_files
  FOR DELETE USING (auth.uid() IS NOT NULL);