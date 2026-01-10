-- Create table for OnlyFans webhook events
CREATE TABLE public.onlyfans_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  of_account_id TEXT NOT NULL,
  creator_id UUID REFERENCES public.creators(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_onlyfans_events_agency ON public.onlyfans_events(agency_id);
CREATE INDEX idx_onlyfans_events_type ON public.onlyfans_events(event_type);
CREATE INDEX idx_onlyfans_events_created ON public.onlyfans_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.onlyfans_events ENABLE ROW LEVEL SECURITY;

-- Agency users can view their own events
CREATE POLICY "Agency users can view their events"
ON public.onlyfans_events
FOR SELECT
USING (agency_id = public.get_user_agency_id());

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.onlyfans_events;

-- Create table for tracking links (marketing attribution)
CREATE TABLE public.tracking_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  of_account_id TEXT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  url TEXT NOT NULL,
  campaign TEXT,
  source TEXT,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on code per agency
CREATE UNIQUE INDEX idx_tracking_links_code ON public.tracking_links(agency_id, code);
CREATE INDEX idx_tracking_links_creator ON public.tracking_links(creator_id);

-- Enable RLS
ALTER TABLE public.tracking_links ENABLE ROW LEVEL SECURITY;

-- Agency users can manage their tracking links
CREATE POLICY "Agency users can view their tracking links"
ON public.tracking_links
FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Agency users can insert tracking links"
ON public.tracking_links
FOR INSERT
WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "Agency users can update their tracking links"
ON public.tracking_links
FOR UPDATE
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Agency users can delete their tracking links"
ON public.tracking_links
FOR DELETE
USING (agency_id = public.get_user_agency_id());

-- Create trigger for updated_at
CREATE TRIGGER update_tracking_links_updated_at
BEFORE UPDATE ON public.tracking_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();