-- =============================================================================
-- Larkin Tech — Initial Schema Migration
-- Phase 01: All 19 tables, triggers, indexes, RLS policies
-- Spec: larkintech-spec-v2.md Section 2.2 + addendum Part 1
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. LOOKUP TABLES (no FKs)
-- =============================================================================

-- site_config: key-value store for runtime configuration
CREATE TABLE site_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- demo_types: the 7 demo categories
CREATE TABLE demo_types (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  description text,
  icon text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

-- verticals: industry verticals
CREATE TABLE verticals (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  description text,
  icon text,
  config jsonb DEFAULT '{}',
  active boolean NOT NULL DEFAULT true
);

-- =============================================================================
-- 2. CONTENT TABLES
-- =============================================================================

-- vertical_content: vertical-specific content pieces
CREATE TABLE vertical_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id text NOT NULL REFERENCES verticals(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_key text NOT NULL,
  content_data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 3. LEAD & SESSION TABLES
-- =============================================================================

-- demo_leads: captured email gate leads
CREATE TABLE demo_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  company text,
  vertical_interest text,
  source_demo text,
  subscribed boolean NOT NULL DEFAULT false, -- REV-018: explicit opt-in required
  subscribed_at timestamptz,
  jwt_version integer NOT NULL DEFAULT 1,    -- REV-012: increment to revoke tokens
  revoked_at timestamptz,                    -- REV-012: admin revocation
  marketing_context jsonb DEFAULT '{}',      -- REV-033: UTM parameters
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

-- inquiries: contact form submissions
CREATE TABLE inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_type text NOT NULL CHECK (audience_type IN ('hiring', 'smb_client', 'agency', 'other', 'booking')), -- REV-010, REV-021
  name text NOT NULL,
  email text NOT NULL,
  company text,
  phone text,
  message text NOT NULL,
  form_data jsonb DEFAULT '{}',
  marketing_context jsonb DEFAULT '{}',      -- REV-033
  source_page text,
  demo_lead_id uuid REFERENCES demo_leads(id) ON DELETE SET NULL, -- REV-027
  contacted boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now() -- REV-029
);

CREATE INDEX idx_inquiries_email ON inquiries(email);
CREATE INDEX idx_inquiries_admin ON inquiries(audience_type, contacted, created_at DESC); -- REV-010
CREATE INDEX idx_inquiries_demo_lead ON inquiries(demo_lead_id); -- REV-027

-- demo_sessions: per-demo session tracking
CREATE TABLE demo_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_lead_id uuid NOT NULL REFERENCES demo_leads(id) ON DELETE CASCADE, -- REV-010
  demo_type text NOT NULL REFERENCES demo_types(id) ON DELETE RESTRICT,   -- REV-010
  vertical text NOT NULL REFERENCES verticals(id) ON DELETE RESTRICT,     -- REV-010
  interactions_count integer NOT NULL DEFAULT 0,
  live_ai_count integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_activity timestamptz NOT NULL DEFAULT now()
);

-- demo_interactions: individual interactions within a session
CREATE TABLE demo_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE, -- REV-010
  input_type text NOT NULL DEFAULT 'text' CHECK (input_type IN ('text', 'click', 'upload', 'preset_command')), -- REV-010
  user_input text,
  response text NOT NULL,
  response_data jsonb,
  from_cache boolean NOT NULL,
  latency_ms integer,
  input_tokens integer,  -- REV-005
  output_tokens integer, -- REV-005
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_demo_interactions_session ON demo_interactions(session_id);
CREATE INDEX idx_demo_interactions_analytics ON demo_interactions(session_id, created_at DESC); -- REV-010

-- =============================================================================
-- 4. CACHE & RATE LIMITING
-- =============================================================================

-- demo_cached_responses: preset command cache
CREATE TABLE demo_cached_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_type text NOT NULL REFERENCES demo_types(id) ON DELETE RESTRICT,  -- REV-010
  vertical text NOT NULL REFERENCES verticals(id) ON DELETE RESTRICT,    -- REV-010
  trigger_key text NOT NULL,         -- REV-016: preset command ID only
  sequence_order integer NOT NULL DEFAULT 0,
  prompt_text text NOT NULL,
  response_text text NOT NULL,
  response_data jsonb,
  active boolean NOT NULL DEFAULT true,
  content_version integer NOT NULL DEFAULT 1, -- REV-012
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_cached_responses_lookup ON demo_cached_responses(demo_type, vertical, trigger_key);
CREATE INDEX idx_cached_responses_sequence ON demo_cached_responses(demo_type, vertical, sequence_order) WHERE sequence_order > 0;

