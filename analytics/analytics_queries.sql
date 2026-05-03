-- ============================================================
-- TR42 Contractor Mobile App - Analytics Queries (CORRECTED)
-- Schema source of truth: backend/app/models.py
-- Fixed by: schema reconciliation against live models.py
-- ============================================================
--
-- KEY CORRECTIONS vs. original analytics_queries.sql:
--   tickets           → ticket        (table name)
--   contractorid      → assigned_contractor
--   createdat         → created_at
--   anomalyflag       → anomaly_flag
--   pickupdatetime    → start_time
--   deliverydatetime  → end_time
--   workorders        → work_order
--   auth_users/users  → auth_user
--   status 'completed'→ 'COMPLETED'  (enum is uppercase)
--   freightamount     → REMOVED (not in models.py)
--   paymentstatus     → REMOVED (not in models.py)
--   geofenceverified  → REMOVED (use anomaly_flag instead)
--   biometricverified → REMOVED (use contractor.biometric_enrolled)
--   ticketnumber      → REMOVED (not in models.py)
--   pickuplocation    → REMOVED (not in models.py)
--   deliverylocation  → REMOVED (not in models.py)
--   rating (on ticket)→ REMOVED (not in models.py)
--   contractorperformance table → REMOVED (doesn't exist)
--                     → replaced with contractor.average_rating
-- ============================================================

-- ============================================================
-- PART 1: CONTRACTOR DASHBOARD - STATS CARDS
-- ============================================================

-- 1.1 Total Jobs (tickets assigned to contractor)
SELECT
    COUNT(*) AS total_jobs
FROM ticket
WHERE assigned_contractor = :contractor_id;

-- 1.2 Completed Jobs
SELECT
    COUNT(*) AS completed_jobs
FROM ticket
WHERE assigned_contractor = :contractor_id
    AND status = 'COMPLETED';

-- 1.3 Completion Rate
SELECT
    ROUND(
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::NUMERIC /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS completion_rate
FROM ticket
WHERE assigned_contractor = :contractor_id;

-- 1.4 Anomaly/Flag Rate
-- NOTE: geofenceverified and biometricverified don't exist.
-- anomaly_flag on the ticket model is the equivalent signal.
SELECT
    ROUND(
        COUNT(*) FILTER (WHERE anomaly_flag = TRUE)::NUMERIC /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS flag_rate
FROM ticket
WHERE assigned_contractor = :contractor_id
    AND status = 'COMPLETED';

-- 1.5 Average Rating
-- NOTE: contractorperformance table does NOT exist.
-- average_rating is a denormalized field on the contractor table itself.
SELECT
    ROUND(average_rating::NUMERIC, 2) AS avg_rating
FROM contractor
WHERE id = :contractor_id;

-- 1.6 Total Earnings
-- NOTE: freightamount and paymentstatus do NOT exist on the ticket model.
-- These columns are on the roadmap discussion — queries are blocked until
-- schema decision is made. Placeholder returning NULL until columns are added.
SELECT NULL AS total_earnings;
-- Once the columns are added, replace with:
-- SELECT COALESCE(SUM(freight_amount), 0) AS total_earnings
-- FROM ticket
-- WHERE assigned_contractor = :contractor_id
--   AND status = 'COMPLETED'
--   AND payment_status = 'paid';


-- ============================================================
-- PART 2: JOB HISTORY TABLE
-- ============================================================

-- 2.1 Job History with Pagination and Sorting
SELECT
    t.id,
    t.description,
    t.route,
    t.service_type,
    t.status,
    t.anomaly_flag,
    t.anomaly_reason,
    t.start_time,
    t.end_time,
    t.approved_at,
    t.rejected_at,
    t.created_at,
    t.contractor_start_latitude,
    t.contractor_start_longitude,
    t.contractor_end_latitude,
    t.contractor_end_longitude,
    w.description AS work_order_description
FROM ticket t
LEFT JOIN work_order w ON t.work_order_id = w.id
WHERE t.assigned_contractor = :contractor_id
ORDER BY t.created_at DESC
LIMIT :page_size OFFSET :offset;

-- 2.2 Job History Count (for pagination total pages)
SELECT COUNT(*) AS total_count
FROM ticket
WHERE assigned_contractor = :contractor_id;


-- ============================================================
-- PART 3: PERFORMANCE CHARTS
-- ============================================================

-- 3.1 Monthly Job Trend (jobs per month)
SELECT
    DATE_TRUNC('month', t.created_at) AS month,
    COUNT(*) AS job_count,
    COUNT(*) FILTER (WHERE t.status = 'COMPLETED') AS completed_count,
    COUNT(*) FILTER (WHERE t.status IN ('ASSIGNED', 'IN_PROGRESS')) AS active_count
FROM ticket t
WHERE t.assigned_contractor = :contractor_id
GROUP BY DATE_TRUNC('month', t.created_at)
ORDER BY month DESC
LIMIT 12;

-- 3.2 Monthly Completion Trend by end_time (replaces earnings — freightamount removed)
-- Once freight/earnings columns are added, extend this query to include SUM(freight_amount).
SELECT
    DATE_TRUNC('month', t.end_time) AS month,
    COUNT(*) AS completed_count
FROM ticket t
WHERE t.assigned_contractor = :contractor_id
    AND t.status = 'COMPLETED'
    AND t.end_time IS NOT NULL
GROUP BY DATE_TRUNC('month', t.end_time)
ORDER BY month DESC
LIMIT 12;

-- 3.3 Anomaly Trend Over Time (replaces rating trend — no per-ticket rating or history table)
-- NOTE: There is no contractorperformance table and no per-ticket rating column.
-- average_rating is a single scalar on the contractor record.
-- This query tracks anomaly_flag rate per month as the closest available signal.
SELECT
    DATE_TRUNC('month', t.created_at) AS month,
    ROUND(
        COUNT(*) FILTER (WHERE t.anomaly_flag = TRUE)::NUMERIC /
        NULLIF(COUNT(*), 0) * 100, 2
    ) AS anomaly_rate_pct,
    COUNT(*) AS total_tickets
FROM ticket t
WHERE t.assigned_contractor = :contractor_id
GROUP BY DATE_TRUNC('month', t.created_at)
ORDER BY month DESC
LIMIT 12;

-- 3.4 Jobs by Route Type
SELECT
    t.route,
    COUNT(*) AS job_count,
    ROUND(
        COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER() * 100, 2
    ) AS percentage
FROM ticket t
WHERE t.assigned_contractor = :contractor_id
  AND t.route IS NOT NULL
GROUP BY t.route
ORDER BY job_count DESC;

-- 3.5 Jobs by Status
SELECT
    t.status,
    COUNT(*) AS job_count
FROM ticket t
WHERE t.assigned_contractor = :contractor_id
GROUP BY t.status
ORDER BY job_count DESC;


-- ============================================================
-- PART 4: CONTRACTOR PROFILE DATA
-- ============================================================

-- 4.1 Contractor Profile
-- NOTE: table is auth_user (not auth_users or users).
-- Columns: first_name, last_name (not firstname/lastname).
-- Contractor.user_id is the FK back to auth_user.
SELECT
    u.id AS user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.username,
    u.contact_number,
    u.profile_photo,
    u.is_active,
    c.id AS contractor_id,
    c.role,
    c.status AS contractor_status,
    c.employee_number,
    c.average_rating,
    c.years_experience,
    c.is_licensed,
    c.is_insured,
    c.is_certified,
    c.biometric_enrolled,
    c.tickets_completed,
    c.tickets_open
FROM auth_user u
JOIN contractor c ON u.id = c.user_id
WHERE c.id = :contractor_id;

-- 4.2 Compliance / Certification Status
-- NOTE: licenses, insurance, backgroundchecks tables do NOT exist in models.py.
-- is_licensed, is_insured, is_certified are boolean flags on the contractor table.
-- Until those detail tables exist, surface the boolean flags from step 4.1 above.
-- Placeholder query shown below for when the detail tables are added.
SELECT
    c.is_licensed,
    c.is_insured,
    c.is_certified,
    c.biometric_enrolled
FROM contractor c
WHERE c.id = :contractor_id;


-- ============================================================
-- PART 5: NOTIFICATIONS
-- ============================================================

-- 5.1 Unread Notification Count
-- NOTE: notifications table uses user_id (auth_user FK), not contractorid or userid.
-- is_read uses underscore, not isread.
-- To query by contractor, join contractor → auth_user to get the user_id.
SELECT COUNT(*) AS unread_count
FROM notifications n
JOIN contractor c ON c.user_id = n.user_id
WHERE c.id = :contractor_id
  AND n.is_read = FALSE;

-- 5.2 Recent Notifications
SELECT
    n.id,
    n.title,
    n.message,
    n.type,
    n.is_read,
    n.created_at
FROM notifications n
JOIN contractor c ON c.user_id = n.user_id
WHERE c.id = :contractor_id
ORDER BY n.created_at DESC
LIMIT 10;


-- ============================================================
-- PART 6: ACTIVE WORK
-- ============================================================

-- 6.1 Current Active Tickets
-- Status values are uppercase: ASSIGNED, IN_PROGRESS, PENDING_APPROVAL
SELECT
    t.id,
    t.description,
    t.route,
    t.service_type,
    t.status,
    t.start_time,
    t.due_date,
    t.contractor_start_latitude,
    t.contractor_start_longitude,
    t.contractor_end_latitude,
    t.contractor_end_longitude,
    t.anomaly_flag,
    w.description AS work_order_description
FROM ticket t
LEFT JOIN work_order w ON t.work_order_id = w.id
WHERE t.assigned_contractor = :contractor_id
    AND t.status IN ('ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL')
ORDER BY t.start_time DESC;


-- ============================================================
-- COLUMNS PENDING SCHEMA DECISION (do NOT add until confirmed)
-- These appeared in the original queries but don't exist in models.py
-- and are not currently on the roadmap in models.py:
--   ticket.freight_amount / freightamount
--   ticket.payment_status / paymentstatus
--   ticket.ticket_number  / ticketnumber
--   ticket.pickup_location / pickuplocation
--   ticket.delivery_location / deliverylocation
-- If these are added to models.py, update the queries above accordingly.
-- ============================================================
