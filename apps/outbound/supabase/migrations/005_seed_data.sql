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
