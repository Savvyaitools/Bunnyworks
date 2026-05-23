# Security hardening — fix cross-agency RLS leaks

## Findings ranked

### ERROR — fix immediately (cross-tenant data leaks)

1. **Realtime channels are open to every signed-in user.**
   `realtime.messages` has policy `Users can only access own agency channels` with `USING (true)` for ALL commands. Because RLS is OR-of-permissive, this overrides the agency-scoped policies — any logged-in user can subscribe to any other agency's live OF events, browser-agent updates, chat messages, etc.
   *Fix:* drop that policy; tighten the two remaining policies to scope by channel topic (`topic LIKE get_user_agency_id()::text || '/%'`).

2. **Employees can read agency API keys / secrets.**
   `public.agency_api_credentials` has two ALL policies; the broader one (`Agency owners can manage their API credentials`) only checks `agency_id = get_user_agency_id()` with **no `user_type='agency'` gate**, so every employee in the agency can SELECT `api_key`, `api_secret`, `access_token`.
   *Fix:* drop `Agency owners can manage their API credentials`. The properly-gated `Agency owners can manage API credentials` policy already covers legitimate access.

3. **Agency owners can read SOPs of other agencies.**
   `storage.objects` has 3 unscoped policies (`Agency can view/upload/delete SOPs`) that only check `bucket_id = 'sop-documents'` AND `user_type='agency'`, with no folder/agency scoping. Any agency-type user can list and download every agency's SOPs.
   *Fix:* drop the 3 unscoped policies. The correctly folder-scoped `Agency members can view/upload/delete sop documents` policies already exist.

4. **Non-owner employees can read & modify proxy credentials.**
   `public.creator_proxy_configs` has 4 commands-specific policies (`Users can view/insert/update/delete their agency proxy configs`) that only check agency — every employee gets read/write on `proxy_username` / `proxy_password`.
   *Fix:* drop those 4 policies. Keep only `Agency owners can manage proxy configs` (already gated by `user_type='agency'`). If non-owner managers need read access, add a SELECT-only policy gated to `employees.role <> 'Chatter'` instead.

### WARN — track but lower risk

5. **`of_webhook_events`** has RLS enabled but no SELECT policy — effectively locked from the client (intended for service_role inserts). Leave as-is; add a comment documenting intent.

6. **12 SECURITY DEFINER functions** are executable by anon/authenticated. Audit each: most (e.g., `get_agency_public_info`, `increment_link_click`, `has_role`, `get_user_agency_id`) are designed to be callable — keep. For any pure-internal helper called only from triggers (e.g., `calculate_time_log_duration`, `update_updated_at_column`, `create_task_notification`, `notify_*`, `check_coverage_gaps`, `sync_chatter_from_employee`, `apply_subscription_tier_limits`, `cleanup_*`), `REVOKE EXECUTE ... FROM anon, authenticated;`.

### INFO

7. One table has RLS enabled but no policies (lint 0008). Identify which and either add a deny-all policy or remove RLS if the table is unused.

## Implementation (single migration)

```sql
-- 1. realtime.messages
DROP POLICY IF EXISTS "Users can only access own agency channels" ON realtime.messages;

DROP POLICY IF EXISTS "Authenticated agency users can receive broadcasts" ON realtime.messages;
CREATE POLICY "Agency-scoped broadcast read" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    public.get_user_agency_id() IS NOT NULL
    AND (realtime.topic() LIKE public.get_user_agency_id()::text || '/%')
  );

DROP POLICY IF EXISTS "Authenticated agency users can send broadcasts" ON realtime.messages;
CREATE POLICY "Agency-scoped broadcast write" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_agency_id() IS NOT NULL
    AND (realtime.topic() LIKE public.get_user_agency_id()::text || '/%')
  );

-- 2. agency_api_credentials
DROP POLICY IF EXISTS "Agency owners can manage their API credentials"
  ON public.agency_api_credentials;

-- 3. SOP storage
DROP POLICY IF EXISTS "Agency can view SOPs"   ON storage.objects;
DROP POLICY IF EXISTS "Agency can upload SOPs" ON storage.objects;
DROP POLICY IF EXISTS "Agency can delete SOPs" ON storage.objects;

-- 4. creator_proxy_configs
DROP POLICY IF EXISTS "Users can view their agency proxy configs"     ON public.creator_proxy_configs;
DROP POLICY IF EXISTS "Users can insert proxy configs for their agency" ON public.creator_proxy_configs;
DROP POLICY IF EXISTS "Users can update their agency proxy configs"   ON public.creator_proxy_configs;
DROP POLICY IF EXISTS "Users can delete their agency proxy configs"   ON public.creator_proxy_configs;

-- 5. Lock down internal-only SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION
  public.update_updated_at_column(),
  public.calculate_time_log_duration(),
  public.create_task_notification(),
  public.notify_qc_assignment_change(),
  public.notify_shift_change(),
  public.create_recruiting_notification(),
  public.check_coverage_gaps(),
  public.sync_chatter_from_employee(),
  public.apply_subscription_tier_limits(),
  public.cleanup_expired_of_cache(),
  public.cleanup_old_activity_logs(),
  public.handle_new_user()
FROM anon, authenticated;
```

## Verification after migration

1. Re-run `security--run_security_scan` — the 4 ERROR-level findings should disappear; mark the proxy_configs WARN as fixed.
2. Re-run `supabase--linter` — SECURITY DEFINER warnings should drop from 12 to ~5 (the legitimately-public helpers).
3. Manual cross-tenant smoke test:
   - Sign in as Agency A → try `supabase.channel('AGENCY_B_ID/foo').subscribe()` → should be denied.
   - Query `agency_api_credentials` as an employee → 0 rows.
   - List `sop-documents` bucket without folder filter → only own-agency rows.

## Out of scope (no UI changes required)

This is pure backend RLS surgery — no React/edge-function code needs to change. If any feature breaks because it was silently relying on the over-permissive policies, we patch that feature, not the RLS.
