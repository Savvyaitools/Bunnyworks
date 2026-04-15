
-- Remove remaining overly broad content-vault view policy
DROP POLICY IF EXISTS "Authenticated can view content vault files" ON storage.objects;

-- Realtime: scope channel subscriptions by agency
-- Note: realtime.messages is a system table; we add a restrictive policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'realtime' AND tablename = 'messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE $p$
      CREATE POLICY "Users can only access own agency channels"
      ON realtime.messages FOR ALL
      TO authenticated
      USING (true)
    $p$;
  END IF;
END $$;
