-- ================================================================
-- SPRINT 3 – AI Features & Anomaly Detection Views
-- TR42-Contractor Platform
-- Run AFTER sprint1 and sprint2 scripts
-- ================================================================

-- ----------------------------------------------------------------
-- AI INSIGHT 1: Anomaly Detection Summary
-- Flags contractors with elevated anomaly rates (>20%)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.ai_anomaly_contractor_risk AS
SELECT
  c.id                                           AS contractor_id,
  au.first_name || ' ' || au.last_name           AS contractor_name,
  au.email,
  c.role,
  c.status,
  c.average_rating,
  COUNT(t.id)                                    AS total_tickets,
  COUNT(t.id) FILTER (WHERE t.anomaly_flag = true) AS anomalous_tickets,
  ROUND(
    COUNT(t.id) FILTER (WHERE t.anomaly_flag = true)::numeric
    / NULLIF(COUNT(t.id), 0) * 100, 2
  )                                              AS anomaly_rate_pct,
  CASE
    WHEN COUNT(t.id) FILTER (WHERE t.anomaly_flag = true)::numeric
         / NULLIF(COUNT(t.id), 0) > 0.3          THEN 'HIGH_RISK'
    WHEN COUNT(t.id) FILTER (WHERE t.anomaly_flag = true)::numeric
         / NULLIF(COUNT(t.id), 0) > 0.1          THEN 'MEDIUM_RISK'
    ELSE                                               'LOW_RISK'
  END                                            AS risk_level
FROM contractor c
JOIN authuser au ON au.id = c.user_id
LEFT JOIN ticket t ON t.assigned_contractor = c.id
GROUP BY c.id, au.first_name, au.last_name, au.email, c.role, c.status, c.average_rating
ORDER BY anomaly_rate_pct DESC NULLS LAST;

-- ----------------------------------------------------------------
-- AI INSIGHT 2: Anomalous Tickets Detail
-- For drill-down into specific flagged tickets
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.ai_anomalous_ticket_detail AS
SELECT
  t.id                                         AS ticket_id,
  t.anomaly_reason,
  t.priority,
  t.status,
  t.service_type,
  t.created_at,
  t.start_time,
  t.end_time,
  ROUND(
    EXTRACT(EPOCH FROM (t.end_time - t.start_time)) / 3600.0, 2
  )                                            AS duration_hours,
  wo.work_order_name,
  wo.location,
  wo.priority                                  AS work_order_priority,
  c.id                                         AS contractor_id,
  au.first_name || ' ' || au.last_name         AS contractor_name,
  c.average_rating
FROM ticket t
LEFT JOIN work_order wo ON wo.id = t.work_order_id
LEFT JOIN contractor c  ON c.id  = t.assigned_contractor
LEFT JOIN authuser au   ON au.id = c.user_id
WHERE t.anomaly_flag = true
ORDER BY t.created_at DESC;

-- ----------------------------------------------------------------
-- AI INSIGHT 3: Predictive – Work Order Delay Risk
-- Orders with past due estimated end date still not completed
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.ai_work_order_delay_risk AS
SELECT
  wo.id                                        AS work_order_id,
  wo.work_order_name,
  wo.priority,
  wo.current_status,
  wo.estimated_start_date,
  wo.estimated_end_date,
  wo.estimated_cost,
  CURRENT_DATE - wo.estimated_end_date         AS days_overdue,
  v.company_name                               AS vendor,
  au.first_name || ' ' || au.last_name         AS created_by_user,
  CASE
    WHEN CURRENT_DATE - wo.estimated_end_date > 14 THEN 'CRITICAL'
    WHEN CURRENT_DATE - wo.estimated_end_date > 7  THEN 'HIGH'
    WHEN CURRENT_DATE - wo.estimated_end_date > 0  THEN 'AT_RISK'
    ELSE 'ON_TRACK'
  END                                          AS delay_category
FROM work_order wo
LEFT JOIN vendor v    ON v.id  = wo.assigned_vendor
LEFT JOIN authuser au ON au.id = wo.created_by
WHERE wo.current_status NOT IN ('completed', 'cancelled', 'closed')
ORDER BY days_overdue DESC NULLS LAST;

-- ----------------------------------------------------------------
-- AI INSIGHT 4: Contractor Churn Prediction
-- Contractors with zero recent activity (no tickets in 30 days)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.ai_contractor_churn_risk AS
SELECT
  c.id                                         AS contractor_id,
  au.first_name || ' ' || au.last_name         AS contractor_name,
  au.email,
  c.status,
  c.role,
  c.tickets_completed,
  c.tickets_open,
  c.average_rating,
  MAX(t.created_at)                            AS last_ticket_date,
  CURRENT_DATE - MAX(t.created_at)::date       AS days_since_last_ticket,
  CASE
    WHEN MAX(t.created_at) IS NULL                            THEN 'NEVER_ACTIVE'
    WHEN CURRENT_DATE - MAX(t.created_at)::date > 60          THEN 'HIGH_CHURN_RISK'
    WHEN CURRENT_DATE - MAX(t.created_at)::date > 30          THEN 'MEDIUM_CHURN_RISK'
    ELSE                                                           'ACTIVE'
  END                                          AS churn_risk_level
