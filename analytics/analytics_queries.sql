-- ============================================================
-- TR42 Contractor Mobile App - Analytics Queries (CORRECTED)
-- Source of truth: LIVE Supabase database (whjtahksprbdzwdedfas)
--                  Inspected via REST API — May 2026
-- ============================================================
--
-- LIVE TABLE MAP (what is actually in the database):
--   tickets            (plural)   id, work_order_id, vendor_id, assigned_contractor,
--                                 assigned_at, description, priority, status,
--                                 start_location, end_location, designated_route,
--                                 estimated_quantity, unit, special_requirements,
--                                 contractor_notes, anomaly_flag, anomaly_reason,
--                                 start_time, end_time, created_at, updated_at,
--                                 created_by, updated_by
--   work_orders        (plural)   id, name, client_id, vendor_id, assigned_vendor,
--                                 description, start_date, end_date, due_date,
--                                 location, current_status, priority,
--                                 estimated_cost, estimated_duration,
--                                 created_at, updated_at, created_by, updated_by
--   contractors        (plural)   id (FK auth_user.id), vendor_id, manager_id,
--                                 first_name, last_name, license_number,
--                                 expiration_date, contractor_type, status,
--                                 tax_classification, contact_number,
--                                 date_of_birth, address, offline_pin,
--                                 created_at, updated_at, created_by, updated_by
--   auth_user                     id, email, username, password, role,
--                                 is_active, profile_photo, created_at, updated_at
--   notifications                 id, user_id (FK auth_user.id), title, message,
--                                 type, is_read, created_at
--   performance_ratings           rating_id, user_id, rater_id, rating_date,
--                                 reliability_score, professionalism_score,
--                                 work_quality_score, overall_score, comments,
--                                 created_at, updated_at
--   invoices                      id, ticket_id, work_order_id, vendor_id,
--                                 client_id, invoice_number, total_amount,
--                                 subtotal, tax_amount, due_date, status,
--                                 payment_terms, notes, created_at, updated_at
--   vendors            (plural)   id (FK auth_user.id), first_name, last_name,
--                                 created_at, updated_at, created_by, updated_by
--   clients            (plural)   id (FK auth_user.id), first_name, last_name,
--                                 created_at, updated_at, created_by, updated_by
--   sessions                      id, user_id, device_token, session_start,
--                                 session_end, ip_address, user_agent, created_at
--   payments                      payment_id, user_id, payment_date, amount,
--                                 payment_method, payment_status,
--                                 period_start_date, period_end_date, notes
--   shifts                        shift_id, user_id, client_id, shift_date,
--                                 start_time, end_time, hours_worked,
--                                 hourly_rate, shift_status, notes
--   users                         user_id, first_name, last_name, email,
--                                 phone_number, user_type, status, hire_date
--
-- KEY CORRECTIONS vs. original analytics_queries.sql + previous fixes:
--   ticket      → tickets         (plural)
--   work_order  → work_orders     (plural)
--   contractor  → contractors     (plural)
--   notification→ notifications   (plural, and has user_id / is_read / title / type)
--   contractor_performance → performance_ratings
--   contractorid → assigned_contractor
--   contractorperformance → performance_ratings
--   geofenceverified / biometricverified → removed (not in live DB)
--   contractor.average_rating → AVG(performance_ratings.overall_score)
--   contractor.biometric_enrolled → removed (not in live DB)
--   contractor.tickets_completed / tickets_open → removed (not in live DB)
--   contractor.is_licensed / is_insured / is_certified → removed (not in live DB)
--   auth_user.first_name / last_name → NOT on auth_user; on contractors table
--   license / certification / insurance tables → NOT in live DB
--   background_check / drug_test → NOT in live DB
--   contractor.user_id → contractors.id IS the auth_user FK (same field)
--   All PKs are UUID text — never cast to int
-- ============================================================


-- ============================================================
-- PART 1: CONTRACTOR DASHBOARD - STATS CARDS
-- ============================================================

