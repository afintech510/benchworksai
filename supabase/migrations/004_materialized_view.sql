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
