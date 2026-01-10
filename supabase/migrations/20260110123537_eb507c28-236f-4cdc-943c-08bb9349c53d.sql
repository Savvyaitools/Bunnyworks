-- =====================================================
-- PERFORMANCE INDEXES FOR HIGH-TRAFFIC QUERIES
-- =====================================================

-- Creators table - agency-scoped queries
CREATE INDEX IF NOT EXISTS idx_creators_agency_created 
ON creators(agency_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_creators_agency_status 
ON creators(agency_id, status);

-- Tasks table - agency-scoped with status filtering
CREATE INDEX IF NOT EXISTS idx_tasks_agency_status 
ON tasks(agency_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_creator_status 
ON tasks(creator_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee 
ON tasks(assignee_id, status);

-- Employees table - agency-scoped queries
CREATE INDEX IF NOT EXISTS idx_employees_agency_status 
ON employees(agency_id, status);

-- Invoices table - agency-scoped queries
CREATE INDEX IF NOT EXISTS idx_invoices_agency_created 
ON invoices(agency_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_creator 
ON invoices(creator_id, status);

-- Messages table - conversation lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_agency_created 
ON messages(agency_id, created_at DESC);

-- Calendar events - date range queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_agency_date 
ON calendar_events(agency_id, start_date);

-- Content plans - creator and status filtering
CREATE INDEX IF NOT EXISTS idx_content_plans_creator_status 
ON content_plans(creator_id, status);

CREATE INDEX IF NOT EXISTS idx_content_plans_agency_scheduled 
ON content_plans(agency_id, scheduled_date);

-- Chatter shifts - schedule lookups
CREATE INDEX IF NOT EXISTS idx_chatter_shifts_creator_date 
ON chatter_shifts(creator_id, shift_start);

CREATE INDEX IF NOT EXISTS idx_chatter_shifts_chatter_date 
ON chatter_shifts(chatter_id, shift_start);

-- Notifications - user and read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, read, created_at DESC);

-- OnlyFans events - agency and type filtering
CREATE INDEX IF NOT EXISTS idx_onlyfans_events_agency_type 
ON onlyfans_events(agency_id, event_type, created_at DESC);

-- Tracking links - creator and active status
CREATE INDEX IF NOT EXISTS idx_tracking_links_creator_active 
ON tracking_links(creator_id, is_active);

-- Creator earnings - for revenue calculations
CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator_period 
ON creator_earnings(creator_id, period_start, period_end);

-- Internal messages - participant lookups
CREATE INDEX IF NOT EXISTS idx_internal_messages_sender 
ON internal_messages(sender_id, sender_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_messages_recipient 
ON internal_messages(recipient_id, recipient_type, created_at DESC);

-- Chatters - agency queries
CREATE INDEX IF NOT EXISTS idx_chatters_agency_active 
ON chatters(agency_id, is_active);

-- Content files - creator and status
CREATE INDEX IF NOT EXISTS idx_content_files_creator_status 
ON content_files(creator_id, status);

CREATE INDEX IF NOT EXISTS idx_content_files_agency_created 
ON content_files(agency_id, created_at DESC);

-- Data imports - agency and status
CREATE INDEX IF NOT EXISTS idx_data_imports_agency_status 
ON data_imports(agency_id, status);

-- Employee payroll - period lookups
CREATE INDEX IF NOT EXISTS idx_employee_payroll_employee_period 
ON employee_payroll(employee_id, period_start, period_end);

-- SOP documents - agency and category
CREATE INDEX IF NOT EXISTS idx_sop_documents_agency_category 
ON sop_documents(agency_id, category);

-- Recruiting creators - agency and status
CREATE INDEX IF NOT EXISTS idx_recruiting_creators_agency_status 
ON recruiting_creators(agency_id, status);

-- Pending applications - agency and status
CREATE INDEX IF NOT EXISTS idx_pending_applications_agency_status 
ON pending_applications(agency_id, status);

-- Creator social accounts - creator lookups
CREATE INDEX IF NOT EXISTS idx_creator_social_accounts_creator 
ON creator_social_accounts(creator_id, platform);

-- Active browser sessions - agency and active status
CREATE INDEX IF NOT EXISTS idx_active_browser_sessions_agency 
ON active_browser_sessions(agency_id, is_active);

-- Session link assignments - lookups
CREATE INDEX IF NOT EXISTS idx_session_link_assignments_chatter 
ON session_link_assignments(chatter_id);

-- Time logs - chatter and date range
CREATE INDEX IF NOT EXISTS idx_chatter_time_logs_chatter_date 
ON chatter_time_logs(chatter_id, clock_in DESC);