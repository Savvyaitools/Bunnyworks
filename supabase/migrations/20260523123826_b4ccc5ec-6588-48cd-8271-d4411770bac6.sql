
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_time_log_duration()     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_task_notification()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_qc_assignment_change()     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_shift_change()             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_recruiting_notification()  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_coverage_gaps()             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_chatter_from_employee()      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_subscription_tier_limits()  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_of_cache()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_activity_logs()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                 FROM PUBLIC;
