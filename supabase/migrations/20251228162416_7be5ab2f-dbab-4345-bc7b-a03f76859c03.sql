-- =====================================================
-- PART 1: CREATOR SOCIAL ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.creator_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'creator_managed' CHECK (account_type IN ('agency_managed', 'creator_managed')),
  profile_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_social_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_social_accounts
CREATE POLICY "Agency can view social accounts"
ON public.creator_social_accounts
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Agency can manage social accounts"
ON public.creator_social_accounts
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

-- =====================================================
-- PART 2: CHATTER TIME LOGS (CLOCK IN/OUT)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chatter_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatter_id UUID NOT NULL REFERENCES public.chatters(id) ON DELETE CASCADE,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clock_out TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  shift_id UUID REFERENCES public.chatter_shifts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatter_time_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agency can view all time logs"
ON public.chatter_time_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Agency can manage time logs"
ON public.chatter_time_logs
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
));

CREATE POLICY "Chatters can view own time logs"
ON public.chatter_time_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM chatters
  WHERE chatters.id = chatter_time_logs.chatter_id 
  AND chatters.auth_user_id = auth.uid()
));

CREATE POLICY "Chatters can clock in/out"
ON public.chatter_time_logs
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM chatters
  WHERE chatters.id = chatter_time_logs.chatter_id 
  AND chatters.auth_user_id = auth.uid()
));

CREATE POLICY "Chatters can update own time logs"
ON public.chatter_time_logs
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM chatters
  WHERE chatters.id = chatter_time_logs.chatter_id 
  AND chatters.auth_user_id = auth.uid()
));

-- =====================================================
-- PART 3: EXTEND CONTENT PLANS WITH REFERENCE MEDIA
-- =====================================================
ALTER TABLE public.content_plans
ADD COLUMN IF NOT EXISTS reference_media JSONB DEFAULT '[]'::jsonb;

-- =====================================================
-- PART 4: EXTEND RECRUITING CREATORS (add country)
-- =====================================================
ALTER TABLE public.recruiting_creators
ADD COLUMN IF NOT EXISTS country TEXT;

-- =====================================================
-- PART 5: EXTEND TASKS WITH REQUEST TYPE
-- =====================================================
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'general' CHECK (request_type IN ('custom', 'general'));

-- =====================================================
-- PART 6: CREATE STORAGE BUCKET FOR CONTENT REFERENCES
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-references', 'content-references', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for content references
CREATE POLICY "Agency can upload content references"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'content-references' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
  )
);

CREATE POLICY "Anyone can view content references"
ON storage.objects
FOR SELECT
USING (bucket_id = 'content-references');

CREATE POLICY "Agency can delete content references"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'content-references' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
  )
);

-- =====================================================
-- PART 7: FUNCTION TO CALCULATE TIME LOG DURATION
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_time_log_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.clock_out IS NOT NULL AND NEW.clock_in IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 60;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-calculating duration
DROP TRIGGER IF EXISTS calculate_duration_on_clockout ON public.chatter_time_logs;
CREATE TRIGGER calculate_duration_on_clockout
  BEFORE UPDATE ON public.chatter_time_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_time_log_duration();

-- =====================================================
-- PART 8: INDEX FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_time_logs_chatter ON public.chatter_time_logs(chatter_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_clock_in ON public.chatter_time_logs(clock_in);
CREATE INDEX IF NOT EXISTS idx_social_accounts_creator ON public.creator_social_accounts(creator_id);