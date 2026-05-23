
-- 1. realtime.messages — drop wide-open policy and rescope broadcast policies by channel topic
DROP POLICY IF EXISTS "Users can only access own agency channels" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated agency users can receive broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated agency users can send broadcasts" ON realtime.messages;

CREATE POLICY "Agency-scoped broadcast read"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_agency_id() IS NOT NULL
    AND realtime.topic() LIKE public.get_user_agency_id()::text || '/%'
  );

CREATE POLICY "Agency-scoped broadcast write"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_agency_id() IS NOT NULL
    AND realtime.topic() LIKE public.get_user_agency_id()::text || '/%'
  );

-- 2. agency_api_credentials — drop overly broad employee-accessible policy
DROP POLICY IF EXISTS "Agency owners can manage their API credentials"
  ON public.agency_api_credentials;

-- 3. SOP storage — drop 3 unscoped policies; folder-scoped policies remain
DROP POLICY IF EXISTS "Agency can view SOPs"   ON storage.objects;
DROP POLICY IF EXISTS "Agency can upload SOPs" ON storage.objects;
DROP POLICY IF EXISTS "Agency can delete SOPs" ON storage.objects;

-- 4. creator_proxy_configs — drop 4 employee-accessible policies; owner-only policy remains
DROP POLICY IF EXISTS "Users can view their agency proxy configs"        ON public.creator_proxy_configs;
DROP POLICY IF EXISTS "Users can insert proxy configs for their agency"  ON public.creator_proxy_configs;
DROP POLICY IF EXISTS "Users can update their agency proxy configs"      ON public.creator_proxy_configs;
DROP POLICY IF EXISTS "Users can delete their agency proxy configs"      ON public.creator_proxy_configs;

-- 5. Revoke EXECUTE on internal-only SECURITY DEFINER helpers (only called by triggers / definer paths)
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()        FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_time_log_duration()     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_task_notification()        FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_qc_assignment_change()     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_shift_change()             FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_recruiting_notification()  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_coverage_gaps()             FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_chatter_from_employee()      FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_subscription_tier_limits()  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_of_cache()        FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_activity_logs()       FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                 FROM anon, authenticated;
