-- =============================================================================
-- Client-report platform — discovery submissions + report engagement telemetry
-- Both tables are written ONLY by API routes using the service_role key, which
-- bypasses RLS. RLS is enabled with NO policies (implicit deny for anon/auth).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- discovery_submissions: one row per questionnaire submit (partial or complete).
-- The raw answers live in payload_jsonb; only a hash of the user-agent is kept
-- (never the raw UA, IP, or any fingerprint).
CREATE TABLE discovery_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  form_id text,
  payload_jsonb jsonb NOT NULL DEFAULT '{}',
  partial boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  user_agent_hash text
);

CREATE INDEX idx_discovery_submissions_slug ON discovery_submissions (slug);

COMMENT ON TABLE discovery_submissions IS
  'Discovery questionnaire submissions. Written by /api/discovery/submit (service_role only). Retention: 12 months — purge rows where submitted_at < now() - interval ''12 months''.';

-- report_engagement: one accumulating row per report slug. Opt-in telemetry
-- only; stores NO IP, user-agent, or fingerprint of any kind.
CREATE TABLE report_engagement (
  slug text PRIMARY KEY,
  first_open_at timestamptz,
  total_visible_ms bigint NOT NULL DEFAULT 0,
  deepest_section text,
  print_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE report_engagement IS
  'Aggregate, anonymous report engagement (opt-in). Written by /api/reports/telemetry (service_role only). Retention: 12 months — purge rows where updated_at < now() - interval ''12 months''.';

-- =============================================================================
-- RLS: enabled, no policies. All access is via service_role (bypasses RLS).
-- =============================================================================
ALTER TABLE discovery_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_engagement ENABLE ROW LEVEL SECURITY;
