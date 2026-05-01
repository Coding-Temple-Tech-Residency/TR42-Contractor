-- ================================================================
-- SPRINT 4 – Final Dashboard Validation & Deployment Checks
-- TR42-Contractor Platform
-- Run AFTER sprints 1–3
-- ================================================================

-- ----------------------------------------------------------------
-- DASHBOARD VIEW 1: Executive Summary (single-row health snapshot)
-- Combines platform KPIs + AI risk signals in one place
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.dashboard_executive_summary AS
SELECT
  -- User counts
  (SELECT COUNT(*) FROM authuser WHERE is_active = true)                               AS total_active_users,
  (SELECT COUNT(*) FROM authuser WHERE user_type = 'contractor' AND is_active = true)  AS active_contractors,
  (SELECT COUNT(*) FROM authuser WHERE user_type = 'vendor' AND is_active = true)      AS active_vendors,
  (SELECT COUNT(*) FROM authuser WHERE user_type = 'client' AND is_active = true)      AS active_clients,

  -- Work order pipeline
  (SELECT COUNT(*) FROM work_order WHERE current_status NOT IN ('completed','cancelled','closed')) AS open_work_orders,
  (SELECT COUNT(*) FROM work_order WHERE current_status = 'completed')                 AS completed_work_orders,
  (SELECT ROUND(
    COUNT(*) FILTER (WHERE current_status = 'completed')::numeric / NULLIF(COUNT(*),0) * 100, 2
  ) FROM work_order)                                                                   AS wo_completion_rate_pct,

  -- Ticket health
  (SELECT COUNT(*) FROM ticket WHERE status NOT IN ('completed','closed'))             AS open_tickets,
  (SELECT COUNT(*) FROM ticket WHERE anomaly_flag = true)                              AS flagged_tickets,
  (SELECT ROUND(
    COUNT(*) FILTER (WHERE anomaly_flag = true)::numeric / NULLIF(COUNT(*),0) * 100, 2
  ) FROM ticket)                                                                       AS anomaly_rate_pct,

  -- Contractor quality
  (SELECT ROUND(AVG(average_rating)::numeric, 2) FROM contractor WHERE average_rating IS NOT NULL) AS avg_contractor_rating,
  (SELECT COUNT(*) FROM analytics.ai_contractor_churn_risk WHERE churn_risk_level IN ('HIGH_CHURN_RISK','NEVER_ACTIVE')) AS contractors_at_churn_risk,
  (SELECT COUNT(*) FROM analytics.ai_anomaly_contractor_risk WHERE risk_level = 'HIGH_RISK') AS high_risk_contractors,

  -- Inspection quality
  (SELECT ROUND(
    COUNT(*) FILTER (WHERE status = 'passed')::numeric / NULLIF(COUNT(*) FILTER (WHERE skipped = false),0) * 100, 2
  ) FROM inspections)                                                                  AS inspection_pass_rate_pct,
  (SELECT COUNT(*) FROM ai_inspection_reports)                                         AS total_ai_reports,

  -- Delay risk
  (SELECT COUNT(*) FROM analytics.ai_work_order_delay_risk WHERE delay_category IN ('HIGH','CRITICAL')) AS high_delay_risk_orders,

  -- Event activity (last 7 days)
  (SELECT COUNT(DISTINCT user_id) FROM public.event_log WHERE created_at >= NOW() - INTERVAL '7 days') AS wau_last_7_days,
  (SELECT COUNT(*) FROM public.event_log WHERE created_at >= NOW() - INTERVAL '1 day') AS events_last_24h,

  NOW() AS generated_at;

-- ----------------------------------------------------------------
-- DASHBOARD VIEW 2: Weekly Trend Report
-- Combines work orders, tickets, anomalies, events per week
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.dashboard_weekly_trends AS
SELECT
  DATE_TRUNC('week', gs.week)::date                AS week_start,
  COALESCE(wo.total_created, 0)                    AS work_orders_created,
  COALESCE(wo.completed, 0)                        AS work_orders_completed,
  COALESCE(t.total_tickets, 0)                     AS tickets_created,
  COALESCE(t.anomalous, 0)                         AS anomalous_tickets,
  COALESCE(ev.total_events, 0)                     AS platform_events,
  COALESCE(ev.unique_users, 0)                     AS weekly_active_users,
  COALESCE(insp.passed, 0)                         AS inspections_passed,
  COALESCE(insp.failed, 0)                         AS inspections_failed
FROM
  generate_series(
    DATE_TRUNC('week', NOW() - INTERVAL '12 weeks'),
    DATE_TRUNC('week', NOW()),
    INTERVAL '1 week'
  ) AS gs(week)
