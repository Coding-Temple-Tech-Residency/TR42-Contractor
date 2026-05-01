-- ================================================================
-- SPRINT 1 – Foundation: KPI Views for TR42-Contractor Platform
-- Run in Neon SQL Editor or via psql
-- Creates analytics schema + all KPI views mapped to TR42 tables
-- ================================================================

CREATE SCHEMA IF NOT EXISTS analytics;

-- ----------------------------------------------------------------
-- KPI 1: Daily Active Users by User Type
-- Based on: authuser.created_at as a signup proxy
-- (replace with event_log.created_at once Sprint 2 is live)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.kpi_daily_active_users AS
SELECT
  DATE(created_at) AS activity_date,
  user_type,
  COUNT(*) AS new_signups
FROM authuser
WHERE is_active = true
GROUP BY DATE(created_at), user_type
ORDER BY activity_date DESC;

-- ----------------------------------------------------------------
-- KPI 2: Weekly New User Signups (Signup Conversion Proxy)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.kpi_weekly_signups AS
SELECT
  DATE_TRUNC('week', created_at)::date AS week_start,
  user_type,
  COUNT(*) AS signups
FROM authuser
GROUP BY DATE_TRUNC('week', created_at), user_type
ORDER BY week_start DESC;

-- ----------------------------------------------------------------
-- KPI 3: Work Order Completion Rate
-- (completed work orders / total work orders per month)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.kpi_work_order_completion_rate AS
SELECT
  DATE_TRUNC('month', created_at)::date AS month,
  COUNT(*) AS total_work_orders,
  COUNT(*) FILTER (WHERE current_status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE current_status = 'cancelled') AS cancelled,
  COUNT(*) FILTER (WHERE current_status = 'halted') AS halted,
  ROUND(
    COUNT(*) FILTER (WHERE current_status = 'completed')::numeric / NULLIF(COUNT(*), 0) * 100,
    2
  ) AS completion_rate_pct
FROM work_order
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ----------------------------------------------------------------
-- KPI 4: Average Work Order Duration (assigned → completed, in days)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.kpi_avg_work_order_duration AS
SELECT
  DATE_TRUNC('month', completed_at)::date AS month,
  priority,
  COUNT(*) AS completed_orders,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (completed_at - assigned_at)) / 86400)::numeric,
    2
  ) AS avg_duration_days,
  ROUND(
    MIN(EXTRACT(EPOCH FROM (completed_at - assigned_at)) / 86400)::numeric,
    2
  ) AS min_days,
  ROUND(
    MAX(EXTRACT(EPOCH FROM (completed_at - assigned_at)) / 86400)::numeric,
    2
  ) AS max_days
FROM work_order
WHERE completed_at IS NOT NULL AND assigned_at IS NOT NULL
GROUP BY DATE_TRUNC('month', completed_at), priority
ORDER BY month DESC;

-- ----------------------------------------------------------------
-- KPI 5: Ticket Resolution Time (created → end_time, in hours)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.kpi_ticket_resolution_time AS
SELECT
  DATE_TRUNC('month', created_at)::date AS month,
  priority,
  status,
  COUNT(*) AS ticket_count,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (end_time - created_at)) / 3600)::numeric,
    2
  ) AS avg_resolution_hours,
  ROUND(
    PERCENTILE_CONT(0.5) WITHIN GROUP (
      ORDER BY EXTRACT(EPOCH FROM (end_time - created_at)) / 3600
    )::numeric,
    2
  ) AS median_resolution_hours
FROM ticket
WHERE end_time IS NOT NULL
GROUP BY DATE_TRUNC('month', created_at), priority, status
ORDER BY month DESC;