-- 1.1 Total Jobs (tickets assigned to this contractor)
SELECT
    COUNT(*) AS total_jobs
FROM tickets
WHERE assigned_contractor = :contractor_id;

-- 1.2 Completed Jobs
-- NOTE: status values in live DB are plain text — confirm exact casing with seeded data.
-- Using 'COMPLETED' to match ERD intent; adjust if your seed uses lowercase.
SELECT
    COUNT(*) AS completed_jobs
FROM tickets
WHERE assigned_contractor = :contractor_id
    AND UPPER(status) = 'COMPLETED';

-- 1.3 Completion Rate
SELECT
    ROUND(
        COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED')::NUMERIC /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS completion_rate
FROM tickets
WHERE assigned_contractor = :contractor_id;

-- 1.4 Anomaly/Flag Rate
-- anomaly_flag exists on the tickets table.
SELECT
    ROUND(
        COUNT(*) FILTER (WHERE anomaly_flag = TRUE)::NUMERIC /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS flag_rate
FROM tickets
WHERE assigned_contractor = :contractor_id
    AND UPPER(status) = 'COMPLETED';

-- 1.5 Average Rating
-- performance_ratings table: overall_score numeric, user_id FK to auth_user (= contractors.id)
SELECT
    ROUND(AVG(pr.overall_score)::NUMERIC, 2) AS avg_rating
FROM performance_ratings pr
WHERE pr.user_id = :contractor_id;

-- 1.6 Total Earnings
-- payments table has amount + payment_status. user_id FK references users.user_id.
-- contractors.id = auth_user.id, NOT users.user_id (separate legacy table).
-- Joining via auth_user email or leaving as blocked until FK is clarified.
-- If contractors.id maps to payments.user_id directly, use:
SELECT
    COALESCE(SUM(p.amount), 0) AS total_earnings
FROM payments p
WHERE p.user_id = :contractor_id
  AND UPPER(p.payment_status) = 'PAID';


-- ============================================================
-- PART 2: JOB HISTORY TABLE
-- ============================================================

-- 2.1 Job History with Pagination and Sorting
-- NOTE: location is stored as start_location / end_location (text) in live DB.
-- No separate lat/long columns on tickets in live DB.
-- designated_route is the route column equivalent.
SELECT
    t.id,
    t.description,
    t.designated_route          AS route,
    t.status,
    t.priority,
    t.anomaly_flag,
    t.anomaly_reason,
    t.start_time,
    t.end_time,
    t.start_location,
    t.end_location,
    t.contractor_notes,
    t.assigned_at,
    t.created_at,
    w.name                      AS work_order_name,
    w.description               AS work_order_description,
    pr.overall_score            AS performance_rating,
    pr.comments                 AS performance_comments
FROM tickets t
LEFT JOIN work_orders w ON t.work_order_id = w.id
LEFT JOIN performance_ratings pr ON pr.user_id = t.assigned_contractor
ORDER BY t.created_at DESC
LIMIT :page_size OFFSET :offset;

-- 2.2 Job History Count
SELECT COUNT(*) AS total_count
FROM tickets
WHERE assigned_contractor = :contractor_id;


-- ============================================================
-- PART 3: PERFORMANCE CHARTS
-- ============================================================

-- 3.1 Monthly Job Trend
SELECT
    DATE_TRUNC('month', t.created_at) AS month,
    COUNT(*) AS job_count,
    COUNT(*) FILTER (WHERE UPPER(t.status) = 'COMPLETED')    AS completed_count,
    COUNT(*) FILTER (WHERE UPPER(t.status) IN ('ASSIGNED', 'IN_PROGRESS')) AS active_count
FROM tickets t
WHERE t.assigned_contractor = :contractor_id
GROUP BY DATE_TRUNC('month', t.created_at)
ORDER BY month DESC
LIMIT 12;

-- 3.2 Monthly Completion Trend by end_time
SELECT
    DATE_TRUNC('month', t.end_time) AS month,
    COUNT(*) AS completed_count
FROM tickets t
WHERE t.assigned_contractor = :contractor_id
    AND UPPER(t.status) = 'COMPLETED'
    AND t.end_time IS NOT NULL
GROUP BY DATE_TRUNC('month', t.end_time)
ORDER BY month DESC
LIMIT 12;

-- 3.3 Rating Trend Over Time (via performance_ratings)
SELECT
    DATE_TRUNC('month', pr.rating_date) AS month,
    ROUND(AVG(pr.overall_score)::NUMERIC, 2)          AS avg_overall,
    ROUND(AVG(pr.reliability_score)::NUMERIC, 2)      AS avg_reliability,
    ROUND(AVG(pr.professionalism_score)::NUMERIC, 2)  AS avg_professionalism,
    ROUND(AVG(pr.work_quality_score)::NUMERIC, 2)     AS avg_work_quality,
    COUNT(*) AS rating_count
FROM performance_ratings pr
WHERE pr.user_id = :contractor_id
GROUP BY DATE_TRUNC('month', pr.rating_date)
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
FROM tickets t
WHERE t.assigned_contractor = :contractor_id
GROUP BY DATE_TRUNC('month', t.created_at)
ORDER BY month DESC
LIMIT 12;

-- 3.5 Jobs by Route (designated_route in live DB)
SELECT
    t.designated_route           AS route,
    COUNT(*) AS job_count,
    ROUND(
        COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER() * 100, 2
    ) AS percentage
FROM tickets t
WHERE t.assigned_contractor = :contractor_id
  AND t.designated_route IS NOT NULL
GROUP BY t.designated_route
ORDER BY job_count DESC;

-- 3.6 Jobs by Status
SELECT
    t.status,
    COUNT(*) AS job_count
FROM tickets t
WHERE t.assigned_contractor = :contractor_id
GROUP BY t.status
ORDER BY job_count DESC;

-- 3.7 Monthly Earnings Trend (via payments)
SELECT
    DATE_TRUNC('month', p.payment_date) AS month,
    COALESCE(SUM(p.amount), 0)          AS total_paid,
    COUNT(*)                            AS payment_count
FROM payments p
WHERE p.user_id = :contractor_id
  AND UPPER(p.payment_status) = 'PAID'
GROUP BY DATE_TRUNC('month', p.payment_date)
ORDER BY month DESC
LIMIT 12;


-- ============================================================
-- PART 4: CONTRACTOR PROFILE DATA
-- ============================================================

-- 4.1 Contractor Profile
-- auth_user: id, email, username, role, is_active (NO first_name/last_name on auth_user)
-- first_name / last_name are on the contractors table in the live DB.
SELECT
    au.id               AS auth_user_id,
    au.email,
    au.username,
    au.role,
    au.is_active,
    c.id                AS contractor_id,
    c.first_name,
    c.last_name,
    c.contact_number,
    c.contractor_type,
    c.status            AS contractor_status,
    c.license_number,
    c.expiration_date   AS license_expiration_date,
    c.tax_classification,
    c.address,
    c.vendor_id,
    ROUND(AVG(pr.overall_score)::NUMERIC, 2) AS avg_rating
FROM contractors c
JOIN auth_user au ON au.id = c.id
LEFT JOIN performance_ratings pr ON pr.user_id = c.id
WHERE c.id = :contractor_id
GROUP BY au.id, c.id;

-- 4.2 Recent Performance Ratings (detail)
-- license / certification / insurance detail tables do NOT exist in live DB.
-- license_number and expiration_date are scalar fields on the contractors table.
SELECT
    pr.rating_id,
    pr.rating_date,
    pr.reliability_score,
    pr.professionalism_score,
    pr.work_quality_score,
    pr.overall_score,
    pr.comments
FROM performance_ratings pr
WHERE pr.user_id = :contractor_id
ORDER BY pr.rating_date DESC
LIMIT 20;


-- ============================================================
-- PART 5: NOTIFICATIONS
-- ============================================================
--
-- Live DB: notifications (plural), with user_id, title, message, type, is_read, created_at
-- user_id is a direct FK to auth_user.id (= contractors.id in live DB)

-- 5.1 Unread Notification Count
SELECT COUNT(*) AS unread_count
FROM notifications
WHERE user_id = :contractor_id
  AND is_read = FALSE;

-- 5.2 Recent Notifications
SELECT
    id,
    title,
    message,
    type,
    is_read,
    created_at
FROM notifications
WHERE user_id = :contractor_id
ORDER BY created_at DESC
LIMIT 20;

-- 5.3 Mark notification as read (UPDATE, not SELECT)
-- UPDATE notifications SET is_read = TRUE WHERE id = :notification_id AND user_id = :contractor_id;


-- ============================================================
-- PART 6: ACTIVE WORK
-- ============================================================

-- 6.1 Current Active Tickets
SELECT
    t.id,
    t.description,
    t.designated_route      AS route,
    t.status,
    t.priority,
    t.start_time,
    t.end_time,
    t.start_location,
    t.end_location,
    t.anomaly_flag,
    t.contractor_notes,
    w.name                  AS work_order_name,
    w.description           AS work_order_description,
    w.location              AS work_order_location
FROM tickets t
LEFT JOIN work_orders w ON t.work_order_id = w.id
WHERE t.assigned_contractor = :contractor_id
    AND UPPER(t.status) IN ('ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL')
ORDER BY t.start_time DESC;


-- ============================================================
-- PART 7: SHIFTS (live DB has this — not in original queries)
-- ============================================================

-- 7.1 Recent Shifts
SELECT
    s.shift_id,
    s.shift_date,
    s.start_time,
    s.end_time,
    s.hours_worked,
    s.hourly_rate,
    ROUND((s.hours_worked * s.hourly_rate)::NUMERIC, 2) AS earnings,
    s.shift_status,
    s.notes
FROM shifts s
WHERE s.user_id = :contractor_id
ORDER BY s.shift_date DESC
LIMIT 20;

-- 7.2 Monthly Shift Summary
SELECT
    DATE_TRUNC('month', s.shift_date) AS month,
    SUM(s.hours_worked)               AS total_hours,
    ROUND(SUM(s.hours_worked * s.hourly_rate)::NUMERIC, 2) AS total_earnings,
    COUNT(*) AS shift_count
FROM shifts s
WHERE s.user_id = :contractor_id
GROUP BY DATE_TRUNC('month', s.shift_date)
ORDER BY month DESC
LIMIT 12;


-- ============================================================
-- COLUMNS / TABLES CONFIRMED NOT IN LIVE DATABASE
--   (present in ERD but not yet migrated to Supabase)
--   contractor.average_rating (scalar)   → use performance_ratings
--   contractor.biometric_enrolled        → not in live DB
--   contractor.tickets_completed/open    → not in live DB
--   contractor.is_licensed/insured/certified → not in live DB
--   contractor.years_experience          → not in live DB
--   contractor.employee_number           → not in live DB
--   license table                        → not in live DB
--   certification table                  → not in live DB
--   insurance table                      → not in live DB
--   background_check table               → not in live DB
--   drug_test table                      → not in live DB
--   contractor_performance table         → live DB uses performance_ratings
--   ticket.route                         → live DB uses designated_route
--   ticket.contractor_start/end_lat/lng  → live DB uses start_location/end_location (text)
--   ticket.service_type                  → not in live DB tickets table
--   ticket.due_date / approved_at        → not in live DB tickets table
--   notification (singular)              → live DB uses notifications (plural)
--   work_order (singular)                → live DB uses work_orders (plural)
--   ticket (singular)                    → live DB uses tickets (plural)
--   contractor (singular)                → live DB uses contractors (plural)
-- ============================================================