LEFT JOIN (
  SELECT
    DATE_TRUNC('week', created_at) AS wk,
    COUNT(*) AS total_created,
    COUNT(*) FILTER (WHERE current_status = 'completed') AS completed
  FROM work_order GROUP BY wk
) wo ON wo.wk = DATE_TRUNC('week', gs.week)
LEFT JOIN (
  SELECT
    DATE_TRUNC('week', created_at) AS wk,
    COUNT(*) AS total_tickets,
    COUNT(*) FILTER (WHERE anomaly_flag = true) AS anomalous
  FROM ticket GROUP BY wk
) t ON t.wk = DATE_TRUNC('week', gs.week)
LEFT JOIN (
  SELECT
    DATE_TRUNC('week', created_at) AS wk,
    COUNT(*) AS total_events,
    COUNT(DISTINCT user_id) AS unique_users
  FROM public.event_log GROUP BY wk
) ev ON ev.wk = DATE_TRUNC('week', gs.week)
LEFT JOIN (
  SELECT
    DATE_TRUNC('week', created_at) AS wk,
    COUNT(*) FILTER (WHERE status = 'passed') AS passed,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed
  FROM inspections GROUP BY wk
) insp ON insp.wk = DATE_TRUNC('week', gs.week)
ORDER BY week_start DESC;

-- ----------------------------------------------------------------
-- DASHBOARD VIEW 3: Contractor Performance Leaderboard
-- Ranks contractors by tickets completed, rating, anomaly rate
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.dashboard_contractor_leaderboard AS
SELECT
  c.id,
  au.first_name || ' ' || au.last_name    AS contractor_name,
  c.role,
  c.status,
  c.tickets_completed,
  c.tickets_open,
  COALESCE(c.average_rating, 0)           AS rating,
  COALESCE(risk.anomaly_rate_pct, 0)      AS anomaly_rate_pct,
  COALESCE(risk.risk_level, 'LOW_RISK')   AS risk_level,
  COALESCE(churn.churn_risk_level, 'ACTIVE') AS churn_risk,
  RANK() OVER (ORDER BY c.tickets_completed DESC, c.average_rating DESC NULLS LAST) AS performance_rank
FROM contractor c
JOIN authuser au ON au.id = c.user_id
LEFT JOIN analytics.ai_anomaly_contractor_risk risk ON risk.contractor_id = c.id
LEFT JOIN analytics.ai_contractor_churn_risk churn  ON churn.contractor_id = c.id
ORDER BY performance_rank;

-- ----------------------------------------------------------------
-- VALIDATION CHECK 1: Confirm all KPI views exist
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.validation_kpi_view_check AS
SELECT viewname, schemaname
FROM pg_views
WHERE schemaname = 'analytics'
ORDER BY viewname;

-- ----------------------------------------------------------------
-- VALIDATION CHECK 2: Event log coverage
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.validation_event_coverage AS
SELECT
  etp.event_name,
  etp.related_kpi,
  etp.team_owner,
  COUNT(el.id)            AS logged_count,
  MAX(el.created_at)      AS last_logged,
  CASE WHEN COUNT(el.id) = 0 THEN 'NOT_YET_FIRED' ELSE 'ACTIVE' END AS status
FROM public.event_tracking_plan etp
LEFT JOIN public.event_log el ON el.event_name = etp.event_name
GROUP BY etp.event_name, etp.related_kpi, etp.team_owner
ORDER BY logged_count DESC;

-- ----------------------------------------------------------------
-- VALIDATION CHECK 3: Data completeness across core tables
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.validation_data_completeness AS
SELECT 'authuser'          AS table_name, COUNT(*) AS row_count FROM authuser
UNION ALL
SELECT 'vendor',           COUNT(*) FROM vendor
UNION ALL
SELECT 'client',           COUNT(*) FROM client
UNION ALL
SELECT 'contractor',       COUNT(*) FROM contractor
UNION ALL
SELECT 'work_order',       COUNT(*) FROM work_order
UNION ALL
SELECT 'ticket',           COUNT(*) FROM ticket
UNION ALL
SELECT 'inspections',      COUNT(*) FROM inspections
UNION ALL
SELECT 'inspection_results', COUNT(*) FROM inspection_results
UNION ALL
SELECT 'ai_inspection_reports', COUNT(*) FROM ai_inspection_reports
UNION ALL
SELECT 'event_log',        COUNT(*) FROM public.event_log
ORDER BY row_count DESC;

-- ----------------------------------------------------------------
-- FINAL: Print summary of all analytics views created
-- ----------------------------------------------------------------
SELECT
  schemaname,
  viewname,
  CASE
    WHEN viewname LIKE 'kpi_%'          THEN 'Sprint 1–2 KPI'
    WHEN viewname LIKE 'ai_%'           THEN 'Sprint 3 AI Insight'
    WHEN viewname LIKE 'dashboard_%'    THEN 'Sprint 4 Dashboard'
    WHEN viewname LIKE 'validation_%'   THEN 'Sprint 4 Validation'
    ELSE 'Other'
  END AS category
FROM pg_views
WHERE schemaname = 'analytics'
ORDER BY category, viewname;
