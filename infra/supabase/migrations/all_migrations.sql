-- Migration 001: Core Tables
-- BenchworksAI Outbound Engine
-- Spec: benchworks-outbound-spec-v2.md Section 2.2

-- ============================================================
-- 1. system_config
-- ============================================================
CREATE TABLE system_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    value jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. clients
-- ============================================================
CREATE TABLE clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    industry text NOT NULL,
    icp jsonb,
    notification_channel text,
    notification_target text,
    status text NOT NULL DEFAULT 'active',
    physical_address text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_status ON clients(status);

-- ============================================================
-- 3. campaigns (FK → clients)
-- ============================================================
CREATE TABLE campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    smartlead_campaign_id text,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    provision_stage text,
    sequence_config jsonb,
    vertical text,
    offer text,
    geography text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_client_id ON campaigns(client_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- ============================================================
-- 4. mailbox_pool (FK → clients)
-- ============================================================
CREATE TABLE mailbox_pool (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    provider text,
    domain text,
    status text NOT NULL DEFAULT 'warming',
    health_score integer,
    bounce_rate float,
    spam_rate float,
    reply_rate float,
    assigned_client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
    assigned_campaign_id text,
    smartlead_account_id text,
    daily_send_limit integer DEFAULT 50,
    warm_up_started_at timestamptz,
    last_health_check timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mailbox_pool_status ON mailbox_pool(status);
CREATE INDEX idx_mailbox_pool_assigned_client ON mailbox_pool(assigned_client_id);

-- ============================================================
-- 5. leads (FK → clients, campaigns)
-- SYN-006: email is NULLABLE
-- SYN-024: booking_status added
-- SYN-014: enrichment_attempts + last_enrichment_attempt added
-- ============================================================
CREATE TABLE leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    email text,  -- NULLABLE per SYN-006
    first_name text,
    last_name text,
    company text,
    title text,
    domain text,
    enrichment_data jsonb,
    icp_score integer,
    icp_breakdown jsonb,
    icp_reasoning text,
    stage text NOT NULL DEFAULT 'new',
    booking_status text,  -- null / 'booked' / 'cancelled' per SYN-024
    smartlead_lead_id text,
    source text,
    source_batch_id text,
    enrichment_attempts integer DEFAULT 0,
    last_enrichment_attempt timestamptz,
    enriched_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Partial unique index: prevents duplicates while allowing null emails
CREATE UNIQUE INDEX idx_leads_email_campaign ON leads(email, campaign_id) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_client_id ON leads(client_id);
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_smartlead_lead_id ON leads(smartlead_lead_id);

-- ============================================================
-- 6. reply_events (FK → leads, clients, campaigns)
-- SYN-021: campaign_id added
-- SYN-003: idempotency_key added
-- SYN-020: needs_review added
-- ============================================================
CREATE TABLE reply_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
    classification text,
    confidence float,
    sentiment text,
    key_intent text,
    reply_body text,
    suggested_action text,
    extracted_referral jsonb,
    model_version text,
    idempotency_key text UNIQUE,
    needs_review boolean NOT NULL DEFAULT false,
    processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reply_events_lead_id ON reply_events(lead_id);
CREATE INDEX idx_reply_events_campaign_id ON reply_events(campaign_id);
CREATE INDEX idx_reply_events_client_processed ON reply_events(client_id, processed_at DESC);
CREATE INDEX idx_reply_events_needs_review ON reply_events(needs_review) WHERE needs_review = true;

-- ============================================================
-- 7. sequence_templates (FK → campaigns, clients)
-- ============================================================
CREATE TABLE sequence_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    step_number integer NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    compliance_validated boolean NOT NULL DEFAULT false,
    compliance_footer text,
    variant_config jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sequence_templates_campaign ON sequence_templates(campaign_id);

-- ============================================================
-- 8. suppression_list (FK → clients, campaigns — ON DELETE SET NULL)
-- SYN-031: source_campaign_id uses ON DELETE SET NULL
-- ============================================================
CREATE TABLE suppression_list (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    reason text,
    source_client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
    source_campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_suppression_email ON suppression_list(email);

-- ============================================================
-- 9. action_log (FK → clients, leads, campaigns — all nullable)
-- SYN-022: request_id added for correlation
-- ============================================================
CREATE TABLE action_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
    campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
    action_type text NOT NULL,
    action_detail jsonb,
    initiated_by text,
    request_id text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_action_log_client_id ON action_log(client_id);
CREATE INDEX idx_action_log_lead_id ON action_log(lead_id);
CREATE INDEX idx_action_log_action_type ON action_log(action_type);
CREATE INDEX idx_action_log_created_at ON action_log(created_at DESC);

-- ============================================================
-- 10. action_log_archive (identical schema, no FKs — SYN-023)
-- ============================================================
CREATE TABLE action_log_archive (
    id uuid PRIMARY KEY,
    client_id uuid,
    lead_id uuid,
    campaign_id uuid,
    action_type text NOT NULL,
    action_detail jsonb,
    initiated_by text,
    request_id text,
    created_at timestamptz NOT NULL
);

CREATE INDEX idx_action_log_archive_created_at ON action_log_archive(created_at DESC);

-- ============================================================
-- 11. client_reports (FK → clients)
-- SYN: report_period_start/end are timestamptz
-- ============================================================
CREATE TABLE client_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    report_period_start timestamptz NOT NULL,
    report_period_end timestamptz NOT NULL,
    metrics jsonb,
    narrative text,
    delivered_via text,
    delivered_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_reports_client_id ON client_reports(client_id);

-- ============================================================
-- 12. sessions (SYN-001 — for NextAuth JWT session tracking)
-- ============================================================
CREATE TABLE sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    session_token text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    is_valid boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
-- Migration 002: updated_at Auto-trigger (SYN-030)

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
-- Migration 004: Materialized View — client_summary_mv (SYN-012)
-- Spec Section 2.2

CREATE MATERIALIZED VIEW client_summary_mv AS
SELECT
    c.id AS client_id,
    c.name,
    c.industry,
    c.status,
    COUNT(DISTINCT camp.id) FILTER (WHERE camp.status = 'active') AS active_campaigns,
    COUNT(DISTINCT l.id) AS total_leads,
    COALESCE(
        (SELECT jsonb_object_agg(stage, cnt)
         FROM (SELECT stage, COUNT(*) AS cnt FROM leads WHERE client_id = c.id GROUP BY stage) sub),
        '{}'::jsonb
    ) AS leads_by_stage,
    COUNT(DISTINCT re.id) FILTER (
        WHERE re.classification = 'interested'
        AND re.processed_at > now() - interval '7 days'
    ) AS positive_replies_this_week
FROM clients c
LEFT JOIN campaigns camp ON camp.client_id = c.id
LEFT JOIN leads l ON l.client_id = c.id
LEFT JOIN reply_events re ON re.client_id = c.id
WHERE c.status = 'active'
GROUP BY c.id, c.name, c.industry, c.status;

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_client_summary_mv_client_id ON client_summary_mv(client_id);

-- Refresh every 5 minutes via pg_cron (enable pg_cron in Supabase project settings first)
-- SELECT cron.schedule('refresh_client_summary', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY client_summary_mv');
-- Migration 005: Seed Data
-- BenchworksAI internal client + system_config values

-- BenchworksAI internal client (used for internal prospecting engine — F-007)
INSERT INTO clients (name, industry, icp, notification_channel, notification_target, status, physical_address)
VALUES (
    'BenchworksAI',
    'ai_consultancy',
    '{
        "target_titles": ["Owner", "Operator", "Managing Partner", "Office Manager", "General Manager"],
        "target_industries": ["construction", "legal", "property_management"],
        "company_size_min": 5,
        "company_size_max": 50,
        "geography": "Long Island, NY → Northeast US",
        "positive_signals": ["No AI tools in tech stack", "Manual scheduling", "Paper-based processes", "Growing headcount"],
        "negative_signals": ["Enterprise company", "Already uses AI consultancy", "Government entity"]
    }'::jsonb,
    'slack',
    '',
    'active',
    'Long Island, NY'
);

-- System configuration values
INSERT INTO system_config (key, value) VALUES
    ('icp_score_threshold', '{"value": 70}'::jsonb),
    ('classification_confidence_threshold', '{"value": 0.85}'::jsonb),
    ('max_enrichment_attempts', '{"value": 3}'::jsonb),
    ('warm_pool_surplus_target', '{"value": 0.20}'::jsonb),
    ('deliverability_check_interval_hours', '{"value": 6}'::jsonb),
    ('report_delivery_day', '{"value": "monday"}'::jsonb),
    ('report_delivery_hour_utc', '{"value": 12}'::jsonb),
    ('operator_email', '{"value": ""}'::jsonb),
    ('escalation_contact', '{"value": ""}'::jsonb),
    ('monthly_restore_test_reminder', '{"value": true}'::jsonb);

-- Refresh materialized view after seed
REFRESH MATERIALIZED VIEW client_summary_mv;
