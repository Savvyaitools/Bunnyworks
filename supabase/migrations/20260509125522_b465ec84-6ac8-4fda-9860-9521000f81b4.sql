
-- Enrich of_chats with the fields the chatting console needs
ALTER TABLE public.of_chats
  ADD COLUMN IF NOT EXISTS lifetime_spend numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_subscribed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscribed_until timestamptz,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT ARRAY[]::text[];

-- ------------------------------------------------------------
-- of_messages
CREATE TABLE IF NOT EXISTS public.of_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  chat_id uuid NOT NULL REFERENCES public.of_chats(id) ON DELETE CASCADE,
  of_message_id text,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  body text,
  price numeric NOT NULL DEFAULT 0,
  is_ppv boolean NOT NULL DEFAULT false,
  is_unlocked boolean NOT NULL DEFAULT false,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  sent_by_user_id uuid,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  UNIQUE (chat_id, of_message_id)
);
CREATE INDEX IF NOT EXISTS idx_of_messages_chat_time ON public.of_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_of_messages_agency ON public.of_messages(agency_id);
ALTER TABLE public.of_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency can manage own of_messages" ON public.of_messages;
CREATE POLICY "Agency can manage own of_messages"
  ON public.of_messages FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

-- ------------------------------------------------------------
-- of_quick_replies
CREATE TABLE IF NOT EXISTS public.of_quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  shortcut text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, shortcut)
);
ALTER TABLE public.of_quick_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency can manage own quick replies" ON public.of_quick_replies;
CREATE POLICY "Agency can manage own quick replies"
  ON public.of_quick_replies FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

DROP TRIGGER IF EXISTS trg_of_quick_replies_updated ON public.of_quick_replies;
CREATE TRIGGER trg_of_quick_replies_updated
  BEFORE UPDATE ON public.of_quick_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- of_jobs (mass DM + batch sync queue)
CREATE TABLE IF NOT EXISTS public.of_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  of_account_id text NOT NULL,
  job_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_of_jobs_pending ON public.of_jobs(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_of_jobs_agency ON public.of_jobs(agency_id);
ALTER TABLE public.of_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency can view own of_jobs" ON public.of_jobs;
CREATE POLICY "Agency can view own of_jobs"
  ON public.of_jobs FOR SELECT
  USING (agency_id = public.get_user_agency_id());

DROP POLICY IF EXISTS "Agency can create own of_jobs" ON public.of_jobs;
CREATE POLICY "Agency can create own of_jobs"
  ON public.of_jobs FOR INSERT
  WITH CHECK (agency_id = public.get_user_agency_id());

-- ------------------------------------------------------------
-- of_webhook_events (backend-only)
CREATE TABLE IF NOT EXISTS public.of_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  of_account_id text,
  payload jsonb NOT NULL,
  signature_valid boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_of_webhook_events_created ON public.of_webhook_events(created_at DESC);
ALTER TABLE public.of_webhook_events ENABLE ROW LEVEL SECURITY;
-- No public policies; service_role only.

-- ------------------------------------------------------------
-- Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.of_messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.of_chats;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
