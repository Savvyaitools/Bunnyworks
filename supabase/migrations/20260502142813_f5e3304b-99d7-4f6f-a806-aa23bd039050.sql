
-- 1) Remove broad SELECT policies that enable listing public buckets via API.
-- Direct file URLs continue to work because the buckets are public (served via CDN).
DROP POLICY IF EXISTS "Public can view agency logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view creator avatars" ON storage.objects;

-- 2) Add Realtime channel authorization. Without any policy on realtime.messages,
-- any authenticated user can subscribe to any topic. Restrict to authenticated users
-- who belong to an agency (cross-agency leakage is further mitigated at the
-- underlying table RLS level).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'realtime' AND c.relname = 'messages'
  ) THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Authenticated agency users can receive broadcasts" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "Authenticated agency users can receive broadcasts"
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING (public.get_user_agency_id() IS NOT NULL)
    $p$;

    EXECUTE 'DROP POLICY IF EXISTS "Authenticated agency users can send broadcasts" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "Authenticated agency users can send broadcasts"
      ON realtime.messages
      FOR INSERT
      TO authenticated
      WITH CHECK (public.get_user_agency_id() IS NOT NULL)
    $p$;
  END IF;
END$$;
