-- ============================================================
-- TR42 Contractor Mobile App - Analytics Queries (CORRECTED)
-- Schema source of truth: ERD @ dbdiagram.io/d/Vendor-Database-69b5ce5578c6c4bc7ae4472c
--                         schema.sql generated from that ERD
-- ============================================================
--
-- KEY CORRECTIONS vs. original analytics_queries.sql:
--   tickets           → ticket        (table name)
--   workorders        → work_order    (table name)
--   auth_users/users  → auth_user     (table name)
--   notifications     → notification  (table name, singular)
--   contractorid      → assigned_contractor
--   createdat         → created_at
--   anomalyflag       → anomaly_flag
--   pickupdatetime    → start_time
--   deliverydatetime  → end_time
--   status 'completed'→ 'COMPLETED'   (enum is uppercase)
--   contractor_id     → TEXT (UUID), NOT integer — never CAST to int
--   contractorperformance → contractor_performance (DOES exist in ERD)
--   geofenceverified  → REMOVED (not in schema; use anomaly_flag)
--   biometricverified → REMOVED (not in schema; use contractor.biometric_enrolled)
--   ticketnumber / pickup_location / delivery_location / freight_amount /
--   payment_status    → REMOVED (not in schema)
--   notification.isread / userid / title / type → REMOVED (not in schema)
--                     → notification has: message, recipient, level, created_at
-- ============================================================


-- ============================================================
-- PART 1: CONTRACTOR DASHBOARD - STATS CARDS
-- ============================================================

-- 1.1 Total Jobs (tickets assigned to this contractor)
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
-- anomaly_flag is the correct column on ticket.
-- geofenceverified and biometricverified do NOT exist in the schema.
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
-- contractor_performance EXISTS in the ERD with (contractor_id, ticket_id, rating integer).
-- Use the live average from contractor_performance.
-- contractor.average_rating is a denormalized cache of the same value.
SELECT
    ROUND(AVG(cp.rating)::NUMERIC, 2) AS avg_rating
FROM contractor_performance cp
WHERE cp.contractor_id = :contractor_id;

-- 1.6 Total Earnings — BLOCKED
-- freight_amount and payment_status do NOT exist anywhere in the schema.
-- Returning NULL until the schema decision is made.
SELECT NULL AS total_earnings;
-- Once the columns are added to ticket, replace with:
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
    t.priority,
    t.anomaly_flag,
    t.anomaly_reason,
    t.start_time,
    t.end_time,
    t.due_date,
    t.approved_at,
    t.rejected_at,
    t.created_at,
    t.contractor_start_latitude,
    t.contractor_start_longitude,
    t.contractor_end_latitude,
    t.contractor_end_longitude,
    w.description AS work_order_description,
    cp.rating      AS performance_rating,
    cp.comments    AS performance_comments
FROM ticket t
LEFT JOIN work_order w ON t.work_order_id = w.id
LEFT JOIN contractor_performance cp ON cp.ticket_id = t.id
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
    COUNT(*) FILTER (WHERE t.status = 'COMPLETED')   AS completed_count,
    COUNT(*) FILTER (WHERE t.status IN ('ASSIGNED', 'IN_PROGRESS')) AS active_count
FROM ticket t
WHERE t.assigned_contractor = :contractor_id
GROUP BY DATE_TRUNC('month', t.created_at)
ORDER BY month DESC
LIMIT 12;

-- 3.2 Monthly Completion Trend by end_time
-- NOTE: freight_amount removed — not in schema.
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

-- 3.3 Rating Trend Over Time
-- contractor_performance EXISTS in the ERD (contractor_id, ticket_id, rating integer).
-- Per-ticket rating history is available — this query is now fully supported.
SELECT
    DATE_TRUNC('month', cp.created_at) AS month,
    ROUND(AVG(cp.rating)::NUMERIC, 2)  AS avg_rating,
    COUNT(*)                            AS rating_count
FROM contractor_performance cp
WHERE cp.contractor_id = :contractor_id
GROUP BY DATE_TRUNC('month', cp.created_at)
ORDER BY month DESC
LIMIT 12;

-- 3.4 Anomaly Trend Over Time
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

-- 3.5 Jobs by Route Type
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

