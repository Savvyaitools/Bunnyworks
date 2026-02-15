
-- Table for creators to submit their platform login credentials
CREATE TABLE public.creator_credential_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'onlyfans',
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_credential_submissions ENABLE ROW LEVEL SECURITY;

-- Creators can insert their own credentials
CREATE POLICY "Creators can submit their own credentials"
ON public.creator_credential_submissions
FOR INSERT
WITH CHECK (
  creator_id IN (
    SELECT c.id FROM public.creators c WHERE c.auth_user_id = auth.uid()
  )
);

-- Creators can view their own submissions
CREATE POLICY "Creators can view their own submissions"
ON public.creator_credential_submissions
FOR SELECT
USING (
  creator_id IN (
    SELECT c.id FROM public.creators c WHERE c.auth_user_id = auth.uid()
  )
);

-- Agency owners can view submissions for their agency
CREATE POLICY "Agency owners can view credential submissions"
ON public.creator_credential_submissions
FOR SELECT
USING (agency_id = public.get_user_agency_id());

-- Agency owners can update submission status
CREATE POLICY "Agency owners can update credential submissions"
ON public.creator_credential_submissions
FOR UPDATE
USING (agency_id = public.get_user_agency_id());

-- Trigger for updated_at
CREATE TRIGGER update_credential_submissions_updated_at
BEFORE UPDATE ON public.creator_credential_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
