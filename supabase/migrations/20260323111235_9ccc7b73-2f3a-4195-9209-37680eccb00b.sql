
CREATE OR REPLACE FUNCTION public.increment_link_click(link_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE creator_page_links SET click_count = click_count + 1 WHERE id = link_id_param;
END;
$$;