-- ----------------------------------------------------------------
-- KPI 6: Contractor Utilization Rate
-- (contractors with open tickets / total active contractors)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.kpi_contractor_utilization AS
SELECT
  COUNT(*) AS total_contractors,
  COUNT(*) FILTER (WHERE status = 'active') AS active_contractors,
  COUNT(*) FILTER (WHERE tickets_open > 0) AS contractors_with_open_tickets,
  ROUND(
    COUNT(*) FILTER (WHERE tickets_open > 0)::numeric
    / NULLIF(COUNT(*) FILTER (WHERE status = 'active'), 0) * 100,
    2
  ) AS utilization_rate_pct,
  ROUND(AVG(average_rating)::numeric, 2) AS avg_contractor_rating,
  ROUND(AVG(tickets_completed)::numeric, 2) AS avg_tickets_completed
FROM contractor;

-- ----------------------------------------------------------------
-- KPI 7: Anomaly Rate (tickets flagged as anomalies)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.kpi_anomaly_rate AS
SELECT
  DATE_TRUNC('week', created_at)::date AS week_start,
  COUNT(*) AS total_tickets,
  COUNT(*) FILTER (WHERE anomaly_flag = true) AS anomalous_tickets,
  ROUND(
    COUNT(*) FILTER (WHERE anomaly_flag = true)::numeric
    / NULLIF(COUNT(*), 0) * 100,
    2
  ) AS anomaly_rate_pct
FROM ticket
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start DESC;

-- ----------------------------------------------------------------
-- KPI 8: Inspection Pass Rate
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.kpi_inspection_pass_rate AS
SELECT
  DATE_TRUNC('month', created_at)::date AS month,
  COUNT(*) AS total_inspections,
  COUNT(*) FILTER (WHERE status = 'passed') AS passed,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  COUNT(*) FILTER (WHERE skipped = true) AS skipped,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'passed')::numeric
    / NULLIF(COUNT(*) FILTER (WHERE skipped = false), 0) * 100,
    2
  ) AS pass_rate_pct
FROM inspections
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ----------------------------------------------------------------
-- KPI 9: Vendor Status Summary (Compliance Overview)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.kpi_vendor_compliance AS
SELECT
  status,
  compliance_status,
  COUNT(*) AS vendor_count
FROM vendor
GROUP BY status, compliance_status
ORDER BY status, compliance_status;

-- ----------------------------------------------------------------
-- KPI 10: Work Order Pipeline by Priority & Status
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.kpi_work_order_pipeline AS
SELECT
  priority,
  current_status,
  COUNT(*) AS count,
  ROUND(AVG(estimated_cost)::numeric, 2) AS avg_estimated_cost,
  ROUND(SUM(estimated_cost)::numeric, 2) AS total_estimated_cost
FROM work_order
GROUP BY priority, current_status
ORDER BY priority, current_status;

-- ----------------------------------------------------------------
-- KPI SUMMARY DASHBOARD: One-row snapshot of platform health
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.kpi_platform_summary AS
SELECT
  (SELECT COUNT(*) FROM authuser WHERE is_active = true) AS total_active_users,
  (SELECT COUNT(*) FROM authuser WHERE user_type = 'contractor' AND is_active = true) AS total_active_contractors,
  (SELECT COUNT(*) FROM authuser WHERE user_type = 'vendor' AND is_active = true) AS total_active_vendors,
  (SELECT COUNT(*) FROM authuser WHERE user_type = 'client' AND is_active = true) AS total_active_clients,
  (SELECT COUNT(*) FROM work_order) AS total_work_orders,
  (SELECT COUNT(*) FROM work_order WHERE current_status = 'completed') AS completed_work_orders,
  (SELECT COUNT(*) FROM work_order WHERE current_status IN ('open','assigned','in_progress')) AS open_work_orders,
  (SELECT COUNT(*) FROM ticket) AS total_tickets,
  (SELECT COUNT(*) FROM ticket WHERE anomaly_flag = true) AS anomalous_tickets,
  (SELECT COUNT(*) FROM inspections WHERE status = 'passed') AS passed_inspections,
  (SELECT COUNT(*) FROM inspections WHERE status = 'failed') AS failed_inspections,
  (SELECT ROUND(AVG(average_rating)::numeric, 2) FROM contractor) AS avg_contractor_rating;
