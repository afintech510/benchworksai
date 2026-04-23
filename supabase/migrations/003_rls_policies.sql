-- Migration 003: Row-Level Security Policies
-- Spec Section 2.2 + F-021 (append-only action_log)

-- ============================================================
-- Enable RLS on all client-scoped tables
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailbox_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppression_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- clients: operator can SELECT, INSERT, UPDATE (no DELETE — soft delete via status)
-- ============================================================
CREATE POLICY clients_service_all ON clients
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY clients_select ON clients
    FOR SELECT TO authenticated USING (true);

CREATE POLICY clients_insert ON clients
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY clients_update ON clients
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- campaigns: full access for authenticated + service
-- ============================================================
CREATE POLICY campaigns_service_all ON campaigns
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY campaigns_select ON campaigns
    FOR SELECT TO authenticated USING (true);

CREATE POLICY campaigns_insert ON campaigns
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY campaigns_update ON campaigns
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- leads: full access for authenticated + service
-- ============================================================
CREATE POLICY leads_service_all ON leads
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY leads_select ON leads
    FOR SELECT TO authenticated USING (true);

CREATE POLICY leads_insert ON leads
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY leads_update ON leads
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- reply_events: full access for authenticated + service
-- ============================================================
CREATE POLICY reply_events_service_all ON reply_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY reply_events_select ON reply_events
    FOR SELECT TO authenticated USING (true);

CREATE POLICY reply_events_insert ON reply_events
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY reply_events_update ON reply_events
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- mailbox_pool: full access for authenticated + service
-- ============================================================
CREATE POLICY mailbox_pool_service_all ON mailbox_pool
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY mailbox_pool_select ON mailbox_pool
    FOR SELECT TO authenticated USING (true);

CREATE POLICY mailbox_pool_insert ON mailbox_pool
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY mailbox_pool_update ON mailbox_pool
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- sequence_templates: full access for authenticated + service
-- ============================================================
CREATE POLICY sequence_templates_service_all ON sequence_templates
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY sequence_templates_select ON sequence_templates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY sequence_templates_insert ON sequence_templates
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY sequence_templates_update ON sequence_templates
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- suppression_list: global read (cross-client by design)
-- Service role can INSERT + DELETE. Authenticated can SELECT only.
-- ============================================================
CREATE POLICY suppression_service_all ON suppression_list
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY suppression_select ON suppression_list
    FOR SELECT TO authenticated USING (true);

CREATE POLICY suppression_insert ON suppression_list
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY suppression_delete ON suppression_list
    FOR DELETE TO authenticated USING (true);

-- ============================================================
-- action_log: APPEND-ONLY (F-021 CRITICAL)
-- ALL roles can SELECT + INSERT only.
-- NO UPDATE, NO DELETE for any application role.
-- Only superadmin (direct DB) can modify.
-- ============================================================
CREATE POLICY action_log_service_select ON action_log
    FOR SELECT TO service_role USING (true);

CREATE POLICY action_log_service_insert ON action_log
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY action_log_select ON action_log
    FOR SELECT TO authenticated USING (true);

CREATE POLICY action_log_insert ON action_log
    FOR INSERT TO authenticated WITH CHECK (true);

-- NO UPDATE or DELETE policies — append-only enforced by RLS

-- ============================================================
-- client_reports: full access for authenticated + service
-- ============================================================
CREATE POLICY client_reports_service_all ON client_reports
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY client_reports_select ON client_reports
    FOR SELECT TO authenticated USING (true);

CREATE POLICY client_reports_insert ON client_reports
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY client_reports_update ON client_reports
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- sessions: service role only (FastAPI middleware checks this)
-- ============================================================
CREATE POLICY sessions_service_all ON sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);
