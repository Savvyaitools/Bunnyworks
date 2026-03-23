
-- Creator link pages (Linktree alternative)
CREATE TABLE public.creator_link_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'default',
  background_color TEXT DEFAULT '#0a0a0a',
  text_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#e11d48',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9_-]{1,48}[a-z0-9]$')
);

-- Links within a link page
CREATE TABLE public.creator_page_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.creator_link_pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Click tracking
CREATE TABLE public.link_click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.creator_page_links(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.creator_link_pages(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ DEFAULT now(),
  referrer TEXT,
  user_agent TEXT,
  country TEXT
);

-- Indexes
CREATE INDEX idx_link_pages_slug ON public.creator_link_pages(slug);
CREATE INDEX idx_link_pages_agency ON public.creator_link_pages(agency_id);
CREATE INDEX idx_page_links_page ON public.creator_page_links(page_id);
CREATE INDEX idx_click_events_link ON public.link_click_events(link_id);
CREATE INDEX idx_click_events_page ON public.link_click_events(page_id);

-- RLS
ALTER TABLE public.creator_link_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_page_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_click_events ENABLE ROW LEVEL SECURITY;

-- Link pages: agency users can CRUD, public can read active pages
CREATE POLICY "Agency users manage link pages"
  ON public.creator_link_pages FOR ALL TO authenticated
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY "Public can view active link pages"
  ON public.creator_link_pages FOR SELECT TO anon
  USING (is_active = true);

-- Page links: agency users via page ownership, public read active
CREATE POLICY "Agency users manage page links"
  ON public.creator_page_links FOR ALL TO authenticated
  USING (page_id IN (SELECT id FROM public.creator_link_pages WHERE agency_id = public.get_user_agency_id()))
  WITH CHECK (page_id IN (SELECT id FROM public.creator_link_pages WHERE agency_id = public.get_user_agency_id()));

CREATE POLICY "Public can view active page links"
  ON public.creator_page_links FOR SELECT TO anon
  USING (is_active = true AND page_id IN (SELECT id FROM public.creator_link_pages WHERE is_active = true));

-- Click events: anyone can insert (tracking), agency users can read
CREATE POLICY "Anyone can insert click events"
  ON public.link_click_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Agency users can read click events"
  ON public.link_click_events FOR SELECT TO authenticated
  USING (page_id IN (SELECT id FROM public.creator_link_pages WHERE agency_id = public.get_user_agency_id()));
