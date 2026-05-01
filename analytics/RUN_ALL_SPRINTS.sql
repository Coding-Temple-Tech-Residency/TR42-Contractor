-- ================================================================
-- TR42-Contractor – Data Analyst Sprint Plan: Master Run Script
-- Paste this into Neon SQL Editor to deploy all 4 sprints at once
-- Or run individual sprint files in order:
--   1. sprint1_kpi_views.sql
--   2. sprint2_event_tracking.sql
--   3. sprint3_ai_insights.sql
--   4. sprint4_final_dashboard.sql
-- ================================================================

-- After running, query the final validation:
--   SELECT * FROM analytics.validation_data_completeness;
--   SELECT * FROM analytics.validation_kpi_view_check;
--   SELECT * FROM analytics.validation_event_coverage;
--   SELECT * FROM analytics.dashboard_executive_summary;

-- ================================================================
-- SPRINT 1 – KPI VIEWS
-- ================================================================
\i sprint1_kpi_views.sql

-- ================================================================
-- SPRINT 2 – EVENT TRACKING + SAMPLE DATA
-- ================================================================
\i sprint2_event_tracking.sql

-- ================================================================
-- SPRINT 3 – AI INSIGHTS + ANOMALY DETECTION
-- ================================================================
\i sprint3_ai_insights.sql

-- ================================================================
-- SPRINT 4 – FINAL DASHBOARD + VALIDATION
-- ================================================================
\i sprint4_final_dashboard.sql

-- ================================================================
-- VERIFY EVERYTHING DEPLOYED
-- ================================================================
SELECT category, COUNT(*) AS view_count
FROM (
  SELECT
    CASE
      WHEN viewname LIKE 'kpi_%'        THEN 'Sprint 1-2 KPI'
      WHEN viewname LIKE 'ai_%'         THEN 'Sprint 3 AI Insight'
      WHEN viewname LIKE 'dashboard_%'  THEN 'Sprint 4 Dashboard'
      WHEN viewname LIKE 'validation_%' THEN 'Sprint 4 Validation'
      ELSE 'Other'
    END AS category
  FROM pg_views WHERE schemaname = 'analytics'
) x
GROUP BY category
ORDER BY category;
