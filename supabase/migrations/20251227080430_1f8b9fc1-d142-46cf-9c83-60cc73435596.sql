-- Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

-- Create user_roles table for permission management
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Recruiting Creators table (pre-onboarding)
CREATE TABLE public.recruiting_creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  alias text,
  email text,
  phone text,
  source text,
  status text NOT NULL DEFAULT 'prospecting' CHECK (status IN ('prospecting', 'contacted', 'interviewed', 'approved', 'rejected')),
  notes text,
  onboarded boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.recruiting_creators ENABLE ROW LEVEL SECURITY;

-- Recruiting RLS - Agency only
CREATE POLICY "Agency can view recruiting creators"
ON public.recruiting_creators
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Agency can manage recruiting creators"
ON public.recruiting_creators
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

-- Trigger for updated_at
CREATE TRIGGER update_recruiting_creators_updated_at
BEFORE UPDATE ON public.recruiting_creators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Chatters table (internal workforce)
CREATE TABLE public.chatters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  skill_grade text NOT NULL DEFAULT 'B' CHECK (skill_grade IN ('A', 'B', 'C')),
  timezone text,
  is_active boolean DEFAULT true,
  avatar_seed text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chatters ENABLE ROW LEVEL SECURITY;

-- Chatters RLS
CREATE POLICY "Agency can view all chatters"
ON public.chatters
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Agency can manage chatters"
ON public.chatters
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Chatters can view own profile"
ON public.chatters
FOR SELECT
USING (auth_user_id = auth.uid());

-- Trigger for chatters updated_at
CREATE TRIGGER update_chatters_updated_at
BEFORE UPDATE ON public.chatters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Creator Assignments table
CREATE TABLE public.creator_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  chatter_id uuid REFERENCES public.chatters(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'chatter',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (creator_id, chatter_id)
);

ALTER TABLE public.creator_assignments ENABLE ROW LEVEL SECURITY;

-- Creator Assignments RLS
CREATE POLICY "Agency can view assignments"
ON public.creator_assignments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Agency can manage assignments"
ON public.creator_assignments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Chatters can view own assignments"
ON public.creator_assignments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM chatters
  WHERE chatters.id = creator_assignments.chatter_id
    AND chatters.auth_user_id = auth.uid()
));

-- Chatter Shifts table
CREATE TABLE public.chatter_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatter_id uuid REFERENCES public.chatters(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  shift_start timestamp with time zone NOT NULL,
  shift_end timestamp with time zone NOT NULL,
  shift_type text DEFAULT 'regular',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chatter_shifts ENABLE ROW LEVEL SECURITY;

-- Chatter Shifts RLS
CREATE POLICY "Agency can view all shifts"
ON public.chatter_shifts
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Agency can manage shifts"
ON public.chatter_shifts
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Chatters can view own shifts"
ON public.chatter_shifts
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM chatters
  WHERE chatters.id = chatter_shifts.chatter_id
    AND chatters.auth_user_id = auth.uid()
));

-- Add chatter_id to tasks table
ALTER TABLE public.tasks ADD COLUMN chatter_id uuid REFERENCES public.chatters(id) ON DELETE SET NULL;

-- Update tasks RLS to allow chatters to create tasks
CREATE POLICY "Chatters can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM chatters
  WHERE chatters.auth_user_id = auth.uid()
));

CREATE POLICY "Chatters can view own tasks"
ON public.tasks
FOR SELECT
USING (
  chatter_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM chatters
    WHERE chatters.id = tasks.chatter_id
      AND chatters.auth_user_id = auth.uid()
  )
);

-- Internal messages table for chatter communications
CREATE TABLE public.internal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('chatter', 'agency')),
  recipient_id uuid NOT NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('chatter', 'agency')),
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

-- Internal messages RLS - NO creator access
CREATE POLICY "Agency can view all internal messages"
ON public.internal_messages
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Agency can send internal messages"
ON public.internal_messages
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Chatters can view own messages"
ON public.internal_messages
FOR SELECT
USING (
  (sender_type = 'chatter' AND EXISTS (
    SELECT 1 FROM chatters WHERE chatters.id = internal_messages.sender_id AND chatters.auth_user_id = auth.uid()
  ))
  OR
  (recipient_type = 'chatter' AND EXISTS (
    SELECT 1 FROM chatters WHERE chatters.id = internal_messages.recipient_id AND chatters.auth_user_id = auth.uid()
  ))
);

CREATE POLICY "Chatters can send internal messages"
ON public.internal_messages
FOR INSERT
WITH CHECK (
  sender_type = 'chatter' 
  AND recipient_type != 'creator'
  AND EXISTS (
    SELECT 1 FROM chatters WHERE chatters.id = internal_messages.sender_id AND chatters.auth_user_id = auth.uid()
  )
);

-- Function to onboard recruiting creator
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