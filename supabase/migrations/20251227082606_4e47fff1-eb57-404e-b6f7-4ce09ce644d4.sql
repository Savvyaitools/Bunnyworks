-- Add new columns to creators table for enhanced functionality
ALTER TABLE public.creators 
ADD COLUMN IF NOT EXISTS alias text,
ADD COLUMN IF NOT EXISTS online_status boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS onlyfans_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS tiktok_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS snapchat_url text;

-- Create content_folders table for vault organization
CREATE TABLE IF NOT EXISTS public.content_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.content_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add folder_id to content_files
ALTER TABLE public.content_files 
ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.content_folders(id) ON DELETE SET NULL;

-- Create content_plans table
CREATE TABLE IF NOT EXISTS public.content_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  scheduled_date date,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  platform text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create marketing_accounts table
CREATE TABLE IF NOT EXISTS public.marketing_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  platform text NOT NULL,
  username text NOT NULL,
  followers_count integer DEFAULT 0,
  is_connected boolean DEFAULT true,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create creator_earnings table
CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  platform text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.content_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_folders
CREATE POLICY "Agency can view content folders" ON public.content_folders
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

CREATE POLICY "Agency can manage content folders" ON public.content_folders
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

-- RLS policies for content_plans
CREATE POLICY "Agency can view content plans" ON public.content_plans
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

CREATE POLICY "Agency can manage content plans" ON public.content_plans
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

-- RLS policies for marketing_accounts
CREATE POLICY "Agency can view marketing accounts" ON public.marketing_accounts
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

CREATE POLICY "Agency can manage marketing accounts" ON public.marketing_accounts
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

-- RLS policies for creator_earnings
CREATE POLICY "Agency can view creator earnings" ON public.creator_earnings
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

CREATE POLICY "Agency can manage creator earnings" ON public.creator_earnings
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency')
);

-- Add updated_at triggers
CREATE TRIGGER update_content_folders_updated_at
  BEFORE UPDATE ON public.content_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_plans_updated_at
  BEFORE UPDATE ON public.content_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_accounts_updated_at
  BEFORE UPDATE ON public.marketing_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();