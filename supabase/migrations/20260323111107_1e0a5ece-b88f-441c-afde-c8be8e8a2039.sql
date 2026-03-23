
-- Tighten click events: require valid link_id and page_id references
DROP POLICY "Anyone can insert click events" ON public.link_click_events;
CREATE POLICY "Anyone can insert click events"
  ON public.link_click_events FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.creator_page_links WHERE id = link_id AND is_active = true)
    AND EXISTS (SELECT 1 FROM public.creator_link_pages WHERE id = page_id AND is_active = true)
  );