FROM contractor c
JOIN authuser au    ON au.id = c.user_id
LEFT JOIN ticket t ON t.assigned_contractor = c.id
WHERE c.status = 'active'
GROUP BY c.id, au.first_name, au.last_name, au.email,
         c.status, c.role, c.tickets_completed, c.tickets_open, c.average_rating
ORDER BY days_since_last_ticket DESC NULLS FIRST;

-- ----------------------------------------------------------------
-- AI INSIGHT 5: Inspection Failure Pattern Analysis
-- Identifies inspection items most commonly failing
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.ai_inspection_failure_patterns AS
SELECT
  ii.label                                    AS inspection_item,
  it.name                                     AS template_name,
  is2.name                                    AS section_name,
  COUNT(ir.id)                                AS times_checked,
  COUNT(ir.id) FILTER (WHERE ir.passed = false) AS times_failed,
  ROUND(
    COUNT(ir.id) FILTER (WHERE ir.passed = false)::numeric
    / NULLIF(COUNT(ir.id), 0) * 100, 2
  )                                           AS failure_rate_pct
FROM inspection_results ir
JOIN inspection_items ii      ON ii.id = ir.item_id
JOIN inspection_sections is2  ON is2.id = ii.section_id
JOIN inspection_templates it  ON it.id = is2.template_id
GROUP BY ii.label, it.name, is2.name
ORDER BY failure_rate_pct DESC, times_failed DESC;

-- ----------------------------------------------------------------
-- AI INSIGHT 6: AI Inspection Report Anomaly Summary
-- Aggregates patterns from ai_inspection_reports table
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.ai_report_summary AS
SELECT
  DATE_TRUNC('month', created_at)::date       AS month,
  COUNT(*)                                    AS total_ai_reports,
  COUNT(*) FILTER (WHERE recommended_actions IS NOT NULL
    AND recommended_actions::text != '[]'
    AND recommended_actions::text != 'null') AS reports_with_recommendations,
  ROUND(
    COUNT(*) FILTER (WHERE recommended_actions IS NOT NULL
      AND recommended_actions::text != '[]'
      AND recommended_actions::text != 'null')::numeric
    / NULLIF(COUNT(*), 0) * 100, 2
  )                                           AS recommendation_rate_pct
FROM ai_inspection_reports
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ----------------------------------------------------------------
-- AI INSIGHT 7: Work Order Trend Analysis (weekly volume + cost)
-- Used for predictive demand forecasting
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.ai_work_order_trend AS
SELECT
  DATE_TRUNC('week', created_at)::date        AS week_start,
  COUNT(*) AS total_created,
  COUNT(*) FILTER (WHERE current_status = 'completed') AS completed,
  ROUND(AVG(estimated_cost)::numeric, 2)      AS avg_estimated_cost,
  ROUND(SUM(estimated_cost)::numeric, 2)      AS total_estimated_value,
  COUNT(DISTINCT assigned_vendor)             AS distinct_vendors
FROM work_order
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start DESC;

-- ----------------------------------------------------------------
-- EVENT-BASED ANOMALY: Spike detection in event_log
-- Flags days where login failures exceed 20% of attempts
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.ai_auth_anomaly_days AS
SELECT
  DATE(created_at)                             AS day,
  COUNT(*) FILTER (WHERE event_name = 'user_login')        AS logins,
  COUNT(*) FILTER (WHERE event_name = 'user_login_failed') AS failures,
  ROUND(
    COUNT(*) FILTER (WHERE event_name = 'user_login_failed')::numeric
    / NULLIF(
        COUNT(*) FILTER (WHERE event_name IN ('user_login','user_login_failed')), 0
      ) * 100, 2
  )                                            AS failure_rate_pct,
  CASE
    WHEN COUNT(*) FILTER (WHERE event_name = 'user_login_failed')::numeric
         / NULLIF(
             COUNT(*) FILTER (WHERE event_name IN ('user_login','user_login_failed')), 0
           ) > 0.3 THEN 'ANOMALY_SPIKE'
    ELSE 'NORMAL'
  END                                          AS anomaly_flag
FROM public.event_log
WHERE event_name IN ('user_login', 'user_login_failed')
GROUP BY DATE(created_at)
HAVING COUNT(*) > 3
ORDER BY day DESC;
