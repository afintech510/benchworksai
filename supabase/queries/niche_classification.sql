-- Post-burn lead classification queries
-- Use these to assess niche fit AFTER the Apollo burn completes.
-- Apollo's API can't filter by industry, so we captured everything and bucket via SQL here.

-- ============================================================
-- 1. RAW COUNTS BY FILTER SET
-- ============================================================
SELECT
    source_batch_id AS filter_set,
    enrichment_data->>'niche' AS intended_niche,
    COUNT(*) AS leads
FROM leads
WHERE source = 'apollo_api_2026_05'
GROUP BY source_batch_id, enrichment_data->>'niche'
ORDER BY intended_niche, filter_set;

-- ============================================================
-- 2. INDUSTRY BREAKDOWN PER FILTER SET
-- Shows what Apollo actually classified each lead's company as
-- ============================================================
SELECT
    source_batch_id AS filter_set,
    enrichment_data->'organization'->>'industry' AS apollo_industry,
    COUNT(*) AS leads
FROM leads
WHERE source = 'apollo_api_2026_05'
GROUP BY source_batch_id, apollo_industry
ORDER BY filter_set, leads DESC;

-- ============================================================
-- 3. TAG NICHE-FIT (manufacturers)
-- ============================================================
UPDATE leads
SET enrichment_data = enrichment_data ||
    jsonb_build_object('niche_fit', 'strong')
WHERE source = 'apollo_api_2026_05'
  AND enrichment_data->>'niche' = 'manufacturers'
  AND (
      enrichment_data->'organization'->>'industry' ILIKE ANY (ARRAY[
          '%manufactur%', '%industrial%', '%machinery%', '%equipment%',
          '%aerospace%', '%defense%', '%electronics%', '%semiconductor%',
          '%water treatment%', '%food%', '%beverage%', '%pharma%',
          '%chemical%', '%processing%', '%automation%', '%controls%'
      ])
      OR enrichment_data->'organization'->'keywords' ?| ARRAY[
          'manufacturing', 'industrial', 'machinery', 'production',
          'aerospace', 'defense', 'water treatment'
      ]
  );

-- ============================================================
-- 4. TAG NICHE-FIT (healthcare_staffing)
-- ============================================================
UPDATE leads
SET enrichment_data = enrichment_data ||
    jsonb_build_object('niche_fit', 'strong')
WHERE source = 'apollo_api_2026_05'
  AND enrichment_data->>'niche' = 'healthcare_staffing'
  AND (
      enrichment_data->'organization'->>'industry' ILIKE ANY (ARRAY[
          '%staffing%', '%nursing%', '%healthcare%', '%medical%',
          '%hospital%', '%clinic%', '%physician%', '%locum%',
          '%therapy%', '%rehabilitation%'
      ])
      OR enrichment_data->'organization'->'keywords' ?| ARRAY[
          'staffing', 'nursing', 'healthcare', 'travel nursing',
          'locum', 'allied health', 'physician'
      ]
  );

-- ============================================================
-- 5. TAG NICHE-FIT (wealth_trust)
-- ============================================================
UPDATE leads
SET enrichment_data = enrichment_data ||
    jsonb_build_object('niche_fit', 'strong')
WHERE source = 'apollo_api_2026_05'
  AND enrichment_data->>'niche' = 'wealth_trust'
  AND (
      enrichment_data->'organization'->>'industry' ILIKE ANY (ARRAY[
          '%wealth%', '%trust%', '%family office%', '%advisory%',
          '%investment%', '%financial%', '%legal services%', '%law practice%',
          '%estate%', '%probate%', '%private bank%'
      ])
      OR enrichment_data->'organization'->'keywords' ?| ARRAY[
          'wealth management', 'family office', 'trust', 'estate planning',
          'private wealth', 'financial advisory', 'investment advisor'
      ]
  );

-- ============================================================
-- 6. MARK EVERYTHING ELSE AS WEAK FIT
-- ============================================================
UPDATE leads
SET enrichment_data = enrichment_data ||
    jsonb_build_object('niche_fit', 'weak')
WHERE source = 'apollo_api_2026_05'
  AND NOT (enrichment_data ? 'niche_fit');

-- ============================================================
-- 7. FINAL STATS — what survived
-- ============================================================
SELECT
    enrichment_data->>'niche' AS intended_niche,
    enrichment_data->>'niche_fit' AS fit,
    COUNT(*) AS leads
FROM leads
WHERE source = 'apollo_api_2026_05'
GROUP BY intended_niche, fit
ORDER BY intended_niche, fit;

-- ============================================================
-- 8. SAMPLE STRONG-FIT LEADS (for sanity check)
-- ============================================================
SELECT
    first_name, last_name, title, company,
    enrichment_data->'organization'->>'industry' AS industry,
    enrichment_data->'organization'->>'estimated_num_employees' AS employees,
    enrichment_data->'organization'->>'city' AS city,
    enrichment_data->'organization'->>'state' AS state,
    source_batch_id
FROM leads
WHERE source = 'apollo_api_2026_05'
  AND enrichment_data->>'niche_fit' = 'strong'
ORDER BY random()
LIMIT 20;