-- 3.6 Jobs by Status
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
-- auth_user table confirmed from schema (not auth_users or users).
-- Columns: first_name, last_name, contact_number, email, username, is_active, profile_photo (bytea).
-- contractor.user_id is the FK to auth_user.id.
SELECT
    u.id               AS user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.username,
    u.contact_number,
    u.is_active,
    c.id               AS contractor_id,
    c.role,
    c.status           AS contractor_status,
    c.employee_number,
    c.average_rating,
    c.years_experience,
    c.is_licensed,
    c.is_insured,
    c.is_certified,
    c.biometric_enrolled,
    c.tickets_completed,
    c.tickets_open,
    c.is_onboarded,
    c.is_subcontractor,
    c.is_fte
FROM auth_user u
JOIN contractor c ON u.id = c.user_id
WHERE c.id = :contractor_id;

-- 4.2 Licenses
-- license table EXISTS in schema.
SELECT
    l.id,
    l.license_type,
    l.license_number,
    l.license_state,
    l.license_expiration_date,
    l.license_verified,
    l.license_verified_at
FROM license l
WHERE l.contractor_id = :contractor_id
ORDER BY l.license_expiration_date DESC;

-- 4.3 Certifications
-- certification table EXISTS in schema.
SELECT
    c.id,
    c.certification_name,
    c.certifying_body,
    c.certification_number,
    c.issue_date,
    c.expiration_date,
    c.certification_verified
FROM certification c
WHERE c.contractor_id = :contractor_id
ORDER BY c.expiration_date DESC;

-- 4.4 Insurance
-- insurance table EXISTS in schema.
SELECT
    i.id,
    i.insurance_type,
    i.policy_number,
    i.provider_name,
    i.coverage_amount,
    i.effective_date,
    i.expiration_date,
    i.insurance_verified,
    i.additional_insurance_required
FROM insurance i
WHERE i.contractor_id = :contractor_id
ORDER BY i.expiration_date DESC;

-- 4.5 Background Check
SELECT
    b.id,
    b.background_check_passed,
    b.background_check_date,
    b.background_check_provider
FROM background_check b
WHERE b.contractor_id = :contractor_id
ORDER BY b.background_check_date DESC
LIMIT 1;

-- 4.6 Drug Test
SELECT
    d.id,
    d.drug_test_passed,
    d.drug_test_date
FROM drug_test d
WHERE d.contractor_id = :contractor_id
ORDER BY d.drug_test_date DESC
LIMIT 1;


-- ============================================================
-- PART 5: NOTIFICATIONS
-- ============================================================
--
-- IMPORTANT SCHEMA NOTES:
--   Table name: notification (singular, NOT notifications)
--   Columns: id, message, recipient (text), level (SUCCESS/DANGER/INFO), created_at
--   NO is_read column — unread count is NOT supported by the current schema.
--   NO title column.
--   NO type column.
--   NO user_id column — recipient is a plain text field (assumed to store auth_user.id).
--
-- To query by contractor: join contractor → auth_user to resolve recipient.

-- 5.1 Recent Notifications
SELECT
    n.id,
    n.message,
    n.level,
    n.created_at
FROM notification n
JOIN contractor c ON c.user_id = n.recipient
WHERE c.id = :contractor_id
ORDER BY n.created_at DESC
LIMIT 20;

-- 5.2 Notification Count (total, not unread — is_read does not exist in schema)
SELECT COUNT(*) AS total_notifications
FROM notification n
JOIN contractor c ON c.user_id = n.recipient
WHERE c.id = :contractor_id;


-- ============================================================
-- PART 6: ACTIVE WORK
-- ============================================================

-- 6.1 Current Active Tickets
-- Status values are uppercase per schema enum:
-- UNASSIGNED, ASSIGNED, IN_PROGRESS, COMPLETED, PENDING_APPROVAL, APPROVED, REJECTED
SELECT
    t.id,
    t.description,
    t.route,
    t.service_type,
    t.status,
    t.priority,
    t.start_time,
    t.due_date,
    t.estimated_duration,
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
-- COLUMNS CONFIRMED NOT IN SCHEMA (do NOT add until schema updated)
--   ticket.freight_amount / freightamount
--   ticket.payment_status / paymentstatus
--   ticket.ticket_number  / ticketnumber
--   ticket.pickup_location / pickuplocation
--   ticket.delivery_location / deliverylocation
--   notification.is_read
--   notification.title
--   notification.type
--   notification.user_id
-- ============================================================
