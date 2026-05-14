
-- Allow deletion of creators/employees by cascading dependent log/audit rows

ALTER TABLE public.employee_of_activity_logs
  DROP CONSTRAINT IF EXISTS employee_of_activity_logs_creator_id_fkey,
  ADD CONSTRAINT employee_of_activity_logs_creator_id_fkey
    FOREIGN KEY (creator_id) REFERENCES public.creators(id) ON DELETE CASCADE;

ALTER TABLE public.employee_of_activity_logs
  DROP CONSTRAINT IF EXISTS employee_of_activity_logs_employee_id_fkey,
  ADD CONSTRAINT employee_of_activity_logs_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.ai_suggestions_log
  DROP CONSTRAINT IF EXISTS ai_suggestions_log_creator_id_fkey,
  ADD CONSTRAINT ai_suggestions_log_creator_id_fkey
    FOREIGN KEY (creator_id) REFERENCES public.creators(id) ON DELETE CASCADE;

ALTER TABLE public.ai_suggestions_log
  DROP CONSTRAINT IF EXISTS ai_suggestions_log_employee_id_fkey,
  ADD CONSTRAINT ai_suggestions_log_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.izzy_conversations
  DROP CONSTRAINT IF EXISTS izzy_conversations_creator_id_fkey,
  ADD CONSTRAINT izzy_conversations_creator_id_fkey
    FOREIGN KEY (creator_id) REFERENCES public.creators(id) ON DELETE CASCADE;

ALTER TABLE public.chatter_auto_reply_rules
  DROP CONSTRAINT IF EXISTS chatter_auto_reply_rules_creator_id_fkey,
  ADD CONSTRAINT chatter_auto_reply_rules_creator_id_fkey
    FOREIGN KEY (creator_id) REFERENCES public.creators(id) ON DELETE CASCADE;

ALTER TABLE public.chatter_message_log
  DROP CONSTRAINT IF EXISTS chatter_message_log_creator_id_fkey,
  ADD CONSTRAINT chatter_message_log_creator_id_fkey
    FOREIGN KEY (creator_id) REFERENCES public.creators(id) ON DELETE CASCADE;

-- Avatar URL columns for profile picture uploads
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Storage policies for employee avatars (reuse creator-avatars bucket, scoped by agency folder)
-- creator-avatars bucket is already public; we add agency-scoped write/delete.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Agency can upload creator avatars scoped') THEN
    CREATE POLICY "Agency can upload creator avatars scoped"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'creator-avatars'
        AND (storage.foldername(name))[1] = (public.get_user_agency_id())::text
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Agency can update creator avatars scoped') THEN
    CREATE POLICY "Agency can update creator avatars scoped"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'creator-avatars'
        AND (storage.foldername(name))[1] = (public.get_user_agency_id())::text
      );
  END IF;
END $$;
