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
