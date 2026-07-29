-- Frowein Supply Yard — contractor lead niche-fit classification
-- Buckets the 96 Frowein leads (masonry/landscape/construction) by quality of fit
-- based on company industry, name, and keywords from Apollo.

-- ============================================================
-- 1. RAW BREAKDOWN (what Apollo classified each company as)
-- ============================================================
\echo '=== INDUSTRY BREAKDOWN BY FILTER (Frowein) ==='
SELECT
    source_batch_id,
    enrichment_data->'organization'->>'industry' AS apollo_industry,
    COUNT(*) AS leads
FROM leads
WHERE campaign_id = '0b346cca-adc5-416f-a070-d5ffed09b165'  -- Frowein campaign
GROUP BY source_batch_id, apollo_industry
ORDER BY source_batch_id, leads DESC;

-- ============================================================
-- 2. TAG STRONG-FIT: contractor-adjacent industries
-- Buyers of building/landscape/masonry materials
-- ============================================================
UPDATE leads
SET enrichment_data = enrichment_data ||
    jsonb_build_object('niche_fit', 'strong')
WHERE campaign_id = '0b346cca-adc5-416f-a070-d5ffed09b165'
  AND (
      enrichment_data->'organization'->>'industry' ILIKE ANY (ARRAY[
          '%construction%', '%landscap%', '%masonry%', '%building material%',
          '%home build%', '%residential%', '%contractor%', '%architecture%',
          '%design build%', '%real estate%', '%civil engineering%',
          '%excavation%', '%site work%', '%pool%', '%hardscape%',
          '%lawn care%', '%tree service%', '%irrigation%', '%paving%',
          '%concrete%', '%stone%', '%brick%', '%earthwork%',
          '%demolition%', '%grading%'
      ])
      OR enrichment_data->'organization'->'keywords' ?| ARRAY[
          'masonry', 'landscape', 'landscaping', 'construction',
          'contractor', 'hardscape', 'pavers', 'excavation',
          'pool builder', 'home builder', 'custom home',
          'site work', 'irrigation', 'tree service'
      ]
      OR enrichment_data->'organization'->>'name' ILIKE ANY (ARRAY[
          '%masonry%', '%construction%', '%landscap%', '%builder%',
          '%contracting%', '%excavation%', '%pool%', '%hardscape%',
          '%paving%', '%stone%', '%homes%'
      ])
  );

-- ============================================================
-- 3. TAG MEDIUM-FIT: adjacent service businesses
-- May buy materials but secondary buyers (smaller volume)
-- ============================================================
UPDATE leads
SET enrichment_data = enrichment_data ||
    jsonb_build_object('niche_fit', 'medium')
WHERE campaign_id = '0b346cca-adc5-416f-a070-d5ffed09b165'
  AND NOT (enrichment_data ? 'niche_fit')
  AND (
      enrichment_data->'organization'->>'industry' ILIKE ANY (ARRAY[
          '%property management%', '%facilities%', '%maintenance%',
          '%real estate%', '%development%', '%architect%',
          '%engineering%', '%inspection%'
      ])
  );

-- ============================================================
-- 4. EVERYTHING ELSE = WEAK FIT (probably won't buy from a supply yard)
-- ============================================================
UPDATE leads
SET enrichment_data = enrichment_data ||
    jsonb_build_object('niche_fit', 'weak')
WHERE campaign_id = '0b346cca-adc5-416f-a070-d5ffed09b165'
  AND NOT (enrichment_data ? 'niche_fit');

-- ============================================================
-- 5. FINAL DISTRIBUTION
-- ============================================================
\echo '=== FROWEIN NICHE-FIT DISTRIBUTION ==='
SELECT
    source_batch_id,
    enrichment_data->>'niche_fit' AS fit,
    COUNT(*) AS leads
FROM leads
WHERE campaign_id = '0b346cca-adc5-416f-a070-d5ffed09b165'
GROUP BY source_batch_id, fit
ORDER BY source_batch_id, fit;

-- ============================================================
-- 6. STRONG-FIT FROWEIN LEADS — actionable contractors
-- ============================================================
\echo '=== STRONG-FIT FROWEIN LEADS (sample of 30) ==='
SELECT
    first_name || ' ' || COALESCE(last_name,'') AS name,
    title,
    company,
    enrichment_data->'organization'->>'industry' AS industry,
    enrichment_data->'organization'->>'estimated_num_employees' AS employees,
    enrichment_data->'organization'->>'city' AS city,
    email
FROM leads
WHERE campaign_id = '0b346cca-adc5-416f-a070-d5ffed09b165'
  AND enrichment_data->>'niche_fit' = 'strong'
ORDER BY enrichment_data->'organization'->>'state', company
LIMIT 30;
