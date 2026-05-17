-- Lock down SECURITY DEFINER helpers: revoke broad EXECUTE, then re-grant
-- only where intentionally callable by client/RLS.

-- Trigger-only functions: no caller needs EXECUTE (triggers run as table owner).
REVOKE EXECUTE ON FUNCTION public.notify_qc_assignment_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_chatter_from_employee() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_task_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_coverage_gaps() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_shift_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_subscription_tier_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_recruiting_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_time_log_duration() FROM PUBLIC, anon, authenticated;

-- Cron / service-role-only maintenance functions.
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_of_cache() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_activity_logs() FROM PUBLIC, anon, authenticated;

-- Internal helpers used by RLS / other functions. Revoke from anon; keep
-- EXECUTE for authenticated so RLS policies and authorized RPC paths work.
REVOKE EXECUTE ON FUNCTION public.get_user_agency_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_agency_creator_count(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_agency_employee_count(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_agency_creator_limit() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_agency_employee_limit() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.onboard_recruiting_creator(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_user_agency_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agency_creator_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agency_employee_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_agency_creator_limit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_agency_employee_limit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.onboard_recruiting_creator(uuid) TO authenticated;

-- Intentionally public (called by anon visitors).
GRANT EXECUTE ON FUNCTION public.get_agency_public_info(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_link_click(uuid) TO anon, authenticated;