-- rate_limits: atomic rate tracking
CREATE TABLE rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  limit_type text NOT NULL CHECK (limit_type IN ('session', 'email_daily', 'global_daily')), -- REV-036
  demo_type text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  window_end timestamptz NOT NULL,
  UNIQUE (identifier, limit_type, demo_type, window_start) -- REV-002: enables atomic UPSERT
);

-- REV-006: indexes without volatile functions
CREATE INDEX idx_rate_limits_lookup ON rate_limits(identifier, limit_type, demo_type, window_end);
CREATE INDEX idx_rate_limits_expiry ON rate_limits(window_end);

-- =============================================================================
-- 5. SUPPORTING TABLES
-- =============================================================================

-- lead_magnet_downloads: PDF download tracking
CREATE TABLE lead_magnet_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_lead_id uuid REFERENCES demo_leads(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text,
  magnet_slug text NOT NULL,
  download_token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(), -- REV-034
  vertical text,
  source_page text,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);

-- competitive_analyses: competitive analysis reports
CREATE TABLE competitive_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES demo_sessions(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  competitors jsonb NOT NULL DEFAULT '[]',
  report_data jsonb,
  pdf_storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- api_usage_log: Claude API cost tracking
CREATE TABLE api_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_type text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  estimated_cost_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_usage_daily ON api_usage_log(created_at);

-- vertical_disclaimer_acknowledgments: legal compliance tracking
CREATE TABLE vertical_disclaimer_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_lead_id uuid NOT NULL REFERENCES demo_leads(id) ON DELETE CASCADE,
  vertical_id text NOT NULL REFERENCES verticals(id) ON DELETE RESTRICT,
  disclaimer_version integer NOT NULL DEFAULT 1,
  acknowledged_at timestamptz NOT NULL DEFAULT now()
);

-- notification_outbox: reliable async notifications
CREATE TABLE notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'lead_inquiry', 'demo_gate', 'magnet_download', 'booking'
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'exhausted')),
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  next_retry_at timestamptz,
  completed_at timestamptz
);

-- =============================================================================
-- 6. NURTURE ENGINE TABLES (Addendum Part 1)
-- =============================================================================

-- lead_scores: automated lead scoring
CREATE TABLE lead_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_lead_id uuid NOT NULL UNIQUE REFERENCES demo_leads(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  score_breakdown jsonb NOT NULL DEFAULT '{}',
  tier text NOT NULL DEFAULT 'cold' CHECK (tier IN ('cold', 'warm', 'hot', 'on_fire')),
  last_calculated timestamptz NOT NULL DEFAULT now()
);

-- drip_campaigns: automated email sequences
CREATE TABLE drip_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_tier text NOT NULL,
  trigger_vertical text REFERENCES verticals(id) ON DELETE SET NULL,
  trigger_event text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- drip_enrollments: lead enrollment in campaigns
CREATE TABLE drip_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_lead_id uuid NOT NULL REFERENCES demo_leads(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'unsubscribed')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  next_step_at timestamptz
);

-- drip_messages: AI-generated campaign messages
CREATE TABLE drip_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES drip_enrollments(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'sent', 'rejected', 'failed')),
  ai_model text NOT NULL,
  input_tokens integer,
  output_tokens integer,
  reviewed_by text,
  reviewed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 7. TRIGGERS
-- =============================================================================

-- update_timestamp: auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_cached_responses_updated_at
  BEFORE UPDATE ON demo_cached_responses
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_site_config_updated_at
  BEFORE UPDATE ON site_config
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- update_session_counts: atomically increment session counters on new interaction
CREATE OR REPLACE FUNCTION update_session_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE demo_sessions SET
    interactions_count = interactions_count + 1,
    live_ai_count = live_ai_count + CASE WHEN NEW.from_cache = false THEN 1 ELSE 0 END,
    last_activity = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_session_counts
  AFTER INSERT ON demo_interactions
  FOR EACH ROW EXECUTE FUNCTION update_session_counts();

-- =============================================================================
-- 8. ROW-LEVEL SECURITY (Section 2.5)
-- =============================================================================

-- Enable RLS on ALL 19 tables
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_cached_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_magnet_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_disclaimer_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_messages ENABLE ROW LEVEL SECURITY;

-- Public read-only: demo_types and verticals (safe for anon)
CREATE POLICY "anon_read_demo_types" ON demo_types FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_verticals" ON verticals FOR SELECT TO anon USING (true);

-- All other tables: no anon policies = implicit deny
-- All data access goes through API routes using the service_role key
