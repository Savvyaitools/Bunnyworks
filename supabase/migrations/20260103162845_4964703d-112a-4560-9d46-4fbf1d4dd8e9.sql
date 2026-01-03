-- Create pending_applications table for public form submissions
CREATE TABLE public.pending_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  application_type TEXT NOT NULL CHECK (application_type IN ('creator', 'employee')),
  
  -- Common fields
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Creator-specific fields
  platform TEXT,
  followers TEXT,
  onlyfans_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  twitter_url TEXT,
  snapchat_url TEXT,
  
  -- Employee-specific fields
  role_preference TEXT,
  department_preference TEXT,
  experience TEXT,
  skills TEXT[],
  bio TEXT,
  
  -- Application metadata
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_applications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert applications (public form submissions)
CREATE POLICY "Anyone can submit applications"
ON public.pending_applications
FOR INSERT
WITH CHECK (true);

-- Agency users can view their own applications
CREATE POLICY "Agency can view own applications"
ON public.pending_applications
FOR SELECT
USING (agency_id = get_user_agency_id());

-- Agency users can update their own applications (approve/reject)
CREATE POLICY "Agency can update own applications"
ON public.pending_applications
FOR UPDATE
USING (agency_id = get_user_agency_id());

-- Agency users can delete their own applications
CREATE POLICY "Agency can delete own applications"
ON public.pending_applications
FOR DELETE
USING (agency_id = get_user_agency_id());

-- Add updated_at trigger
CREATE TRIGGER update_pending_applications_updated_at
BEFORE UPDATE ON public.pending_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();